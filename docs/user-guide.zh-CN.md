# 中文使用手册

本文档面向第一次使用 Codex Long Task Starter 的中文开发者。目标是让你从“一个模糊项目想法”走到“一组可以交给 Codex / OpenCode 执行的任务文件”。

## 1. 准备环境

你需要：

- Node.js 18+
- pnpm
- 一个 OpenAI-compatible 模型服务的 API Key

如果终端提示没有 pnpm，可以先安装：

```bash
npm install -g pnpm
```

如果你的 Node.js 自带 Corepack，也可以运行 `corepack enable`。

推荐先使用本地代理模式，不要一开始就用浏览器直连。

## 2. 启动项目

在项目根目录运行：

```bash
pnpm install --frozen-lockfile=false
pnpm dev
```

浏览器打开：

```text
http://localhost:5173/
```

## 3. 配置模型

进入“模型配置”页面。

你可以选择预设：

- OpenAI
- DeepSeek
- Moonshot / Kimi
- 通义千问 Qwen
- OpenRouter
- 自定义

DeepSeek 示例：

```text
Provider Name: DeepSeek
Base URL: https://api.deepseek.com
Model Name: deepseek-chat
Request Mode: 本地代理
```

填写 API Key 后，点击“测试连接”。

如果测试失败：

- 检查 API Key 是否完整。
- 检查 Base URL 是否正确。
- 检查 Model Name 是否存在。
- 优先切换到“本地代理”。
- 如果是 401，重新生成 Key。
- 如果是 429，检查额度或稍后重试。

## 4. 创建项目

进入“创建项目”页面，填写：

- 项目名称
- 项目想法
- 项目类型
- 技术栈
- 约束条件

这里不需要一次写得非常完整，因为后面 AI 会继续访谈。

## 5. AI 访谈

进入“AI 访谈”页面后，系统会根据你的项目草稿继续追问。

建议回答时尽量包含：

- 用户是谁
- 核心功能是什么
- 不做什么
- 数据从哪里来
- 交互流程是什么
- 技术栈有什么限制
- 验收标准是什么

如果模型返回异常 JSON，系统会尝试修复并校验。

## 6. 检查 ProjectSpec

ProjectSpec 是后续生成 Markdown 文件的结构化基础。

如果页面提示信息不完整，不要急着导出。优先：

- 回到访谈继续回答问题。
- 或使用自动补齐。
- 或手动补全明显缺失字段。

ProjectSpec 不完整时，系统会阻止生成最终 Markdown，避免把不确定内容伪装成可执行计划。

## 7. 生成 Markdown

ProjectSpec 完整后，可以生成 7 个 Markdown 文件：

- `Prompt.md`
- `Plan.md`
- `Implement.md`
- `Documentation.md`
- `Continuity.md`
- `AGENTS.md`
- `START.md`

你可以在结果页：

- 查看每个文件。
- 编辑 Markdown。
- 复制当前文件。
- 复制全部文件。
- 下载 ZIP。
- 导出 `project-spec.json`。

## 8. 交给 Codex / OpenCode

推荐方式：

1. 下载 ZIP 或导出 `project-spec.json`。
2. 在目标项目目录写入 7 个 Markdown 文件。
3. 打开 `START.md`。
4. 把 `START.md` 中的启动说明交给 Codex / OpenCode。

后续续跑时，优先让 AI 读取：

- `Continuity.md`
- `Documentation.md`
- `Plan.md`
- `AGENTS.md`

## 9. CLI 写入文件

当前 `v0.1.0-alpha.1` 还没有发布到 npm。clone 仓库后，请先使用本地源码命令。

从 `project-spec.json` 写入当前目录：

```bash
node apps/cli/src/index.js init --spec ./project-spec.json
```

从已有 Markdown 文件目录写入当前目录：

```bash
node apps/cli/src/index.js init-files ./generated
```

检查当前目录：

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

CLI 默认只写当前目录，覆盖已有文件前会询问。

## 10. 安全注意事项

不要把 API Key 放进：

- Git 提交
- Markdown
- ZIP
- `project-spec.json`
- examples
- dev logs
- GitHub issue
- 截图
- 聊天记录
- 测试快照

如果 Key 已经泄露：

1. 立刻去供应商后台撤销旧 Key。
2. 创建新 Key。
3. 清理本地文件、日志、截图和浏览器配置。
4. 分享文件前重新检查导出内容。

## 11. 常见问题

### 没有 API Key 能用吗？

可以看页面和示例，但不能完成真实 AI 访谈。要生成高质量 ProjectSpec，需要配置自己的 API Key。

### 为什么推荐本地代理？

浏览器直连经常被 CORS 拦截。本地代理由开发服务器转发请求，更适合本地开发验证。

### ZIP 里应该有什么？

应包含 7 个 Markdown 文件和 `project-spec.json`。

### 这个项目是 SaaS 吗？

不是。当前版本是 local-first alpha，不包含登录、数据库、付费、云端保存或团队协作。

### 下一步适合做什么？

先用真实项目跑 2-3 次，记录卡点。下一阶段建议做 `v0.1.1-alpha`，专注修复真实使用体验。
