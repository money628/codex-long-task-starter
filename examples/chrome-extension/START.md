# Tech Explain Translator 启动指令

## 首次启动

请先阅读 AGENTS.md、Prompt.md、Plan.md、Implement.md、Documentation.md、Continuity.md，然后从 Plan.md 的第一个里程碑开始执行。不要只给建议，请直接修改代码并验证。

## 续跑指令

请读取 Continuity.md 的 Now/Next，继续推进当前任务。若上下文缺失，先阅读 Documentation.md 和 Plan.md，再继续实现。

## 跑偏修正

如果实现偏离 MVP 范围，请回到 Prompt.md 的 MVP 范围和非目标，删除或暂停超范围工作，并更新 Continuity.md。

## 上下文丢失恢复

请重新读取 START.md、Continuity.md、Documentation.md、Plan.md，并根据最近执行记录恢复。

## 给 Codex/OpenCode 的执行指令

目标：让用户在不离开当前网页的情况下理解英文技术内容，并沉淀可复制的中文摘要。

第一步：Extension MVP

验收：
- 扩展可加载
- 选中文本可解释
- 错误提示不泄露 Key
- README 说明安装方式