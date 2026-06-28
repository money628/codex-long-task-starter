# Codex 长任务启动器 / Codex Long Task Starter 下一阶段规划讨论文档

本文档用于交给 GPT 或其他协作者，讨论项目从 `v0.1.0-alpha` 继续推进时的步骤规划。

## 1. 项目一句话定位

Codex 长任务启动器（Codex Long Task Starter）是一个面向 AI 编程长任务的本地优先启动器：通过 Web UI 配置用户自己的 OpenAI-compatible API Key，由 AI 动态访谈项目需求，生成结构化 `ProjectSpec`，再导出可交给 Codex / OpenCode 执行的 Markdown 文件包，并提供 CLI 写入目标项目目录。

## 2. 当前完成度判断

当前项目已经达到本地可运行、可真实接入模型、可生成文件、可 CLI 写入、可准备开源发布的 `v0.1.0-alpha` 状态。

整体完成度约为：

```text
MVP 功能完成度：90%+
开源发布准备度：85% - 90%
商业化 SaaS 准备度：不在当前阶段范围内
```

当前目标不应继续堆大功能，而是让 alpha 版本稳定、清晰、可安装、可演示、可迭代。

## 3. 已实现核心能力

### Web UI

- 首页
- 模型配置页
- 创建项目页
- AI 访谈页
- ProjectSpec 预览页
- Markdown 结果页
- 中文化 UI
- Provider Presets：
  - OpenAI
  - DeepSeek
  - Moonshot / Kimi
  - 通义千问 Qwen
  - OpenRouter
  - 自定义
- 本地代理模式，减少浏览器 CORS 问题
- 浏览器直连模式提示
- API 连接测试
- AI 动态访谈
- ProjectSpec 生成
- ProjectSpec 完整度检查
- 不完整时提示继续补齐
- Markdown 生成
- Markdown 编辑
- 复制当前文件
- 复制全部文件
- 下载 ZIP
- 导出 `project-spec.json`

### Core

- ProjectSpec schema
- ProjectSpec 校验
- 完整度检查
- Markdown 7 文件生成
- ZIP/export bundle 条目生成
- API Key 泄露检查相关测试

### AI

- OpenAI-compatible `/chat/completions` 调用
- Bearer API Key 传递
- JSON response_format 支持
- 模型返回 JSON 解析
- fenced JSON / 前后噪声解析
- JSON 修复流程
- InterviewTurnResult 校验
- ProjectSpec 生成与校验
- ProjectSpec 自动补齐尝试

### CLI

- `init`
- `init-files`
- `doctor`
- `run`
- 当前目录写入保护
- 覆盖已有文件前确认
- 本地 tarball 安装验证

### 文档与开源准备

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `codex.md`
- `docs/requirements.md`
- `docs/technical-spec.md`
- `docs/design-guidelines.md`
- `docs/development-process.md`
- `docs/acceptance-checklist.md`
- `docs/release-checklist.md`
- `docs/github-release.md`
- GitHub Actions CI
- GitHub issue 模板
- GitHub PR 模板
- `examples/simple-todo-app`
- `examples/chrome-extension`
- `dev-logs/` 每日开发日志机制

## 4. 当前验证结果

最近一轮验证均已通过：

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

测试情况：

```text
11 项测试通过
Web build 成功
verify:release 成功
CLI doctor 可启动
安全扫描未发现 sk-... 形式密钥
```

## 5. 安全状态

已重点检查：

- API Key 不进入 `ProjectSpec`
- API Key 不进入 Markdown
- API Key 不进入 ZIP
- API Key 不进入 examples
- API Key 不进入 dev-log
- API Key 不进入 release tarball 验证范围
- localStorage 使用已在 README / SECURITY 中说明
- 浏览器直连风险已说明
- 本地代理模式已说明

注意：

用户曾在聊天中暴露过 DeepSeek Key。正式继续使用前，建议用户到供应商后台撤销旧 Key 并生成新 Key。

## 6. 当前已知风险和限制

### Git 仓库风险

当前本机 Git 根目录曾被识别为 `C:/`，不适合直接执行：

```bash
git add .
```

发布前必须把项目目录整理成独立 Git 仓库，避免误提交系统文件。

参考：

```text
docs/github-release.md
```

### 真实模型质量风险

DeepSeek 短流程已跑通过，但更长、更复杂项目仍需继续观察：

- 追问是否足够深入
- ProjectSpec 是否遗漏边界条件
- Markdown 是否足够可执行
- 是否容易让 Codex / OpenCode 理解并持续执行

### npm 发布未完成

当前只是本地 tarball 验证通过，尚未真实发布到 npm registry。

发布后还需要验证：

```bash
npx codex-long-task-starter@alpha doctor
```

## 7. 不建议下一阶段立即做的事

当前不建议立刻做：

- 用户登录
- 云端数据库
- SaaS 收费
- 团队协作
- 模板市场
- 多租户
- Electron 桌面端
- Docker 化
- 大规模 UI 重写
- 后端重构
- 新模型复杂适配

原因：

当前最重要的是让 alpha 版本稳定、可信、可发布、可被真实用户跑通，而不是提前进入商业化平台建设。

## 8. 建议 GPT 重点讨论的问题

请围绕下面问题规划下一阶段，不要一次性扩大范围。

### 问题 1：先 GitHub 开源，还是先 npm alpha？

可选路线：

```text
A. 先 GitHub 开源发布，再 npm alpha
B. 先本地继续打磨 Web 体验，再 GitHub 开源
C. 先 npm alpha，再公开 GitHub Release
```

推荐：

```text
A. 先 GitHub 开源发布，再 npm alpha
```

理由：

- 当前已有 GitHub 发布文档、CI、issue/PR 模板。
- GitHub 开源后更容易收集反馈。
- npm alpha 可以在 GitHub Release 后进行，避免包发布说明不足。

### 问题 2：alpha 发布后第一轮优化重点是什么？

推荐优先级：

```text
1. Web 真实用户流程打磨
2. 真实模型长对话质量评估
3. 示例模板增加
4. npm alpha 发布
5. README / docs 根据反馈迭代
```

### 问题 3：是否需要后端服务？

当前不建议引入正式后端。

可以保留：

- Vite dev server 本地代理
- 用户本地 API Key
- 本地浏览器存储
- 本地导出

只有当出现以下需求时再讨论后端：

- 云端保存历史项目
- 多设备同步
- 用户账号
- 团队协作
- 付费额度
- 托管代理

### 问题 4：是否需要增加更多 Provider？

短期不建议大规模增加。

更重要的是确保现有 OpenAI-compatible 抽象稳定：

- Base URL
- API Key
- Model Name
- 本地代理 / 浏览器直连
- 错误提示
- JSON 修复

后续可按用户反馈补：

- SiliconFlow
- 火山方舟
- 智谱 GLM
- 本地 Ollama-compatible 网关

### 问题 5：是否需要更强的模板系统？

短期建议只增加 examples，不做模板市场。

可先新增：

- Next.js SaaS
- Chrome extension
- CLI tool
- Mobile app
- Automation script
- Landing page
- Data dashboard

等 examples 足够稳定后，再考虑模板系统。

## 9. 推荐下一阶段路线

### 阶段 1：干净 GitHub 开源发布

目标：

- 项目进入独立 Git 仓库
- 推送 GitHub
- CI 通过
- 创建 `v0.1.0-alpha.0` Release

步骤：

1. 创建干净项目 Git 仓库。
2. 只添加项目相关文件。
3. 跑完整验证。
4. 推送 GitHub。
5. 检查 GitHub Actions。
6. 创建 Release。

完成标准：

```text
GitHub 仓库可访问
README 可读
CI 通过
Release notes 完整
没有密钥泄露
```

### 阶段 2：真实用户流程体验打磨

目标：

- 让新用户 5 分钟内跑通
- 减少配置 API 时的困惑
- 减少访谈 / 生成失败时的挫败感

重点：

- API 配置页提示
- 错误文案
- 访谈中的继续 / 返回 / 重试
- ProjectSpec 不完整提示
- Markdown 结果页导出状态
- README 与 UI 文案一致

完成标准：

```text
从 README 到 Web UI 到 ZIP 导出路径顺畅
失败场景都有中文下一步建议
```

### 阶段 3：npm alpha 发布

目标：

- CLI 可通过 npm alpha 使用

步骤：

1. 发布 `@codex-starter/core`。
2. 发布 `codex-long-task-starter`。
3. 使用 alpha tag。
4. 远程验证 `npx codex-long-task-starter@alpha doctor`。
5. README 更新 npm 安装说明。

完成标准：

```text
npx codex-long-task-starter@alpha doctor 可运行
CLI init / init-files / run 可在临时目录验证
```

### 阶段 4：增加示例模板

目标：

- 提高用户理解成本
- 提高真实项目覆盖面

建议新增 examples：

- `nextjs-saas-dashboard`
- `developer-cli-tool`
- `personal-portfolio`
- `automation-script`
- `data-dashboard`

完成标准：

```text
每个 example 包含 project-spec.json 和 7 个 Markdown 文件
内容真实可读
不包含密钥
```

## 10. 建议下次交给 Codex 的任务

可以直接给 Codex 下这条任务：

```text
请按 docs/github-release.md 和 docs/release-checklist.md，把当前项目整理成适合 GitHub 开源发布的干净仓库状态。

要求：
1. 不改业务功能。
2. 不重写 UI。
3. 检查当前 Git 根目录是否异常。
4. 如果 Git 根目录仍是 C:/，不要执行 git add .，只给出安全迁移步骤。
5. 运行 pnpm install --frozen-lockfile=false、pnpm test、pnpm build、pnpm verify:release、pnpm devlog、node apps/cli/src/index.js doctor。
6. 检查是否有 sk-... 密钥残留。
7. 输出是否可以推送 GitHub，以及下一步要用户手动确认的事项。
```

## 11. 最推荐的下一步选择

推荐选择：

```text
A. 创建干净 GitHub 仓库并发布 v0.1.0-alpha.0
```

不要急着做 SaaS，不要急着做登录数据库。先让这个工具以开源 alpha 形态真实可用、可安装、可反馈。
