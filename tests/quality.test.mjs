import test from "node:test";
import assert from "node:assert/strict";
import {
  createExportBundleEntries,
  generateMarkdownFilesFromSpec,
  getSpecCompleteness,
  markdownFileNames,
  validateProjectSpec
} from "../packages/core/src/index.js";

const sampleSpecs = [
  {
    projectName: "OpsFlow CRM",
    projectType: "B2B SaaS",
    oneLineIdea: "面向小型销售团队的轻量 CRM，聚合线索、跟进任务、客户阶段和成交预测。",
    targetUsers: ["销售主管", "销售代表", "运营负责人"],
    userPainPoints: ["线索分散在表格和聊天记录里", "跟进任务容易遗漏", "团队无法快速看到管道健康度"],
    coreGoal: "用一个低学习成本的工作台管理客户线索、跟进节奏和成交预测。",
    mvpScope: ["线索列表", "客户详情", "跟进任务", "销售阶段看板", "CSV 导入导出", "基础权限"],
    outOfScope: ["复杂营销自动化", "财务开票", "多租户计费", "移动 App"],
    coreFeatures: ["线索管理", "阶段看板", "任务提醒", "CSV 导入导出", "团队角色"],
    rolesAndPermissions: ["管理员可配置字段", "主管可查看团队数据", "销售只能编辑自己的客户"],
    pagesOrModules: ["Dashboard", "Leads", "CustomerDetail", "PipelineBoard", "ImportExport", "Settings"],
    dataSources: ["用户手动录入", "CSV 文件", "跟进记录"],
    externalDependencies: ["浏览器本地存储或轻量后端 API", "CSV parser"],
    techStackPreference: ["React", "Vite", "TypeScript"],
    deploymentTarget: "Vercel 或企业内网静态部署",
    monetizationIntent: "第一版内部使用，不接付费",
    constraints: ["页面必须适合高频录入", "表格不可横向溢出", "导入前必须预览"],
    forbiddenActions: ["不要上传客户数据到第三方", "不要默认公开团队数据", "不要记录 API Key"],
    risks: ["字段配置过度复杂会拖慢 MVP", "CSV 脏数据需要明确错误提示"],
    assumptions: ["第一版团队规模小于 20 人", "先支持中文界面"],
    recommendations: ["先做本地 mock 数据", "用可替换数据层隔离后端"],
    acceptanceCriteria: ["可创建线索", "可拖拽阶段", "可导入 CSV", "权限边界可见"],
    doneWhen: ["pnpm build 通过", "主管能看到管道统计", "销售能完成一次客户跟进闭环"],
    testStrategy: ["单元测试数据转换", "手动测试 CSV 导入", "浏览器检查主要页面"],
    milestones: [
      {
        name: "CRM MVP",
        goal: "完成线索、客户、任务和阶段看板主流程",
        tasks: ["搭建数据模型", "实现列表与详情", "实现阶段看板", "实现导入导出"],
        acceptanceCriteria: ["主流程无空白页", "CSV 错误可读", "权限入口清晰"]
      }
    ],
    unresolvedQuestions: ["是否需要字段自定义"],
    interviewSummary: "复杂 SaaS 样例，用于验证生成文件对业务对象、角色权限和数据来源保持相关。"
  },
  {
    projectName: "Tech Explain Translator",
    projectType: "Chrome Extension",
    oneLineIdea: "选中网页中的英文技术段落后，侧边栏给出中文解释、术语拆解和可复制摘要。",
    targetUsers: ["中文开发者", "技术学习者"],
    userPainPoints: ["官方文档术语密集", "机器翻译缺少上下文解释", "阅读时不想离开当前网页"],
    coreGoal: "在浏览器内把技术英文转成可理解、可复用的中文解释。",
    mvpScope: ["右键菜单", "侧边栏展示", "API Key 配置", "术语解释", "复制摘要"],
    outOfScope: ["账号同步", "云端历史", "团队共享", "付费订阅"],
    coreFeatures: ["内容选取", "OpenAI-compatible 调用", "解释卡片", "配置页", "错误提示"],
    rolesAndPermissions: ["单用户本地扩展", "无团队权限"],
    pagesOrModules: ["background", "content-script", "side-panel", "options", "storage"],
    dataSources: ["用户选中文本", "当前页面 URL", "用户自带 API Key"],
    externalDependencies: ["Chrome Extension APIs", "OpenAI-compatible API"],
    techStackPreference: ["Manifest V3", "Vanilla JS", "CSS"],
    deploymentTarget: "Chrome 开发者模式安装",
    monetizationIntent: "开源自用",
    constraints: ["API Key 只能存浏览器本地", "解释结果不得自动上传历史", "UI 不遮挡原网页"],
    forbiddenActions: ["不要抓取整页隐私内容", "不要把 Key 写入日志", "不要绕过网站限制"],
    risks: ["网页 CSP 可能限制注入", "模型返回格式不稳定", "长文本成本不可控"],
    assumptions: ["第一版只支持 Chrome", "用户主动选择文本后才调用模型"],
    recommendations: ["增加最大字符数限制", "为常见错误提供中文说明"],
    acceptanceCriteria: ["右键菜单可触发", "侧边栏显示解释", "配置页可测试连接", "错误不泄露 Key"],
    doneWhen: ["扩展可加载", "选中文本能解释", "无 Key 时明确提示配置"],
    testStrategy: ["手动加载扩展", "模拟 API 响应", "检查 storage 不包含明文日志"],
    milestones: [
      {
        name: "Extension MVP",
        goal: "完成选中文本到侧边栏解释的闭环",
        tasks: ["实现右键菜单", "实现 options", "实现 side panel", "接入 mock/真实 API"],
        acceptanceCriteria: ["用户不离开网页即可看到解释", "配置错误有中文提示"]
      }
    ],
    unresolvedQuestions: ["是否需要保留本地历史"],
    interviewSummary: "浏览器扩展样例，用于验证本地密钥边界、扩展模块和用户主动触发约束。"
  },
  {
    projectName: "Repo Bootstrap CLI",
    projectType: "Developer Tool CLI",
    oneLineIdea: "读取项目目标后生成 README、任务计划、Agent 指引和可执行检查清单。",
    targetUsers: ["独立开发者", "AI 编程用户"],
    userPainPoints: ["新项目启动文档分散", "AI Agent 容易忘记上下文", "手动整理执行计划耗时"],
    coreGoal: "用命令行把项目启动材料一次性写入当前仓库，并保证覆盖前确认。",
    mvpScope: ["读取 project-spec.json", "生成 Markdown 文件", "安全写入当前目录", "doctor 检查", "覆盖确认"],
    outOfScope: ["远程云同步", "GitHub Issue 自动创建", "用户登录", "模板市场"],
    coreFeatures: ["ProjectSpec 校验", "文件生成", "安全路径检查", "交互式覆盖策略", "doctor"],
    rolesAndPermissions: ["本地单用户", "不处理系统级权限"],
    pagesOrModules: ["CLI parser", "file writer", "schema validation", "doctor checks"],
    dataSources: ["project-spec.json", "用户当前工作目录"],
    externalDependencies: ["Node.js", "commander", "prompts", "chalk"],
    techStackPreference: ["Node.js", "ESM", "pnpm workspace"],
    deploymentTarget: "npm package / npx",
    monetizationIntent: "开源免费",
    constraints: ["不能写入当前目录外路径", "覆盖前必须确认", "不能把密钥写入生成文件"],
    forbiddenActions: ["不要执行 git reset", "不要删除用户文件", "不要静默覆盖"],
    risks: ["路径处理错误可能覆盖用户文件", "包依赖未发布会导致 npx 失败"],
    assumptions: ["用户在目标仓库根目录运行命令", "Node 版本不低于 18"],
    recommendations: ["发布前跑 tarball 安装验证", "保留 dry-run 或 doctor 命令"],
    acceptanceCriteria: ["doctor 可启动", "init 写入 7 个文件", "路径越界被拒绝", "覆盖策略可选"],
    doneWhen: ["pnpm test 通过", "pnpm verify:release 通过", "npx doctor 可运行"],
    testStrategy: ["node:test 覆盖路径安全", "临时目录验证写入", "tarball 安装验证"],
    milestones: [
      {
        name: "CLI Release Gate",
        goal: "让 CLI 具备发布前自检能力",
        tasks: ["补 package 元数据", "验证 tarball", "验证 bin", "记录发布顺序"],
        acceptanceCriteria: ["verify:release 通过", "包内文件清单干净"]
      }
    ],
    unresolvedQuestions: ["正式包名是否长期保持不变"],
    interviewSummary: "CLI 工具样例，用于验证路径安全、发布验证和 Agent 文档生成质量。"
  }
];

function assertRelevant(files, terms, label) {
  const combined = Object.values(files).join("\n");
  for (const term of terms) {
    assert.match(combined, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${label} 应包含 ${term}`);
  }
}

test("复杂项目样例生成质量保持完整、相关且不泄露密钥", () => {
  for (const input of sampleSpecs) {
    const spec = validateProjectSpec(input);
    const completeness = getSpecCompleteness(spec);
    assert.equal(completeness.canGenerate, true, `${spec.projectName} 应满足完整度门控`);

    const files = generateMarkdownFilesFromSpec(spec);
    assert.deepEqual(Object.keys(files).sort(), [...markdownFileNames].sort());
    assertRelevant(files, [spec.projectName, spec.coreGoal, spec.targetUsers[0], spec.coreFeatures[0]], spec.projectName);

    for (const [name, content] of Object.entries(files)) {
      assert.ok(content.length > 120, `${spec.projectName}/${name} 内容不能过短`);
      assert.doesNotMatch(content, /sk-[A-Za-z0-9]/);
      assert.doesNotMatch(content, /apiKey/i);
    }

    const entries = createExportBundleEntries(spec, files);
    assert.deepEqual(Object.keys(entries).sort(), [...markdownFileNames, "project-spec.json"].sort());
    assert.equal(JSON.parse(entries["project-spec.json"]).projectName, spec.projectName);
  }
});
