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

const interviewSystemPrompt = `你是 Codex Long Task Starter 的 AI 项目访谈官。
你不是模板填空器。你要通过动态追问，把模糊项目想法转成可执行 ProjectSpec。
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
每轮最多 3-5 个问题。问题必须覆盖技术实现、UI/UX、方案权衡、风险、边缘情况、验收标准。
如果用户说“不懂”“没有计划”“后续再考虑”“暂时不确定”，不要反复追问同一个专业问题；把它记录到 unresolvedQuestions、assumptions 或 missingFields，并继续询问更基础、更容易回答的问题。
如果用户是代码小白，避免直接问框架细节、部署细节、数据库范式等专业问题，优先问使用者、场景、页面、输入输出、成功标准。
如果用户没有明确说过关键事实，不要编造；用 missingFields 标出。
confidenceScore 是 0 到 1，但是否能生成还要受必填信息完整性约束。`;

export async function runInterviewTurn(config, context) {
  if (!hasUsableApiConfig(config)) return createExampleInterviewTurn(context);
  const content = await callOpenAICompatible(config, [
    { role: "system", content: interviewSystemPrompt },
    { role: "user", content: JSON.stringify(context, null, 2) }
  ]);
  const result = await parseAndValidate(config, content, InterviewTurnResultSchema, "InterviewTurnResult");
  const known = context?.draftSpec || {};
  const completeness = getSpecCompleteness({ ...known, ...result.extractedFacts });
  return {
    ...result,
    confidenceScore: Math.min(result.confidenceScore, completeness.score / 100),
    missingFields: Array.from(new Set([...result.missingFields, ...completeness.missing])),
    isReadyToGenerateSpec: result.isReadyToGenerateSpec && completeness.canGenerate
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
      }
    ]
  });
}

const specSystemPrompt = `你是 ProjectSpec 生成器。根据访谈上下文生成严格 JSON，必须符合 ProjectSpecSchema。
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
