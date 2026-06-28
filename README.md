# Codex Long Task Starter

把一个模糊的项目想法，通过 AI 访谈整理成结构化 `ProjectSpec`，再生成可交给 Codex / OpenCode 长任务执行的 Markdown 文件包。

当前版本：`v0.1.0-alpha`

## 适合谁

- 想用 Codex / OpenCode 做复杂长任务，但不知道如何写启动文档的人。
- 经常发现 AI 做着做着跑偏，需要更清晰任务边界的人。
- 想把项目需求、计划、执行规则、连续性记录一次性整理好的独立开发者。
- 想用自己的 OpenAI-compatible API Key，而不是把项目数据交给某个托管平台的人。

## 核心流程

```text
配置模型 -> 创建项目草稿 -> AI 动态访谈 -> ProjectSpec 校验/补齐
        -> 生成 7 个 Markdown 文件 -> 下载 ZIP / 导出 JSON
        -> CLI 写入目标项目 -> 把 START.md 交给 Codex / OpenCode
```

生成文件包括：

- `Prompt.md`
- `Plan.md`
- `Implement.md`
- `Documentation.md`
- `Continuity.md`
- `AGENTS.md`
- `START.md`

## 本地启动

```bash
pnpm install --frozen-lockfile=false
pnpm dev
```

打开：

```text
http://localhost:5173/
```

发布前验证：

```bash
pnpm test
pnpm build
pnpm verify:release
```

## Web 使用步骤

1. 进入“模型配置”页。
2. 选择供应商预设，或填写自定义 Base URL。
3. 填写你自己的 API Key。
4. 点击“测试连接”。
5. 进入“创建项目”，填写项目名称、想法、类型、技术栈和约束。
6. 进入“AI 访谈”，回答问题。
7. 生成并检查 `ProjectSpec`。
8. 如果信息不完整，继续访谈或等待自动补齐。
9. 生成 Markdown 文件。
10. 下载 ZIP，或导出 `project-spec.json`。

## API 配置

本项目使用 OpenAI-compatible `/chat/completions`。

配置项：

- Provider Name：供应商名称，仅用于显示。
- Base URL：OpenAI-compatible API 地址。
- API Key：你的模型供应商密钥。
- Model Name：模型 ID。
- Request Mode：
  - 本地代理：推荐，开发服务器转发请求，避免浏览器 CORS。
  - 浏览器直连：仅适合本地模型或明确允许 CORS 的供应商。

### DeepSeek 示例

```text
Provider Name: DeepSeek
Base URL: https://api.deepseek.com
Model Name: deepseek-chat
Request Mode: 本地代理
```

不要把 API Key 写入 README、Markdown、issue、日志或聊天记录。

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

检测 `START.md` 并提示如何继续：

```bash
npx codex-long-task-starter run
```

CLI 安全规则：

- 只写入当前目录内路径。
- 覆盖已有文件前会询问：跳过、覆盖、备份后覆盖。
- 不会写入 API Key。

## 如何交给 Codex / OpenCode

1. 在目标项目目录运行 CLI，写入 7 个 Markdown 文件。
2. 打开 `START.md`。
3. 把“首次启动”或“续跑指令”交给 Codex / OpenCode。
4. 后续长任务优先读取：
   - `Continuity.md`
   - `Documentation.md`
   - `Plan.md`
   - `AGENTS.md`

## 示例项目

仓库内置两个可读示例：

```text
examples/simple-todo-app/
examples/chrome-extension/
```

每个示例都包含：

- `project-spec.json`
- 7 个 Markdown 文件

这些示例可用于理解最终产物，也可直接复制给 Codex / OpenCode 试跑。

## 开源协作与发布

- 贡献指南：`CONTRIBUTING.md`
- 安全政策：`SECURITY.md`
- 版本记录：`CHANGELOG.md`
- 发布清单：`docs/release-checklist.md`
- GitHub 发布准备：`docs/github-release.md`
- 下一阶段规划简报：`docs/next-planning-brief.md`
- GitHub Actions：`.github/workflows/ci.yml`

## 安全与隐私

- API Key 默认保存在当前浏览器 `localStorage`。
- API Key 不应进入 `ProjectSpec`。
- API Key 不应进入 Markdown。
- API Key 不应进入 ZIP。
- API Key 不应进入 dev-log。
- 本地代理只在请求时转发 Key，不落盘、不打印。
- 浏览器直连可能遇到 CORS，也会把请求直接从浏览器发给模型供应商。

如果你曾经把 API Key 发到聊天、issue、日志或截图里，请立即作废并重新生成。

## FAQ

### 没有 API Key 能用吗？

可以体验示例流程，但不会伪装成真实 AI 访谈。要生成高质量 ProjectSpec，必须配置自己的模型 Key。

### Base URL 应该填什么？

填供应商 OpenAI-compatible API 的根地址。DeepSeek 示例是 `https://api.deepseek.com`。

### 测试连接失败怎么办？

- 检查 API Key 是否完整。
- 检查 Base URL 是否来自官方文档。
- 检查 Model Name 是否存在。
- 优先切换到“本地代理”模式。
- 如果是 401，重新生成 Key。
- 如果是 429，检查额度或稍后重试。

### ProjectSpec 显示信息不完整怎么办？

继续回答访谈问题，或在 ProjectSpec 页面手动编辑。系统会在生成后自动尝试补齐一次，但不会把完全不确定的事实伪装成确定内容。

### ZIP 下载后应该有什么？

应包含 7 个 Markdown 文件和 `project-spec.json`。

### 可以直接发布成 SaaS 吗？

当前目标是开源 `v0.1.0-alpha`，不包含用户系统、数据库、付费、多租户或云端保存。

## 开发者命令

```bash
pnpm install --frozen-lockfile=false
pnpm dev
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

## 许可证

MIT
