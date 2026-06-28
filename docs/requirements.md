# 开发需求

## 项目定位
Codex Long Task Starter 是 AI 项目访谈官 + Codex/OpenCode 长任务文件生成器 + CLI 自动写入工具。

核心价值不是固定模板填空，而是在开发前通过 AI 深度访谈，把模糊想法整理成结构化 ProjectSpec，再生成可长期执行的项目上下文文件。

## MVP 范围
- Web 端模型配置，用户自带 OpenAI-compatible API Key。
- API 连接测试。
- AI 动态访谈与结构化问题渲染。
- InterviewTurnResult JSON 校验。
- ProjectSpec JSON 生成与 Zod 校验。
- 生成 7 个 Markdown 文件：Prompt.md、Plan.md、Implement.md、Documentation.md、Continuity.md、AGENTS.md、START.md。
- Markdown 预览、编辑、复制、下载 ZIP。
- 导出 project-spec.json。
- CLI 从 project-spec.json 或已生成文件写入当前目录。
- CLI doctor 检查文件和环境。

## 暂不做
- 用户登录、付费系统、云端保存项目、模板市场、团队协作。
- 自动托管用户代码、GitHub 自动提交、共享 Codex 账号。
- 数据库和用户系统。

## 安全要求
- API Key 默认只保存在浏览器 localStorage。
- 不把 API Key 写入 Markdown、ZIP、project-spec.json、日志或 CLI 命令。
- Web 默认通过本机开发服务器代理转发模型请求，代理不保存、不打印 API Key。
- 无 API Key 时只能进入示例模式，不伪装成真实高质量 AI 生成。
- CLI 默认只写入当前目录，覆盖已有文件前必须确认。
- ProjectSpec 必填信息不完整时，不允许生成最终 Markdown 文件包。
