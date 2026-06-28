# Codex Long Task Starter v0.1.0-alpha.0 发布说明

Codex Long Task Starter `v0.1.0-alpha.0` 是第一个 local-first alpha 版本。

它帮助用户配置自己的 OpenAI-compatible API Key，通过 AI 访谈整理项目需求，生成经过校验的 `ProjectSpec`，导出 Codex / OpenCode 可执行的 Markdown 文件，并通过 CLI 写入目标项目。

## Highlights

- 中文 Web UI：模型配置、项目创建、AI 访谈、ProjectSpec 预览、Markdown 导出。
- OpenAI-compatible provider presets：OpenAI、DeepSeek、Moonshot / Kimi、Qwen、OpenRouter、自定义。
- 本地代理模式，减少浏览器 CORS 问题。
- Interview turns 和 ProjectSpec generation 的 JSON validation / repair。
- ProjectSpec 完整度检查，避免信息不足时直接生成最终 Markdown。
- ZIP download 和 `project-spec.json` export。
- CLI commands：`init`、`init-files`、`doctor`、`run`。
- todo app 和 Chrome extension 示例输出。
- release verification script 和 GitHub Actions CI。

## Security

- API Key 必须 local-first，默认保存在用户本地浏览器环境。
- API Key 不能出现在 Markdown、ZIP exports、ProjectSpec、examples、logs、issues、screenshots、commits 或测试快照中。
- 如果用户曾经在聊天、截图、issue、日志或提交中泄露 Key，应立即到供应商后台撤销旧 Key，并重新创建新 Key。
- 详细规则见 `SECURITY.md`。

## Validation

发布前检查命令：

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

GitHub Actions CI 已在 `main` 上通过。

## Known Limitations

- 当前是 alpha 版本，定位为本地使用。
- 暂不包含登录、云端数据库、SaaS 付费、团队协作、模板市场、Electron 或 Docker。
- npm alpha 尚未发布。
- 真实模型长对话质量仍需更多复杂项目样例继续观察。
