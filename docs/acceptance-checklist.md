# 验收清单

## 已完成
- [x] Monorepo 基础结构。
- [x] Web 首页、模型配置页、创建项目页、AI 访谈页、ProjectSpec 页、Markdown 结果页。
- [x] 用户自带 API Key 配置，保存到 localStorage。
- [x] OpenAI-compatible `/chat/completions` 调用。
- [x] API 测试连接按钮。
- [x] AI 动态访谈入口。
- [x] InterviewTurnResult JSON 解析与 Zod 校验。
- [x] ProjectSpec JSON 生成与 Zod 校验。
- [x] 校验失败时调用模型修复 JSON。
- [x] Markdown 文件生成。
- [x] Markdown 预览、编辑、复制。
- [x] 下载 ZIP。
- [x] 导出 project-spec.json。
- [x] CLI `init`、`init-files`、`run`、`doctor`。
- [x] README 和 LICENSE。
- [x] 新增 `SECURITY.md`，说明 API Key、本地代理、浏览器直连和漏洞报告规则。
- [x] 新增 `CHANGELOG.md`，记录 `0.1.0-alpha.0` 发布内容、限制和安全说明。
- [x] 新增 `docs/release-checklist.md`，固定发布前命令、Web 手动验证、CLI 验证和 npm alpha 发布顺序。
- [x] README 已按 v0.1.0-alpha 快速开始补齐：项目定位、适用人群、本地启动、Web/CLI、DeepSeek、FAQ、安全说明。
- [x] 新增 `CONTRIBUTING.md`，说明启动、测试、PR、代码风格和 dev-log 规则。
- [x] 新增 `.github/workflows/ci.yml`，push/PR 自动运行 install、test、build、verify:release。
- [x] 新增 GitHub issue 模板和 PR 模板，降低开源协作沟通成本。
- [x] 新增 `docs/github-release.md`，准备仓库描述、topics、Release notes 和项目独立 Git 仓库发布提示。
- [x] 新增 `docs/next-planning-brief.md`，用于交给 GPT / 协作者讨论下一阶段路线。
- [x] 新增 `examples/simple-todo-app` 和 `examples/chrome-extension`，每个示例包含 `project-spec.json` 和 7 个 Markdown 文件。
- [x] 包版本统一为 `0.1.0-alpha.0`，匹配 alpha 发布目标。
- [x] 发布前安全扫描已清理仓库内硬编码 Key 和旧 Key 主体字符串。
- [x] 主要 UI 操作文案中文化。
- [x] Web 本地无日志 API 代理，默认避免浏览器 CORS 拦截。
- [x] ProjectSpec 不完整时禁止生成最终 Markdown 文件。
- [x] CLI npm 发布元数据和包内 README。
- [x] `@codex-starter/core` 已具备 npm 发布元数据，CLI 可作为独立包依赖 core。
- [x] 本地 tarball 验证：同时安装 core 和 CLI tarball 后，`npx codex-long-task-starter doctor` 可启动。
- [x] 新增 `pnpm verify:release`，自动打包 core/CLI、临时安装 tarball 并执行 CLI bin 的 `doctor` 命令。
- [x] 自动化测试覆盖 ProjectSpec 完整度、Markdown 密钥泄露检查、JSON 解析和 CLI 写入安全边界。
- [x] 自动化测试覆盖 OpenAI-compatible 请求路径、Bearer Key 转发、连接测试和错误响应。
- [x] 自动化测试覆盖导出包条目：7 个 Markdown 文件 + `project-spec.json`，且不包含 API Key。
- [x] 自动化测试覆盖复杂项目质量回归：SaaS、浏览器扩展、CLI 三类样例均能生成完整、相关且不泄露密钥的 Markdown/导出包。
- [x] DeepSeek 真实 Key 端到端验证：本地代理测试连接、动态访谈、ProjectSpec 生成、完整度补齐、Markdown 生成均已跑通。
- [x] ProjectSpec 生成后若必填信息不足，会自动尝试一次完整度补齐，再由完整度门控决定是否允许生成 Markdown。
- [x] 结果页 ZIP / project-spec.json 导出按钮有中文状态反馈，便于确认点击路径已触发。

## 部分完成 / 需继续观察
- [ ] 真实模型长对话质量：DeepSeek 短流程已验证，仍需更复杂项目样例继续观察追问深度。
- [ ] Markdown 内容质量：基础生成层已有复杂样例回归；真实 AI 模式仍需用更多真实访谈样例检查稳定性。
- [ ] CLI / core 正式 npm 发布与远程 registry `npx` 安装验证。

## 必须持续检查
- [x] 生成文件不包含 API Key：本轮逐个检查 7 个 Markdown 文件，未发现 Key。
- [x] 日志不包含 API Key：开发日志不包含真实 Key 主体字符串；仍保留“用户应轮换已暴露 Key”的风险提示。
- [x] CLI 不写入当前目录外路径：自动化测试覆盖。
- [x] 覆盖已有文件前必须确认：CLI 逻辑已实现确认/跳过/备份。
- [x] 无 Key 时不能伪装成真实 AI 生成：示例模式文案和真实模式状态已区分。
