# Agent 工作规则

本仓库的目标是把 Codex Long Task Starter 打磨成可安装、可运行、可测试、可发布、可让真实用户试用的 local-first MVP。

## 必须保持的方向

- 这是 local-first 工具，不是 SaaS。
- 用户使用自己的 OpenAI-compatible API Key。
- API Key 不上传云端，不写入导出文件、示例、日志、issue、截图或测试快照。
- 中文体验是一等公民。
- 优先保证 Web UI 到 CLI 写入的完整闭环真实可用。

## 开发前先读

- `README.md`
- `docs/user-guide.zh-CN.md`
- `docs/MVP_CHECKLIST.md`
- `docs/deepseek-interview-optimization.md`
- `docs/requirements.md`
- `docs/technical-spec.md`
- `docs/development-process.md`
- `SECURITY.md`

## 每轮开发要求

- 小步修改，不做大型 UI 重写或架构重构。
- 不新增登录、云数据库、SaaS billing、团队协作、模板市场、Electron 或 Docker。
- 优先修复真实用户试用会卡住的问题。
- 修改导出、安全、schema validation、CLI 写入时必须补测试。
- 不写死 Provider，不写死 API Key。

## 验证命令

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

## 安全底线

如果发现真实 API Key、Token 或 secret：

1. 不要提交。
2. 删除或脱敏。
3. 在最终报告中说明处理方式。
4. 提醒用户撤销并重新创建已泄露的 Key。
