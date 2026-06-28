# Codex 长任务启动器 / Codex Long Task Starter 中文说明

Codex 长任务启动器（Codex Long Task Starter）是一个 local-first 的 AI 编程长任务启动器：把模糊项目想法整理成结构化 `ProjectSpec`，再生成可以交给 Codex / OpenCode 执行的 Markdown 任务包。

默认中文首页已经放在 [README.md](README.md)。如果你是第一次使用，建议按下面顺序阅读：

1. [README.md](README.md)：项目定位、快速开始、Web 流程、CLI、本地安全规则。
2. [中文使用手册](docs/user-guide.zh-CN.md)：更细的操作步骤和常见问题。
3. [MVP 检查清单](docs/MVP_CHECKLIST.md)：当前 alpha 已完成能力和仍需观察的事项。
4. [安全政策](SECURITY.md)：API Key、本地代理、导出文件和泄露处理规则。

## 快速启动

```bash
pnpm install --frozen-lockfile=false
pnpm dev
```

然后打开：

```text
http://localhost:5173/
```

如果提示没有 `pnpm`，先运行：

```bash
npm install -g pnpm
```

## 当前 CLI 用法

当前 `v0.1.0-alpha.1` 尚未发布到 npm。clone 仓库后，请先使用本地源码命令：

```bash
node apps/cli/src/index.js doctor
node apps/cli/src/index.js init --spec ./project-spec.json
node apps/cli/src/index.js init-files ./generated
node apps/cli/src/index.js run
```

npm alpha 发布后，再使用：

```bash
npx codex-long-task-starter@alpha doctor
```

## 安全提醒

- API Key 只应保存在你的本机浏览器 `localStorage`。
- 不要把 API Key 写进 Git、Markdown、ZIP、`project-spec.json`、日志、issue、截图或聊天记录。
- 如果 Key 已经泄露，请立即到供应商后台撤销旧 Key，并创建新 Key。

English documentation: [README.en.md](README.en.md)
