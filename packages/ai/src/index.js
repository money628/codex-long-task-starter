import {
  InterviewTurnResultSchema,
  createExampleSpec,
  generateMarkdownFilesFromSpec,
  getSpecCompleteness,
  parseJsonObject,
  validateInterviewTurn,
  validateProjectSpec
} from "@codex-starter/core";

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").replace(/\/+$/, "");
}

function normalizeApiConfig(config = {}) {
  return {
    ...config,
    baseUrl: normalizeBaseUrl(String(config.baseUrl || "").trim()),
    apiKey: String(config.apiKey || "").trim(),
    modelName: String(config.modelName || "").trim()
  };
}

export function hasUsableApiConfig(config) {
  const normalized = normalizeApiConfig(config);
  return Boolean(normalized.baseUrl && normalized.apiKey && normalized.modelName);
}

function shouldUseLocalProxy(config) {
  return config?.requestMode !== "direct" && typeof window !== "undefined";
}

export async function callOpenAICompatible(config, messages, { json = true, signal } = {}) {
  const normalizedConfig = normalizeApiConfig(config);
  if (!hasUsableApiConfig(normalizedConfig)) {
    throw new Error("请先在模型配置页填写 Base URL、API Key 和 Model Name。");
  }
  const requestBody = {
    model: normalizedConfig.modelName,
    temperature: Number(normalizedConfig.temperature ?? 0.7),
    max_tokens: Number(normalizedConfig.maxTokens ?? 4096),
    messages,
    response_format: json ? { type: "json_object" } : undefined
  };
  const useLocalProxy = shouldUseLocalProxy(normalizedConfig);
  const url = useLocalProxy ? "/api/chat-completions" : `${normalizedConfig.baseUrl}/chat/completions`;
  async function send(body) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(useLocalProxy ? {} : { Authorization: `Bearer ${normalizedConfig.apiKey}` })
      },
      body: JSON.stringify(
        useLocalProxy
          ? { baseUrl: normalizedConfig.baseUrl, apiKey: normalizedConfig.apiKey, payload: body }
          : body
      ),
      signal
    });
  }
  async function readError(response) {
    let detail = "";
    try {
      const payload = await response.json();
      detail = payload?.error?.message || payload?.message || JSON.stringify(payload);
    } catch {
      detail = await response.text();
    }
    return detail;
  }
  let response = await send(requestBody);
  if (!response.ok && json) {
    const detail = await readError(response);
    if (/response_format|json_object|JSON mode/i.test(detail)) {
      const fallbackBody = { ...requestBody };
      delete fallbackBody.response_format;
      response = await send(fallbackBody);
    } else {
      throw new Error(`模型请求失败：HTTP ${response.status}${detail ? ` - ${detail.slice(0, 260)}` : ""}`);
    }
  }
  if (!response.ok) {
    const detail = await readError(response);
    throw new Error(`模型请求失败：HTTP ${response.status}${detail ? ` - ${detail.slice(0, 260)}` : ""}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("模型响应为空。");
  return content;
}

export async function testConnection(config) {
  const content = await callOpenAICompatible(
    { ...config, maxTokens: 64, temperature: 0 },
    [
      { role: "system", content: "你是 API 连通性检测器，只输出严格 JSON。" },
      { role: "user", content: "输出 {\"ok\":true,\"message\":\"连接成功\"}" }
    ],
    { json: true }
  );
  const parsed = parseJsonObject(content);
  return { ok: Boolean(parsed.ok), message: parsed.message || "连接成功" };
}

export async function repairJsonWithModel(config, raw, error, schemaName) {
  const content = await callOpenAICompatible(
    config,
    [
      { role: "system", content: "你是 JSON 修复器。只输出修复后的严格 JSON，不要 Markdown，不要解释。" },
      {
        role: "user",
        content: `目标 Schema：${schemaName}\n校验错误：${String(error).slice(0, 2000)}\n原始内容：\n${String(raw).slice(0, 12000)}`
      }
    ],
    { json: true }
  );
  return parseJsonObject(content);
}

async function parseAndValidate(config, raw, schema, schemaName) {
  try {
    return schema.parse(parseJsonObject(raw));
  } catch (error) {
    const repaired = await repairJsonWithModel(config, raw, error, schemaName);
    return schema.parse(repaired);
  }
}

async function parseAndValidateProjectSpec(config, raw) {
  try {
    return validateProjectSpec(parseJsonObject(raw));
  } catch (error) {
    const repaired = await repairJsonWithModel(config, raw, error, "ProjectSpec");
    return validateProjectSpec(repaired);
  }
}

function normalizeQuestionText(value) {
  return String(value || "")
    .replace(/[？?，,。.：:\s]/g, "")
    .toLowerCase();
}

const questionTopicGroups = [
  ["data-review-weight", ["权重", "点赞", "收藏", "评论", "关注", "私信", "数据复盘", "指标", "评分"]],
  ["login-session", ["登录", "扫码", "cookie", "session", "登录态", "自动登录", "保存状态"]],
  ["crawler-automation", ["抓取", "采集", "爬虫", "自动化", "浏览器", "反爬"]],
  ["deployment", ["部署", "服务器", "vercel", "netlify", "云", "上线"]],
  ["database", ["数据库", "表结构", "schema", "存储", "持久化"]],
  ["tech-stack", ["框架", "技术栈", "架构", "后端", "前端"]],
  ["ai-model-choice", ["ai模型", "模型来生成", "哪种模型", "大模型", "gpt", "deepseek", "kimi", "qwen"]],
  ["auth-account-system", ["用户登录", "登录/注册", "注册", "账号系统", "用户系统"]],
  ["acceptance", ["验收", "完成标准", "donewhen", "怎么算完成"]],
  ["target-user", ["用户", "目标人群", "谁用", "使用者"]],
  ["mvp-scope", ["mvp", "第一版", "核心功能", "范围", "不做"]]
];

function questionTopicSignature(value) {
  const normalized = normalizeQuestionText(value);
  const matched = questionTopicGroups
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(normalizeQuestionText(keyword))))
    .map(([topic]) => topic);
  if (matched.length) return matched.sort().join("|");
  return normalized.slice(0, 32);
}

function shouldDropForBeginnerAgentFlow(question, context = {}) {
  const normalized = normalizeQuestionText(question.question);
  const draftText = JSON.stringify(context?.projectDraft || {});
  const isBeginner = /代码小白|小白|不懂代码/.test(draftText);
  const isLocalFirst = /本地|local|不上传|不做用户系统|不是平台自动化/.test(draftText);
  if (!isBeginner) return false;
  if (/哪种模型|ai模型|模型来生成|gpt|deepseek|kimi|qwen/.test(normalized)) return true;
  if (/数据库|schema|框架|技术栈|部署|cookie|session|登录态/.test(normalized)) return true;
  if (isLocalFirst && /登录注册|用户登录|账号系统|用户系统/.test(normalized)) return true;
  return false;
}

function limitAndDedupeQuestions(result, askedQuestions, context = {}) {
  const asked = new Set(askedQuestions.map(normalizeQuestionText).filter(Boolean));
  const askedTopics = new Set(askedQuestions.map(questionTopicSignature).filter(Boolean));
  const seen = new Set();
  const seenTopics = new Set();
  const questions = [];
  for (const question of result.questions || []) {
    const normalized = normalizeQuestionText(question.question);
    const topic = questionTopicSignature(question.question);
    if (shouldDropForBeginnerAgentFlow(question, context)) continue;
    if (!normalized || asked.has(normalized) || seen.has(normalized) || askedTopics.has(topic) || seenTopics.has(topic)) continue;
    seen.add(normalized);
    seenTopics.add(topic);
    questions.push(question);
    if (questions.length >= 3) break;
  }
  return {
    ...result,
    questions: questions.length ? questions : [
      {
        id: "agent-ready-closeout",
        type: "text",
        question: "之前的问题已经记录过了。现在只需补充：还有哪些业务边界、禁忌或验收标准必须告诉 Codex/OpenCode？没有就写“没有，交给 Agent 推荐”。",
        why: "避免重复消耗 token，把专业实现细节交给 Agent 在开发阶段推荐和验证。",
        required: false,
        options: []
      }
    ],
    isReadyToGenerateSpec: result.isReadyToGenerateSpec || questions.length === 0
  };
}

function createFallbackInterviewTurn(context = {}, reason = "") {
  const round = context.transcript?.length || 0;
  return validateInterviewTurn({
    summary: `模型返回格式不稳定，已切换为本地兜底访谈。${round >= 1 ? "当前信息可以先生成初版 ProjectSpec，再由 Codex/OpenCode 在执行阶段补齐技术细节。" : "请先补充项目大方向。"}`,
    extractedFacts: {
      projectName: context.projectDraft?.projectName || "未命名项目",
      oneLineIdea: context.projectDraft?.oneLineIdea || "UNCONFIRMED",
      userBackground: context.projectDraft?.userBackground || "UNCONFIRMED",
      codingExperience: context.projectDraft?.codingExperience || "代码小白"
    },
    missingFields: round >= 1 ? ["待 Codex/OpenCode Agent 在执行阶段对齐技术细节"] : ["目标用户", "MVP 范围", "验收标准"],
    riskFlags: [reason ? `模型结构校验失败：${String(reason).slice(0, 120)}` : "模型结构校验失败，已启用兜底问题。"],
    confidenceScore: round >= 1 ? 0.68 : 0.42,
    questions: [
      {
        id: "agent-ready-summary",
        type: "text",
        question: round >= 1 ? "还有哪些业务边界、禁忌或验收标准必须告诉 Codex/OpenCode？没有就写“没有，交给 Agent 推荐”。" : "请用几句话说明项目给谁用、解决什么问题、第一版最重要的结果是什么。",
        why: "这份报告主要交给 Agent 执行，技术方案不需要你逐项决定，只需要确认大方向和边界。",
        required: false,
        options: []
      }
    ],
    isReadyToGenerateSpec: round >= 1
  });
}

const interviewSystemPrompt = `你是 Codex 长任务启动器 / Codex Long Task Starter 的 AI 项目访谈官。
你不是模板填空器，也不是普通技术咨询顾问。你要通过动态追问，把模糊项目想法转成可交给 Codex / OpenCode 执行的 ProjectSpec。
最终报告的主要读者不是用户本人，而是可以读写文件、运行命令、操作浏览器、调试项目的 AI 编程 Agent。
开始访谈时必须先理解用户是谁、是否代码小白、是否熟悉产品/开发概念，并用匹配用户水平的语言提问。
必须输出严格 JSON，结构为：
{
  "summary": "本轮理解摘要",
  "extractedFacts": {},
  "missingFields": [],
  "riskFlags": [],
  "confidenceScore": 0.0,
  "questions": [
    {
      "id": "q1",
      "type": "single | multi | text",
      "question": "问题内容",
      "why": "为什么问这个问题",
      "required": true,
      "options": [{"label":"选项","description":"说明"}]
    }
  ],
  "isReadyToGenerateSpec": false
}
每轮最多 3 个问题，优先问业务目标、用户场景、数据来源、权限边界、页面流程、验收标准和不能做什么。
不要反复追问已经问过或用户已经表示不懂/后续再考虑的主题。根据 transcript 中的历史问题去重。
不要把实现细节抛给代码小白做决策。框架、数据库、cookie 持久化、扫码登录状态保存、浏览器自动化、部署方式、文件结构、反爬处理等技术方案，默认交给 Codex/OpenCode Agent 在实现阶段推荐和验证。
不要问代码小白“使用哪种 AI 模型”“选择哪个大模型”“数据库怎么设计”“是否需要登录注册”这类实现/架构问题；如果项目已说明本地单用户或不是平台自动化，默认不做用户系统和平台自动化。
当技术方案确实需要记录时，用“交给 Agent 推荐”作为选项，并把结果写入 assumptions、recommendations 或 unresolvedQuestions。
示例：不要问“你希望 cookie 保存到哪里？”；应该问“是否允许 Agent 在本机保存登录状态以减少重复扫码？”，选项包含“允许本机保存”“每次都扫码”“交给 Agent 推荐”。
如果用户说“不懂”“没有计划”“后续再考虑”“暂时不确定”“我是小白”，不要继续追问同一个专业问题；把它记录到 unresolvedQuestions、assumptions 或 missingFields，并继续询问更基础、更容易回答的问题。
如果用户是代码小白，避免直接问框架细节、部署细节、数据库范式、登录态存储等专业问题，优先问使用者、场景、页面、输入输出、成功标准。
如果已经完成至少 2 轮访谈，且项目目标、目标用户、MVP 范围、数据来源、验收标准大体明确，可以将 isReadyToGenerateSpec 设为 true，不要为了技术细节无限追问。
如果用户没有明确说过关键事实，不要编造；用 missingFields 标出。
confidenceScore 是 0 到 1，但是否能生成还要受必填信息完整性约束。`;

export async function runInterviewTurn(config, context) {
  if (!hasUsableApiConfig(config)) return createExampleInterviewTurn(context);
  const askedQuestions = (context?.transcript || [])
    .flatMap((turn) => turn.questions || [])
    .map((question) => question.question)
    .filter(Boolean);
  const content = await callOpenAICompatible(config, [
    { role: "system", content: interviewSystemPrompt },
    {
      role: "user",
      content: JSON.stringify(
        {
          ...context,
          reportAudience: "Codex/OpenCode Agent，可以操作电脑、运行命令、读写文件和调试项目。用户只需要确认业务意图、边界和验收标准；专业实现细节应由 Agent 推荐。",
          askedQuestions,
          instruction: "请不要重复 askedQuestions 中的主题。遇到代码小白或技术细节，提供“交给 Agent 推荐”选项，并尽快在信息足够时结束访谈。"
        },
        null,
        2
      )
    }
  ]);
  let parsedResult;
  try {
    parsedResult = await parseAndValidate(config, content, InterviewTurnResultSchema, "InterviewTurnResult");
  } catch (error) {
    return createFallbackInterviewTurn(context, error?.message || error);
  }
  const result = limitAndDedupeQuestions(parsedResult, askedQuestions, context);
  const known = context?.draftSpec || {};
  const completeness = getSpecCompleteness({ ...known, ...result.extractedFacts });
  const hasEnoughInterviewForDraft = (context?.transcript?.length || 0) >= 2 && completeness.score >= 35;
  const shouldCloseOut = result.isReadyToGenerateSpec && (context?.transcript?.length || 0) >= 1;
  return {
    ...result,
    confidenceScore: Math.max(Math.min(result.confidenceScore, completeness.score / 100), hasEnoughInterviewForDraft ? 0.66 : 0),
    missingFields: Array.from(new Set([...result.missingFields, ...completeness.missing])),
    isReadyToGenerateSpec: (result.isReadyToGenerateSpec && completeness.canGenerate) || hasEnoughInterviewForDraft || shouldCloseOut
  };
}

export function createExampleInterviewTurn(context = {}) {
  const round = context.transcript?.length || 0;
  const base = {
    summary:
      round === 0
        ? "示例模式：已理解项目初步想法，但这不是高质量真实 AI 访谈。配置 API Key 后可获得动态追问。"
        : "示例模式：根据你的回答更新了项目理解。真实模式会由模型继续判断追问方向。",
    extractedFacts: {
      projectName: context.projectDraft?.projectName || "Project Alpha",
      oneLineIdea: context.projectDraft?.oneLineIdea || "UNCONFIRMED",
      techStackPreference: context.projectDraft?.techStackPreference || ["React", "Tailwind", "TypeScript"]
    },
    missingFields: ["目标用户", "MVP 范围", "非目标", "数据来源", "验收标准", "测试方式", "Done When"],
    riskFlags: ["当前为示例模式，不能替代真实模型访谈。", "关键范围未确认前不应直接进入开发。"],
    confidenceScore: round === 0 ? 0.28 : 0.46,
    isReadyToGenerateSpec: false
  };
  return validateInterviewTurn({
    ...base,
    questions: [
      {
        id: "target-users",
        type: "multi",
        question: "第一版最应该服务哪一类用户？",
        why: "目标用户会直接决定 MVP 的功能优先级、页面复杂度和验收标准。",
        required: true,
        options: [
          { label: "独立开发者", description: "重视快速启动、低配置成本和清晰指令。" },
          { label: "小团队", description: "需要协作规范、任务拆分和交接文档。" },
          { label: "企业内部", description: "更关注权限、合规和部署边界。" }
        ]
      },
      {
        id: "mvp-boundary",
        type: "text",
        question: "第一版必须完成的 3 个核心能力是什么？哪些明确不做？",
        why: "这能防止 MVP 范围膨胀，并让后续 Markdown 文件具备可执行边界。",
        required: true,
        options: []
      },
      {
        id: "acceptance",
        type: "text",
        question: "你认为怎样才算这个项目第一版完成？请写出可验证标准。",
        why: "Codex/OpenCode 长任务需要明确 Done When，否则容易停在“看起来差不多”。",
        required: true,
        options: []
      },
      {
        id: "agent-scope",
        type: "single",
        question: "遇到登录、抓取、部署、文件结构这类技术实现问题时，你希望怎么处理？",
        why: "这份报告主要交给 Codex/OpenCode Agent 执行，很多专业方案可以由 Agent 在实现阶段推荐和验证。",
        required: false,
        options: [
          { label: "交给 Agent 推荐", description: "我只确认业务目标，技术细节由 Agent 选择合理方案。" },
          { label: "每次问我确认", description: "涉及技术取舍时先停下来问我。" },
          { label: "先用默认稳妥方案", description: "优先本地、安全、简单，后续再调整。" }
        ]
      }
    ]
  });
}

const specSystemPrompt = `你是 ProjectSpec 生成器。根据访谈上下文生成严格 JSON，必须符合 ProjectSpecSchema。
ProjectSpec 的读者是 Codex/OpenCode 这类可以操作电脑、运行命令、读写文件和调试项目的智能体，不是只给普通用户阅读的问卷报告。
字段包括 projectName, projectType, oneLineIdea, targetUsers, userPainPoints, coreGoal, mvpScope, outOfScope,
coreFeatures, rolesAndPermissions, pagesOrModules, dataSources, externalDependencies, techStackPreference,
deploymentTarget, monetizationIntent, constraints, forbiddenActions, risks, assumptions, recommendations,
acceptanceCriteria, doneWhen, testStrategy, milestones, unresolvedQuestions, interviewSummary。
milestones 中每项必须包含 name, goal, tasks, acceptanceCriteria。
必填完整度字段不能只写 UNCONFIRMED：targetUsers, coreGoal, mvpScope, outOfScope, techStackPreference,
dataSources, externalDependencies, pagesOrModules, rolesAndPermissions, acceptanceCriteria, testStrategy,
deploymentTarget, risks, doneWhen。
如果上下文已有足够线索，请写出具体内容；只有完全缺失且无法合理推断时才写 UNCONFIRMED，并把问题写入 unresolvedQuestions。
不确定内容必须写 UNCONFIRMED。不要编造用户没说过的关键事实；工程建议放 assumptions 或 recommendations。
用户不懂的技术细节不要视为阻塞。把扫码登录、cookie/session、本地文件、浏览器自动化、抓取策略、部署方式等实现选择写入 recommendations 或 unresolvedQuestions，让 Agent 实现时对齐。
只输出 JSON。`;

const specCompletionPrompt = `你是 ProjectSpec 完整度补齐器。只输出严格 JSON。
你的任务是在不泄露 API Key、不编造敏感事实的前提下，根据访谈上下文和已有 ProjectSpec 补齐缺失必填字段。
规则：
1. 保留已有明确字段。
2. 对缺失字段，如果上下文、项目草稿、用户回答或工程常识足够支持，请写具体内容。
3. 若仍无法确定，保留 UNCONFIRMED，并在 unresolvedQuestions 写明需要问用户什么。
4. milestones 每项必须包含 name, goal, tasks, acceptanceCriteria。
5. 输出必须符合 ProjectSpecSchema。`;

export async function buildProjectSpec(config, context) {
  if (!hasUsableApiConfig(config)) return createExampleSpec(context.projectDraft);
  const content = await callOpenAICompatible(config, [
    { role: "system", content: specSystemPrompt },
    { role: "user", content: JSON.stringify(context, null, 2) }
  ]);
  const firstPass = await parseAndValidateProjectSpec(config, content);
  const completeness = getSpecCompleteness(firstPass);
  if (completeness.canGenerate) return firstPass;
  const completion = await callOpenAICompatible(config, [
    { role: "system", content: specCompletionPrompt },
    {
      role: "user",
      content: JSON.stringify(
        {
          missingRequiredFields: completeness.missing,
          context,
          currentSpec: firstPass
        },
        null,
        2
      )
    }
  ]);
  return parseAndValidateProjectSpec(config, completion);
}

const markdownSystemPrompt = `你是 Codex/OpenCode 长任务文件生成器。
根据 ProjectSpec 生成 7 个 Markdown 文件，必须输出严格 JSON：
{"Prompt.md":"...","Plan.md":"...","Implement.md":"...","Documentation.md":"...","Continuity.md":"...","AGENTS.md":"...","START.md":"..."}
内容必须贴合该项目，不要泛泛而谈。不要写入任何 API Key、Token、账号凭证。START.md 必须适合小白复制使用。`;

export async function buildMarkdownFiles(config, spec) {
  const validSpec = validateProjectSpec(spec);
  if (!hasUsableApiConfig(config)) return generateMarkdownFilesFromSpec(validSpec);
  try {
    const content = await callOpenAICompatible(config, [
      { role: "system", content: markdownSystemPrompt },
      { role: "user", content: JSON.stringify(validSpec, null, 2) }
    ]);
    const parsed = parseJsonObject(content);
    const files = {};
    for (const name of Object.keys(generateMarkdownFilesFromSpec(validSpec))) {
      files[name] = typeof parsed[name] === "string" && parsed[name].trim() ? parsed[name] : generateMarkdownFilesFromSpec(validSpec)[name];
    }
    return files;
  } catch {
    return generateMarkdownFilesFromSpec(validSpec);
  }
}
