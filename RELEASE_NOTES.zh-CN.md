# Codex Long Task Starter v0.1.0-alpha.1 发布说明

`v0.1.0-alpha.1` 是一次真实试用体验打磨版本，重点不是增加大功能，而是让本地 MVP 更稳、更适合新用户。

## Highlights

- 创建项目时先询问用户背景和代码经验，方便 AI 判断用户是不是代码小白。
- AI 访谈问题支持填写“我的想法”，也支持“当前没计划，后续再考虑”。
- ProjectSpec 生成增加最低对齐度门槛，减少第一次访谈后误生成过薄报告。
- Markdown 生成失败时会降级使用本地模板，不再因为模型或本地代理失败卡死。
- Web 导出 `project-spec.json` 和 ZIP 共用同一条脱敏路径。
- CLI 错误提示更友好，预期错误不再直接暴露 Node 堆栈。
- examples 已纳入发布校验，并用 CLI 子进程测试确认示例 `project-spec.json` 能写出完整 7 个任务文件。

## Security

- API Key 继续保持 local-first。
- API Key 不应进入 ProjectSpec、Markdown、ZIP、examples、logs、screenshots、issues 或 commits。
- 发布校验会扫描文档、示例、测试、GitHub 模板和开发日志中的疑似 Key。
- 如果 Key 曾经出现在聊天、截图、日志或 issue 中，请立即到供应商后台撤销旧 Key，并创建新 Key。

## Validation

发布前验证命令：

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

## Known Limitations

- npm alpha 尚未发布，目前仍使用本地源码 CLI 命令。
- DeepSeek 访谈质量还需要继续优化：部分流程中可能出现重复追问、问题偏专业的问题。
- 当前仍是 local-first alpha，不是 SaaS，也不是一键桌面安装版。
