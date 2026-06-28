# Contributing

感谢你愿意改进 Codex Long Task Starter。

## 本地启动

```bash
pnpm install --frozen-lockfile=false
pnpm dev
```

Web 默认运行在：

```text
http://localhost:5173/
```

## 验证命令

提交 PR 前请至少运行：

```bash
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

## 代码风格

- 保持现有 React / Vite / Node ESM 风格。
- 不大改 UI，不推翻 Stitch 设计稿。
- 不引入用户系统、数据库、付费、多租户、模板市场等超出 v0.1.0-alpha 的功能。
- 业务逻辑优先放在 `packages/core` 或 `packages/ai`，避免复制到多个入口。
- 错误提示面向用户时使用中文，并给出下一步处理建议。
- 不把 API Key、Token 或账号凭证写入日志、测试快照、Markdown 或示例文件。

## Pull Request 建议

PR 描述建议包含：

- 改动目的
- 修改文件
- 验证命令结果
- 是否影响 Web UI
- 是否影响 CLI
- 是否涉及 API Key 或隐私边界

## 开发日志

每轮开发结束前运行：

```bash
pnpm devlog
```

然后更新当天 `dev-logs/YYYY-MM-DD.md`，至少记录：

- 今日完成
- 验证结果
- 遗留问题
- 明日待办
- 风险

不要在 dev-log 中记录 API Key、Token 或任何账号凭证。
