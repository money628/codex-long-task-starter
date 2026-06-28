# Tech Explain Translator 长任务执行规则

## 每轮执行前读取

- START.md
- Prompt.md
- Plan.md
- Continuity.md
- Documentation.md
## 执行方式

- 根据 Continuity.md 的 Now/Next 判断当前任务
- 一次只推进一个可验证里程碑
- 修改前先理解已有结构，不做无关重构
- 上下文不足时优先查阅项目文档和代码
## 验证与修复

- Chrome 开发者模式加载测试
- 模拟 API 响应
- 手动检查 storage 和控制台日志
- 构建失败时先修复，不停止在建议层面
- 修复后更新 Documentation.md 与 Continuity.md
## 何时提问

- 当关键业务事实缺失且会影响不可逆设计时提问
- 普通实现细节可以合理假设，并写入 assumptions 或 Continuity.md
