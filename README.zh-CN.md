# Codex Long Task Starter

把模糊项目想法变成 Codex / OpenCode 可执行任务包的本地优先 AI 工具。

Codex Long Task Starter 让用户配置自己的 OpenAI-compatible API Key，通过 AI 访谈澄清项目需求，生成经过校验的 `ProjectSpec`，再导出适合 Codex / OpenCode 执行的 Markdown 文件包，并通过 CLI 写入目标项目目录。

当前版本：`v0.1.0-alpha.0`

## 适合谁

- 想用 Codex / OpenCode 执行复杂长任务，但不知道如何准备启动文档的人。
- 经常遇到 AI 执行中途跑偏，需要更清晰任务边界的人。
- 想把需求、计划、实现约束、文档规则和连续性记录一次整理好的独立开发者。
- 希望自带 API Key、本地生成文件、不依赖托管 SaaS 的用户。
- 想用固定文件包把任务交给不同 AI 编程工具继续执行的人。

## 核心流程

```text
配置模型 -> 创建项目草稿 -> AI 动态访谈 -> ProjectSpec 校验/补齐
        -> 生成 7 个 Markdown 文件 -> 下载 ZIP / 导出 JSON
        -> CLI 写入目标项目 -> 把 START.md 交给 Codex / OpenCode
```

生成文件：

- `Prompt.md`
- `Plan.md`
- `Implement.md`
- `Documentation.md`
- `Continuity.md`
- `AGENTS.md`
- `START.md`

## 快速开始

```bash
pnpm install --frozen-lockfile=false
pnpm dev
```

打开：

```text
http://localhost:5173/
```

## 功能亮点

- 中文 Web UI：模型配置、项目创建、AI 访谈、ProjectSpec 预览、Markdown 导出。
- OpenAI-compatible provider presets：OpenAI、DeepSeek、Moonshot / Kimi、Qwen、OpenRouter、自定义。
- 本地代理模式，减少浏览器 CORS 问题。
- InterviewTurnResult 和 ProjectSpec 的 JSON 校验、解析和修复。
- ProjectSpec 完整度检查，信息不足时阻止生成最终 Markdown。
- ZIP 下载和 `project-spec.json` 导出。
- CLI 命令：`init`、`init-files`、`doctor`、`run`。
- 内置 todo app 和 Chrome extension 示例输出。
- 发布验证脚本和 GitHub Actions CI。

## Web 使用步骤

1. 进入 Web 页面。
2. 打开“模型配置”。
3. 选择供应商预设，或填写自定义 Base URL。
4. 填写自己的 API Key。
5. 点击“测试连接”。
6. 创建项目草稿。
7. 在 AI 访谈中回答问题。
8. 生成并检查 `ProjectSpec`。
9. 如果信息不完整，继续访谈或使用自动补齐。
10. 生成 Markdown 文件。
11. 编辑、复制、下载 ZIP，或导出 `project-spec.json`。

## API 配置

本项目使用 OpenAI-compatible `/chat/completions`。

配置项：

- Provider Name：供应商名称，仅用于显示。
- Base URL：供应商 API 根地址。
- API Key：你的模型供应商密钥。
- Model Name：模型 ID。
- Request Mode：
  - 本地代理：推荐，本地开发时可减少 CORS 问题。
  - 浏览器直连：仅适合本地模型或明确允许 CORS 的供应商。

DeepSeek 示例：

```text
Provider Name: DeepSeek
Base URL: https://api.deepseek.com
Model Name: deepseek-chat
Request Mode: 本地代理
```

## CLI 使用

从 `project-spec.json` 生成并写入当前目录：

```bash
npx codex-long-task-starter init --spec ./project-spec.json
```

从已有 Markdown 文件目录写入当前目录：

```bash
npx codex-long-task-starter init-files ./generated
```

检查当前目录是否已有长任务文件：

```bash
npx codex-long-task-starter doctor
```

检测 `START.md` 并提示下一步：

```bash
npx codex-long-task-starter run
```

CLI 安全规则：

- 只写入当前目录内路径。
- 覆盖已有文件前会询问。
- 不会写入 API Key。

## 安全提醒

- API Key 默认保存在当前浏览器 `localStorage`。
- API Key 不应进入 Git 提交。
- API Key 不应进入 `ProjectSpec`、Markdown、ZIP、examples、日志、issue、截图或测试快照。
- 本地代理只在请求时转发 Key，不应落盘或打印。
- 浏览器直连可能遇到 CORS，也会让请求直接从浏览器发给模型供应商。
- 如果你曾经把 API Key 发到聊天、截图、issue、日志或提交里，请立即在供应商后台撤销旧 Key 并创建新 Key。

详见 [SECURITY.md](SECURITY.md)。

## 示例项目

```text
examples/simple-todo-app/
examples/chrome-extension/
```

每个示例都包含 `project-spec.json` 和 7 个 Markdown 文件。

## 验证命令

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

## 已知限制

- `v0.1.0-alpha.0` 是面向本地使用的 alpha 版本。
- 暂不包含登录、云端数据库、付费、团队协作、模板市场、Electron 或 Docker。
- 真实模型长对话质量仍需要更多复杂项目样例继续观察。
- npm alpha 尚未发布，当前已完成 GitHub 开源发布和本地 tarball 验证。

## 相关文档

- [贡献指南](CONTRIBUTING.md)
- [安全政策](SECURITY.md)
- [版本记录](CHANGELOG.md)
- [英文发布说明](RELEASE_NOTES.md)
- [中文发布说明](RELEASE_NOTES.zh-CN.md)
- [发布检查清单](docs/release-checklist.md)
- [下一阶段规划简报](docs/next-planning-brief.md)

## 许可证

MIT
