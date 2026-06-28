# 开发流程

## 每次开发前
1. 阅读 `codex.md`。
2. 阅读 `docs/requirements.md`、`docs/technical-spec.md`、`docs/design-guidelines.md`。
3. 查看 `docs/acceptance-checklist.md`，确认本轮要补齐的验收项。
4. 查看当天 `dev-logs/YYYY-MM-DD.md`。

## 每轮改动限制
- 优先做小而完整的改动。
- 不把 UI 重写、业务架构重构和新功能扩张混在同一轮。
- 如果发现大缺口，先记录到待办，再拆成下一轮。

## 验证要求
- 常规验证：`pnpm build`。
- 自动化测试：`pnpm test`。
- 日志验证：`pnpm devlog`。
- CLI 验证：运行 `node apps/cli/src/index.js doctor` 或等效命令。
- 发布前验证：`pnpm verify:release`，确认 core 与 CLI tarball 可安装，且 CLI bin 可启动。
- UI 验证：打开 6 个页面，检查没有错误覆盖层，主要按钮和状态为中文。
- API 验证：无 Key 时必须停留示例模式；有 Key 时优先使用“本地代理”测试连接。

## 日志规则
- 每轮结束前更新当天开发日志。
- 日志至少记录：今日完成、验证结果、遗留问题、明日待办、风险。
- 不要在开发日志中记录 API Key、Token 或账号凭证。
