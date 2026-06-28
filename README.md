# Codex Long Task Starter

把模糊项目想法变成 Codex / OpenCode 可执行任务包的本地优先 AI 工具。

Codex Long Task Starter 通过 Web UI 让你配置自己的 OpenAI-compatible API Key，由 AI 动态访谈项目需求，生成经过校验的 `ProjectSpec`，再导出可交给 Codex / OpenCode 执行的 Markdown 文件包，并提供 CLI 写入目标项目目录。

当前版本：`v0.1.0-alpha.1`

English version: [README.en.md](README.en.md)

## 目录

- [这个项目解决什么问题](#这个项目解决什么问题)
- [适合谁使用](#适合谁使用)
- [快速开始](#快速开始)
- [Web 使用流程](#web-使用流程)
- [模型 API 配置](#模型-api-配置)
- [生成结果说明](#生成结果说明)
- [CLI 使用方式](#cli-使用方式)
- [示例项目](#示例项目)
- [安全说明](#安全说明)
- [验证命令](#验证命令)
- [已知限制](#已知限制)
- [相关文档](#相关文档)

## 这个项目解决什么问题

AI 编程长任务最容易出问题的地方，不是“模型不会写代码”，而是任务开始前的信息太散：

- 项目目标没有说清楚。
- 功能边界不明确。
- 技术栈和约束没有固定下来。
- 执行计划缺少阶段。
- 中途换线程、换工具后上下文丢失。

Codex Long Task Starter 的目标是：在真正开始写代码前，先把项目想法整理成一套可执行、可交接、可续跑的任务文件。

## 适合谁使用

- 想用 Codex / OpenCode 做复杂项目，但不知道如何写启动文档的人。
- 经常遇到 AI 写着写着跑偏，需要更清晰任务边界的人。
- 想把需求、计划、实现规则、文档规范、连续性记录一次整理好的独立开发者。
- 希望自带 API Key、本地生成文件、不依赖托管 SaaS 的用户。
- 想把同一套项目上下文交给不同 AI 编程工具继续执行的人。

## 快速开始

### 环境要求

- Node.js 18+
- pnpm

如果你的电脑提示“未找到 pnpm”，先运行：

```bash
npm install -g pnpm
```

如果你使用的是支持 Corepack 的 Node.js，也可以运行 `corepack enable` 后再试。

### 安装依赖

```bash
pnpm install --frozen-lockfile=false
```

### 启动 Web

```bash
pnpm dev
```

打开：

```text
http://localhost:5173/
```

### 发布前验证

```bash
pnpm test
pnpm build
pnpm verify:release
```

## Web 使用流程

1. 打开首页。
2. 进入“模型配置”。
3. 选择供应商预设，或填写自定义 Base URL。
4. 填写你自己的 API Key。
5. 点击“测试连接”。
6. 进入“创建项目”，填写项目名称、项目想法、技术栈和约束。
7. 进入“AI 访谈”，回答模型追问。
8. 生成并检查 `ProjectSpec`。
9. 如果信息不完整，继续访谈或使用自动补齐。
10. 生成 Markdown 文件。
11. 在结果页编辑、复制、下载 ZIP，或导出 `project-spec.json`。

更完整的使用说明见：[docs/user-guide.zh-CN.md](docs/user-guide.zh-CN.md)

## 模型 API 配置

本项目调用 OpenAI-compatible `/chat/completions` 接口。

配置项：

- Provider Name：供应商名称，仅用于显示。
- Base URL：供应商 API 根地址。
- API Key：你的模型供应商密钥。
- Model Name：模型 ID。
- Request Mode：
  - 本地代理：推荐。由本地开发服务器转发请求，减少浏览器 CORS 问题。
  - 浏览器直连：仅适合本地模型或明确允许 CORS 的供应商。

### DeepSeek 示例

```text
Provider Name: DeepSeek
Base URL: https://api.deepseek.com
Model Name: deepseek-chat
Request Mode: 本地代理
```

注意：不要把 API Key 写入 README、issue、日志、截图、Markdown、ZIP 或任何提交文件。

## 生成结果说明

项目最终会生成 7 个 Markdown 文件：

- `Prompt.md`：项目背景、目标、约束和输入信息。
- `Plan.md`：阶段计划、里程碑和执行顺序。
- `Implement.md`：实现说明、模块拆分和技术细节。
- `Documentation.md`：文档规则、验收说明和维护信息。
- `Continuity.md`：续跑上下文，方便之后接着做。
- `AGENTS.md`：给 AI 编程 Agent 的工作规则。
- `START.md`：交给 Codex / OpenCode 的启动入口。

同时可以导出：

- `project-spec.json`
- 包含上述文件的 ZIP

## CLI 使用方式

当前 `v0.1.0-alpha.1` 还没有发布到 npm。clone 仓库后请先使用本地源码命令：

从 `project-spec.json` 生成并写入当前目录：

```bash
node apps/cli/src/index.js init --spec ./project-spec.json
```

从已有 Markdown 文件目录写入当前目录：

```bash
node apps/cli/src/index.js init-files ./generated
```

检查当前目录是否已有长任务文件：

```bash
node apps/cli/src/index.js doctor
```

检测 `START.md` 并提示下一步：

```bash
node apps/cli/src/index.js run
```

npm alpha 发布后，才使用：

```bash
npx codex-long-task-starter@alpha doctor
```

CLI 安全规则：

- 只写入当前目录内路径。
- 覆盖已有文件前会询问。
- 不会写入 API Key。

## 示例项目

仓库内置两个示例：

```text
examples/simple-todo-app/
examples/chrome-extension/
```

每个示例都包含：

- `project-spec.json`
- 7 个 Markdown 文件

这些示例可以帮助你理解最终产物，也可以直接复制给 Codex / OpenCode 试跑。

## 安全说明

- API Key 默认保存在当前浏览器 `localStorage`。
- API Key 必须 local-first，不应进入导出物或仓库。
- API Key 不应进入 `ProjectSpec`。
- API Key 不应进入 Markdown。
- API Key 不应进入 ZIP。
- API Key 不应进入 examples。
- API Key 不应进入日志、issue、截图或测试快照。
- 本地代理只在请求时转发 Key，不应落盘或打印。
- 如果你曾经把 API Key 发到聊天、截图、issue、日志或提交里，请立即到供应商后台撤销旧 Key 并创建新 Key。

详见：[SECURITY.md](SECURITY.md)

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

- 当前是 `v0.1.0-alpha.1`，定位为本地使用的 alpha 版本。
- 暂不包含登录、云端数据库、付费、团队协作、模板市场、Electron 或 Docker。
- npm alpha 尚未发布。
- 真实模型长对话质量仍需更多复杂项目样例继续观察。

## 相关文档

- [中文使用手册](docs/user-guide.zh-CN.md)
- [英文 README](README.en.md)
- [MVP 检查清单](docs/MVP_CHECKLIST.md)
- [Agent 工作规则](AGENTS.md)
- [贡献指南](CONTRIBUTING.md)
- [安全政策](SECURITY.md)
- [版本记录](CHANGELOG.md)
- [中文发布说明](RELEASE_NOTES.zh-CN.md)
- [英文发布说明](RELEASE_NOTES.md)
- [发布检查清单](docs/release-checklist.md)
- [下一阶段规划简报](docs/next-planning-brief.md)
- [DeepSeek 访谈质量优化计划](docs/deepseek-interview-optimization.md)

## 许可证

MIT
