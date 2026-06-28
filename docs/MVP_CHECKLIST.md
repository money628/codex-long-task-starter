# MVP 检查清单

本清单基于当前仓库代码、README 和用户目标整理。仓库中未找到 `docs/PROJECT_PLAN.md`、`docs/MVP_PLAN.md`、`docs/ROADMAP.md`，因此本清单作为当前 MVP 推进依据。

## 当前状态

### 已完成

- [x] Monorepo 结构：`apps/web`、`apps/cli`、`packages/core`、`packages/ai`。
- [x] 中文 Web UI：首页、模型配置、创建项目、AI 访谈、ProjectSpec、Markdown 结果。
- [x] Provider presets：OpenAI、DeepSeek、Moonshot / Kimi、Qwen、OpenRouter、自定义。
- [x] API Key 使用 localStorage 保存。
- [x] 本地代理 `/api/chat-completions`。
- [x] 浏览器直连模式。
- [x] OpenAI-compatible `/chat/completions` 调用。
- [x] API 连接测试。
- [x] AI 访谈 turn JSON 解析、修复和校验。
- [x] ProjectSpec schema、校验和完整度门控。
- [x] ProjectSpec 预览和 JSON 编辑。
- [x] Markdown 7 文件生成。
- [x] Markdown 编辑、复制、预览切换。
- [x] ZIP 下载。
- [x] `project-spec.json` 导出。
- [x] CLI `init`、`init-files`、`doctor`、`run`。
- [x] CLI 当前目录写入保护和覆盖确认。
- [x] 示例项目：todo app、Chrome extension。
- [x] README 中文首页、英文 README、中文使用手册。
- [x] SECURITY、RELEASE_NOTES、CHANGELOG、CONTRIBUTING。
- [x] GitHub Actions CI。
- [x] 发布验证脚本。

### 已修复的真实试用问题

- [x] 左侧菜单按钮不可交互。
- [x] ProjectSpec 大纲按钮不可交互。
- [x] AI 访谈必填问题未回答时缺少反馈。
- [x] 结果页“实时编辑 / 纯预览”只是装饰。
- [x] OpenAI-compatible 服务不支持 `response_format` 时缺少降级。
- [x] 误输入 `sk-...` 形式 Key 时，ProjectSpec、Markdown 和导出包会脱敏。
- [x] 结果页 CLI 命令误写未发布 npm 的 `npx` 用法。
- [x] Web `project-spec.json` 导出改走核心 bundle，避免绕过脱敏入口。
- [x] API 配置会清理 Base URL、API Key、Model Name 前后空格，避免复制粘贴导致连接失败。
- [x] CLI `init-files` 在目录没有任务文件时会给出明确错误，不再假装处理成功。
- [x] CLI 命令失败时输出友好中文错误，不再默认暴露 Node 堆栈。
- [x] 发布校验会验证示例 `project-spec.json` 合法且示例 Markdown 文件齐全。
- [x] CLI `init` 已用示例 `project-spec.json` 做真实写入回归测试。

### 需要继续观察

- [ ] DeepSeek 真实外部 API 的长对话质量。
- [ ] 用户填写非标准模型名时的错误提示是否足够清楚。
- [ ] ProjectSpec 自动补齐在复杂项目中的稳定性。
- [ ] Markdown 是否足够直接交给 Codex / OpenCode 执行。
- [ ] 桌面快捷方式目前是本机辅助脚本，不是正式安装器。
- [ ] npm alpha 尚未发布。

## 核心闭环验收

- [x] 用户可以打开 Web UI。
- [x] 用户可以配置模型 Provider 和 API Key。
- [x] 用户可以创建项目。
- [x] AI 可以开始访谈用户需求。
- [x] 访谈 turn 可以稳定处理 JSON 返回。
- [x] 可以生成合法 ProjectSpec。
- [x] ProjectSpec 可以预览。
- [x] 可以导出 Markdown 文件。
- [x] 可以导出 `project-spec.json`。
- [x] 可以下载 ZIP。
- [x] CLI 可以初始化项目文件。
- [x] CLI doctor 可以检查环境。
- [x] 示例项目可以作为真实参考。
- [x] 测试、构建、发布校验命令可以通过。

## 安全验收

- [x] API Key 不应进入 ProjectSpec。
- [x] API Key 不应进入 Markdown。
- [x] API Key 不应进入 ZIP。
- [x] API Key 不应进入 examples。
- [x] API Key 不应进入 dev logs。
- [x] API Key 不应进入 GitHub issue 模板。
- [x] API Key 不应进入测试快照。
- [x] 文档提醒：泄露 Key 后应立即 revoke 并重新创建。

## 发布前验证命令

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

## 下一步建议

优先推进 `v0.1.1-alpha`：

1. 用真实 DeepSeek Key 跑 2-3 个真实项目。
2. 根据真实卡点修复访谈、错误提示和导出内容质量。
3. 增加更多真实 examples。
4. 稳定后再发布 npm alpha。
