import { z } from "zod";

const stringArray = z.array(z.string()).default([]);

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["single", "multi", "text"]),
  question: z.string(),
  why: z.string(),
  required: z.boolean().default(true),
  options: z
    .array(z.object({ label: z.string(), description: z.string().default("") }))
    .default([])
});

export const InterviewTurnResultSchema = z.object({
  summary: z.string(),
  extractedFacts: z.record(z.any()).default({}),
  missingFields: stringArray,
  riskFlags: stringArray,
  confidenceScore: z.number().min(0).max(1),
  questions: z.array(QuestionSchema).min(1).max(5),
  isReadyToGenerateSpec: z.boolean()
});

export const ProjectSpecSchema = z.object({
  projectName: z.string(),
  projectType: z.string(),
  oneLineIdea: z.string(),
  targetUsers: stringArray,
  userPainPoints: stringArray,
  coreGoal: z.string(),
  mvpScope: stringArray,
  outOfScope: stringArray,
  coreFeatures: stringArray,
  rolesAndPermissions: stringArray,
  pagesOrModules: stringArray,
  dataSources: stringArray,
  externalDependencies: stringArray,
  techStackPreference: stringArray,
  deploymentTarget: z.string(),
  monetizationIntent: z.string(),
  constraints: stringArray,
  forbiddenActions: stringArray,
  risks: stringArray,
  assumptions: stringArray,
  recommendations: stringArray,
  acceptanceCriteria: stringArray,
  doneWhen: stringArray,
  testStrategy: stringArray,
  milestones: z
    .array(
      z.object({
        name: z.string(),
        goal: z.string(),
        tasks: stringArray,
        acceptanceCriteria: stringArray
      })
    )
    .default([]),
  unresolvedQuestions: stringArray,
  interviewSummary: z.string()
});

export const requiredSpecFields = [
  ["targetUsers", "目标用户"],
  ["coreGoal", "核心目标"],
  ["mvpScope", "MVP 范围"],
  ["outOfScope", "非目标"],
  ["techStackPreference", "技术栈偏好"],
  ["dataSources", "数据来源"],
  ["externalDependencies", "外部依赖"],
  ["pagesOrModules", "页面/模块"],
  ["rolesAndPermissions", "角色权限"],
  ["acceptanceCriteria", "验收标准"],
  ["testStrategy", "测试方式"],
  ["deploymentTarget", "部署方式"],
  ["risks", "风险和限制"],
  ["doneWhen", "Done When"]
];

export const markdownFileNames = [
  "Prompt.md",
  "Plan.md",
  "Implement.md",
  "Documentation.md",
  "Continuity.md",
  "AGENTS.md",
  "START.md"
];

export function parseJsonObject(raw) {
  const text = String(raw || "").trim();
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return JSON.parse(fenced[1]);
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error("模型未返回可解析的 JSON 对象。");
  }
}

export function validateInterviewTurn(value) {
  return InterviewTurnResultSchema.parse(value);
}

function asStringArray(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item.trim());
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return value;
}

function normalizeMilestone(milestone, index) {
  if (!milestone || typeof milestone !== "object") return milestone;
  return {
    ...milestone,
    name: milestone.name || milestone.title || milestone.phase || `里程碑 ${index + 1}`,
    goal: milestone.goal || milestone.objective || milestone.description || milestone.summary || "UNCONFIRMED",
    tasks: asStringArray(milestone.tasks || milestone.steps || milestone.todo || milestone.deliverables) || [],
    acceptanceCriteria:
      asStringArray(
        milestone.acceptanceCriteria ||
          milestone.acceptance ||
          milestone.doneWhen ||
          milestone.done_when ||
          milestone.validation
      ) || []
  };
}

export function normalizeProjectSpecInput(value) {
  if (!value || typeof value !== "object") return value;
  const normalized = { ...value };
  for (const key of [
    "targetUsers",
    "userPainPoints",
    "mvpScope",
    "outOfScope",
    "coreFeatures",
    "rolesAndPermissions",
    "pagesOrModules",
    "dataSources",
    "externalDependencies",
    "techStackPreference",
    "constraints",
    "forbiddenActions",
    "risks",
    "assumptions",
    "recommendations",
    "acceptanceCriteria",
    "doneWhen",
    "testStrategy",
    "unresolvedQuestions"
  ]) {
    normalized[key] = asStringArray(normalized[key]);
  }
  if (Array.isArray(normalized.milestones)) {
    normalized.milestones = normalized.milestones.map(normalizeMilestone);
  }
  return normalized;
}

export function validateProjectSpec(value) {
  return ProjectSpecSchema.parse(normalizeProjectSpecInput(value));
}

export function getSpecCompleteness(specLike) {
  const spec = specLike || {};
  const confirmed = [];
  const missing = [];
  for (const [key, label] of requiredSpecFields) {
    const value = spec[key];
    const ok = Array.isArray(value)
      ? value.length > 0 && value.some((item) => item && item !== "UNCONFIRMED")
      : Boolean(value && value !== "UNCONFIRMED");
    (ok ? confirmed : missing).push(label);
  }
  return {
    confirmed,
    missing,
    score: Math.round((confirmed.length / requiredSpecFields.length) * 100),
    canGenerate: missing.length === 0
  };
}

function list(items, fallback = "UNCONFIRMED") {
  const arr = Array.isArray(items) && items.length ? items : [fallback];
  return arr.map((item) => `- ${item}`).join("\n");
}

function section(title, body) {
  return `## ${title}\n\n${body}\n`;
}

export function generateMarkdownFilesFromSpec(input) {
  const spec = validateProjectSpec(input);
  const milestones = spec.milestones.length
    ? spec.milestones
        .map(
          (m, index) =>
            `### ${index + 1}. ${m.name}\n\n目标：${m.goal}\n\n主要任务：\n${list(m.tasks)}\n\n验收标准：\n${list(m.acceptanceCriteria)}`
        )
        .join("\n\n")
    : "### 1. UNCONFIRMED\n\n目标：UNCONFIRMED\n\n主要任务：\n- UNCONFIRMED";

  return {
    "Prompt.md": `# ${spec.projectName} 项目总需求\n\n${section("项目背景", spec.oneLineIdea)}${section("项目目标", spec.coreGoal)}${section("目标用户", list(spec.targetUsers))}${section("用户痛点", list(spec.userPainPoints))}${section("MVP 范围", list(spec.mvpScope))}${section("非目标", list(spec.outOfScope))}${section("核心功能", list(spec.coreFeatures))}${section("技术约束", list(spec.constraints))}${section("禁止事项", list(spec.forbiddenActions))}${section("交付物", markdownFileNames.map((name) => `- ${name}`).join("\n"))}${section("Done When 验收标准", list(spec.doneWhen))}`,
    "Plan.md": `# ${spec.projectName} 开发计划\n\n${section("里程碑拆分", milestones)}${section("可能修改的文件", list(spec.pagesOrModules.map((m) => `与 ${m} 相关的页面、组件、状态和测试文件`)))}${section("整体验收标准", list(spec.acceptanceCriteria))}${section("测试方式", list(spec.testStrategy))}${section("失败修复策略", "- 先复现错误并保留最小上下文\n- 优先修复阻塞主流程的问题\n- 每次修复后运行相关测试或构建\n- 若需求不明确，将假设写入 Continuity.md 后继续推进")}`,
    "Implement.md": `# ${spec.projectName} 长任务执行规则\n\n${section("每轮执行前读取", "- START.md\n- Prompt.md\n- Plan.md\n- Continuity.md\n- Documentation.md")}${section("执行方式", "- 根据 Continuity.md 的 Now/Next 判断当前任务\n- 一次只推进一个可验证里程碑\n- 修改前先理解已有结构，不做无关重构\n- 上下文不足时优先查阅项目文档和代码")}${section("验证与修复", list(spec.testStrategy.concat(["构建失败时先修复，不停止在建议层面", "修复后更新 Documentation.md 与 Continuity.md"])))}${section("何时提问", "- 当关键业务事实缺失且会影响不可逆设计时提问\n- 普通实现细节可以合理假设，并写入 assumptions 或 Continuity.md")}`,
    "Documentation.md": `# ${spec.projectName} 实时文档\n\n${section("当前项目结构", list(spec.pagesOrModules))}${section("已完成功能", "- 初始文档包已生成")}${section("未完成功能", list(spec.coreFeatures))}${section("已知问题", list(spec.risks))}${section("当前运行方式", "UNCONFIRMED")}${section("测试方式", list(spec.testStrategy))}${section("最近执行记录", "- 由 Codex Long Task Starter 根据 ProjectSpec 初始化")}`,
    "Continuity.md": `# ${spec.projectName} 跨会话状态账本\n\n${section("目标", spec.coreGoal)}${section("成功验收标准", list(spec.acceptanceCriteria))}${section("约束", list(spec.constraints))}${section("关键决策", list(spec.assumptions.concat(spec.recommendations)))}${section("Done", "- 已生成项目启动文件包")}${section("Now", "- 阅读 START.md 并确认第一阶段任务")}${section("Next", list(spec.milestones.map((m) => m.name)))}${section("待确认问题", list(spec.unresolvedQuestions))}${section("工具/密钥清单", "- 不要把 API Key 写入仓库或 Markdown\n- 需要的外部依赖：" + spec.externalDependencies.join("、"))}`,
    "AGENTS.md": `# AI Agent 行为规范\n\n- 使用中文输出阶段总结。\n- 修改前先理解项目，不要只给建议，要落地。\n- 修改后必须验证，至少运行与改动相关的检查。\n- 上下文不足时优先读取 Continuity.md、Plan.md、Documentation.md。\n- 不要乱重构，不要扩大任务范围。\n- 遇到报错先修复，再继续推进。\n- 每轮结束前写清楚完成内容、验证结果和下一步。\n- 不要把 API Key、Token、账号凭证写进日志或文件。\n`,
    "START.md": `# ${spec.projectName} 启动指令\n\n## 首次启动\n\n请先阅读 AGENTS.md、Prompt.md、Plan.md、Implement.md、Documentation.md、Continuity.md，然后从 Plan.md 的第一个里程碑开始执行。不要只给建议，请直接修改代码并验证。\n\n## 续跑指令\n\n请读取 Continuity.md 的 Now/Next，继续推进当前任务。若上下文缺失，先阅读 Documentation.md 和 Plan.md，再继续实现。\n\n## 跑偏修正\n\n如果实现偏离 MVP 范围，请回到 Prompt.md 的 MVP 范围和非目标，删除或暂停超范围工作，并更新 Continuity.md。\n\n## 上下文丢失恢复\n\n请重新读取 START.md、Continuity.md、Documentation.md、Plan.md，并根据最近执行记录恢复。\n\n## 给 Codex/OpenCode 的执行指令\n\n目标：${spec.coreGoal}\n\n第一步：${spec.milestones[0]?.name || "根据 Plan.md 拆解第一阶段任务"}\n\n验收：\n${list(spec.doneWhen)}`
  };
}

export function createExportBundleEntries(specInput, markdownFiles = {}) {
  const spec = validateProjectSpec(specInput);
  const files = Object.keys(markdownFiles).length ? markdownFiles : generateMarkdownFilesFromSpec(spec);
  const entries = {};
  for (const name of markdownFileNames) {
    entries[name] = typeof files[name] === "string" ? files[name] : "";
  }
  entries["project-spec.json"] = JSON.stringify(spec, null, 2);
  return entries;
}

export function createExampleSpec(seed = {}) {
  return validateProjectSpec({
    projectName: seed.projectName || "Project Alpha",
    projectType: seed.projectType || "Web App",
    oneLineIdea: seed.oneLineIdea || "一个用于把模糊项目想法转成 Codex/OpenCode 长任务文件包的 AI 访谈工具。",
    targetUsers: ["独立开发者", "小型产品团队", "需要让 AI 长时间执行复杂任务的用户"],
    userPainPoints: ["需求没有结构化，AI 容易跑偏", "长任务上下文容易丢失", "启动文件需要手工整理"],
    coreGoal: "通过多轮 AI 访谈生成可靠 ProjectSpec，并输出可交给 Codex/OpenCode 执行的 Markdown 文件包。",
    mvpScope: ["模型配置", "AI 动态访谈", "ProjectSpec 校验", "7 个 Markdown 文件生成", "下载与 CLI 写入"],
    outOfScope: ["用户登录", "付费系统", "云端保存", "模板市场"],
    coreFeatures: ["OpenAI-compatible API 调用", "结构化问题卡片", "置信度门控", "ProjectSpec 预览编辑", "ZIP/JSON 导出"],
    rolesAndPermissions: ["单用户本地使用", "无云端用户权限系统"],
    pagesOrModules: ["首页", "模型配置页", "创建项目页", "AI 访谈页", "ProjectSpec 页", "Markdown 结果页", "CLI"],
    dataSources: ["用户输入的项目想法", "访谈过程中的结构化答案"],
    externalDependencies: ["用户自带 OpenAI-compatible API Key"],
    techStackPreference: seed.techStackPreference || ["React", "Vite", "Node.js CLI"],
    deploymentTarget: seed.deploymentTarget || "静态 Web 部署或本地运行",
    monetizationIntent: seed.monetizationIntent || "第一版不商业化",
    constraints: ["不保存用户 API Key 到服务器", "不把 API Key 写入 Markdown", "覆盖文件前必须确认"],
    forbiddenActions: ["不要伪装无 Key 的示例流程为真实 AI 生成", "不要上传用户本地代码", "不要自动共享 Codex 账号"],
    risks: ["浏览器直连部分供应商可能遇到 CORS 限制", "模型 JSON 不稳定时需要修复流程"],
    assumptions: ["示例模式仅用于体验，不代表真实访谈质量"],
    recommendations: ["生产部署可增加无日志 API 代理或本地代理以规避 CORS"],
    acceptanceCriteria: ["可配置 API", "可多轮访谈", "ProjectSpec 通过校验", "可生成并下载文件包", "CLI 可写入当前目录"],
    doneWhen: ["pnpm build 成功", "Web 主流程可跑通", "CLI doctor 可检查文件", "不泄露 API Key"],
    testStrategy: ["运行 pnpm build", "手动测试配置、访谈、导出与 CLI 写入流程"],
    milestones: [
      { name: "Web 业务接线", goal: "让现有 UI 跑通真实状态流", tasks: ["localStorage 配置", "访谈 JSON 渲染", "导出下载"], acceptanceCriteria: ["页面可切换且无错误"] },
      { name: "CLI 写入", goal: "把生成文件写入当前项目目录", tasks: ["init", "init-files", "doctor"], acceptanceCriteria: ["覆盖前确认"] }
    ],
    unresolvedQuestions: [],
    interviewSummary: "示例模式根据默认项目意图生成，用于无 API Key 时体验流程。"
  });
}
