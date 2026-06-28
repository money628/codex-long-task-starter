# codex-long-task-starter

把 Codex 长任务启动器 / Codex Long Task Starter 生成的 `project-spec.json` 或 Markdown 文件包写入当前项目目录。

## 使用

从 `project-spec.json` 生成并写入当前目录：

```bash
npx codex-long-task-starter init --spec ./project-spec.json
```

从已生成的 Markdown 目录写入当前目录：

```bash
npx codex-long-task-starter init-files ./generated
```

检查当前目录是否准备好：

```bash
npx codex-long-task-starter doctor
```

检测 `START.md` 并提示启动 Codex/OpenCode：

```bash
npx codex-long-task-starter run
```

## 安全规则

- 默认只写入当前目录。
- 覆盖已有文件前会询问：跳过、覆盖、备份后覆盖。
- 不读取、不上传用户代码。
- 不收集、不写入 API Key。
