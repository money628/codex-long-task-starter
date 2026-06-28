# Tech Explain Translator 实时文档

## 当前项目结构

- manifest
- background
- content-script
- side-panel
- options
- storage
## 已完成功能

- 初始文档包已生成
## 未完成功能

- 选中文本读取
- 右键菜单
- 侧边栏 UI
- 模型配置
- 解释结果渲染
- 复制按钮
## 已知问题

- 网页 CSP 可能影响注入
- 长文本调用成本高
- 模型 JSON 输出不稳定
## 当前运行方式

UNCONFIRMED
## 测试方式

- Chrome 开发者模式加载测试
- 模拟 API 响应
- 手动检查 storage 和控制台日志
## 最近执行记录

- 由 Codex 长任务启动器 / Codex Long Task Starter 根据 ProjectSpec 初始化
