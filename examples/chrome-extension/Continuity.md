# Tech Explain Translator 跨会话状态账本

## 目标

让用户在不离开当前网页的情况下理解英文技术内容，并沉淀可复制的中文摘要。
## 成功验收标准

- 右键菜单可触发
- 侧边栏可显示解释
- 配置页可保存 Key
- 复制摘要可用
- 无 Key 时提示配置
## 约束

- API Key 只存浏览器本地
- 不自动抓取整页内容
- 限制单次解释文本长度
- 错误信息必须中文化
## 关键决策

- 第一版只支持 Chrome
- 用户会自行提供 API Key
- 侧边栏优先于弹窗体验
- 增加最大字符数限制
- 优先支持本地配置测试连接
- 保留 mock 模式便于开发
## Done

- 已生成项目启动文件包
## Now

- 阅读 START.md 并确认第一阶段任务
## Next

- Extension MVP
## 待确认问题

- 是否需要本地历史记录
## 工具/密钥清单

- 不要把 API Key 写入仓库或 Markdown
- 需要的外部依赖：Chrome Extension APIs、OpenAI-compatible API
