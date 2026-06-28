# Codex 工作指引

## 开发前必读
- `docs/requirements.md`
- `docs/technical-spec.md`
- `docs/design-guidelines.md`
- `docs/development-process.md`
- `docs/acceptance-checklist.md`
- `docs/release-checklist.md`
- `docs/github-release.md`
- `docs/next-planning-brief.md`
- `dev-logs/`

## 工作方式
- 每次开发前先确认验收清单和当天开发日志。
- 每轮只做小而完整的改动，优先稳定、安全、可验证。
- 不要重写现有 Stitch UI，不要推翻页面布局和组件结构。
- 若发现验收清单未完成，优先补齐最小可运行能力。
- 若发现大缺口，先记录到开发日志和验收清单，再拆分处理。

## 安全边界
- 不要泄露 API Key。
- 不要把 API Key 写入 Markdown、ZIP、project-spec.json、日志或 CLI 命令。
- 不要上传用户本地代码。
- CLI 只允许写入当前目录，覆盖前必须确认。
- 若准备发布，必须先检查 `SECURITY.md`、`CHANGELOG.md` 和 `docs/release-checklist.md`。

## 每轮结束前
- 运行必要验证，至少包含 `pnpm build`；涉及日志时运行 `pnpm devlog`；涉及 CLI 时运行 doctor。
- 更新当天 `dev-logs/YYYY-MM-DD.md`。
- 在最终回复中说明完成内容、验证结果、遗留风险。
