# 技术规范

## Monorepo 结构
- `apps/web`：Web UI、localStorage 状态、访谈流程、文件导出。
- `apps/cli`：Node.js CLI，负责写入当前目录和 doctor 检查。
- `packages/core`：ProjectSpec 类型、Zod 校验、完整度门控、Markdown 基础生成逻辑。
- `packages/ai`：OpenAI-compatible API 调用、访谈 Agent、JSON 修复、ProjectSpec/Markdown AI 生成。

## Web 数据流
1. 模型配置写入 localStorage。
2. 创建项目页写入项目草稿。
3. 访谈页调用 `runInterviewTurn`，返回并校验 InterviewTurnResult。
4. ProjectSpec 页调用 `buildProjectSpec`，通过 `ProjectSpecSchema` 校验后展示。
5. 生成最终 Markdown 前执行完整度门控，缺失必填信息时阻止生成并提示缺失项。
6. 结果页调用 `buildMarkdownFiles`，支持编辑、复制、ZIP 下载和 JSON 导出。

## AI 调用
- 使用 OpenAI-compatible `/chat/completions`。
- 请求头使用用户提供的 Bearer Token。
- 默认要求 JSON 对象输出。
- 解析失败或 Zod 校验失败时调用模型做 JSON 修复。
- Web 默认使用 Vite 本地代理 `/api/chat-completions` 转发请求，避免浏览器 CORS 拦截。
- API Key 只随当前请求进入本机开发服务器内存，不落盘、不写入日志；用户也可以切换为浏览器直连。

## CLI 数据流
- `init --spec ./project-spec.json`：读取 ProjectSpec，生成 7 个 Markdown 文件并写入当前目录。
- `init-files ./generated`：从已有 Markdown 文件目录写入当前目录。
- `doctor`：检查 7 个 Markdown 文件、Node、Git、Codex、OpenCode。
- `run`：检测 START.md 并提示启动方式。
- CLI 包包含 npm 发布所需 `bin`、`files`、`engines`、`license`、`keywords`、`publishConfig` 与包内 README。
- CLI 依赖 `@codex-starter/core`。正式发布时必须先发布 core，再发布 CLI。
- 发布前运行 `pnpm verify:release`：本地打包 core 与 CLI，在临时项目安装 tarball，并执行 CLI bin 的 `doctor` 命令。

## 导出包
- Web ZIP 下载使用 `createExportBundleEntries` 统一生成导出条目。
- 导出条目固定包含 7 个 Markdown 文件和 `project-spec.json`。
- 导出内容不得包含 API Key、Token 或账号凭证。
