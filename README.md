# Codex Long Task Starter

Local-first AI tooling that turns vague project ideas into Codex / OpenCode executable task packs.

Codex Long Task Starter helps you configure your own OpenAI-compatible API key, run an AI interview to clarify requirements, generate a validated `ProjectSpec`, export Codex/OpenCode-ready Markdown files, and write them into a target project with a CLI.

中文说明见 [README.zh-CN.md](README.zh-CN.md)。

Current version: `v0.1.0-alpha.0`

## Who It Is For

- Developers who want to use Codex / OpenCode for longer coding tasks but need better starting documents.
- Solo builders who want requirements, plans, implementation notes, and continuity context in one local workflow.
- Users who prefer bringing their own OpenAI-compatible API key instead of uploading project ideas to a hosted SaaS.
- Maintainers who need repeatable Markdown task packs for handoff, continuation, and review.

## Core Flow

```text
Configure model -> Create project draft -> AI interview -> Validate / complete ProjectSpec
        -> Generate 7 Markdown files -> Download ZIP / export JSON
        -> CLI writes files to target project -> Give START.md to Codex / OpenCode
```

Generated files:

- `Prompt.md`
- `Plan.md`
- `Implement.md`
- `Documentation.md`
- `Continuity.md`
- `AGENTS.md`
- `START.md`

## Quick Start

```bash
pnpm install --frozen-lockfile=false
pnpm dev
```

Open:

```text
http://localhost:5173/
```

## Feature Highlights

- Chinese Web UI for model configuration, project creation, AI interview, ProjectSpec preview, and Markdown export.
- OpenAI-compatible provider presets: OpenAI, DeepSeek, Moonshot / Kimi, Qwen, OpenRouter, and custom providers.
- Local proxy mode to reduce browser CORS issues during local development.
- JSON validation and repair for interview turns and ProjectSpec generation.
- ProjectSpec completeness checks before final Markdown generation.
- ZIP download and `project-spec.json` export.
- CLI commands: `init`, `init-files`, `doctor`, and `run`.
- Realistic examples for a todo app and a Chrome extension.
- Release verification script and GitHub Actions CI.

## Web Usage

1. Open the Web app.
2. Go to model configuration.
3. Choose a provider preset or enter a custom Base URL.
4. Enter your own API key.
5. Test the connection.
6. Create a project draft.
7. Answer the AI interview questions.
8. Generate and inspect `ProjectSpec`.
9. Continue the interview or use auto-completion if required fields are missing.
10. Generate Markdown files.
11. Edit, copy, download ZIP, or export `project-spec.json`.

## API Configuration

This project calls OpenAI-compatible `/chat/completions` endpoints.

Fields:

- Provider Name: display name only.
- Base URL: provider API root URL.
- API Key: your provider key.
- Model Name: model ID.
- Request Mode:
  - Local proxy: recommended for local development and CORS avoidance.
  - Browser direct: only for local models or providers that explicitly allow CORS.

DeepSeek example:

```text
Provider Name: DeepSeek
Base URL: https://api.deepseek.com
Model Name: deepseek-chat
Request Mode: Local proxy
```

## CLI Usage

Generate and write files from `project-spec.json`:

```bash
npx codex-long-task-starter init --spec ./project-spec.json
```

Write existing generated Markdown files into the current directory:

```bash
npx codex-long-task-starter init-files ./generated
```

Check whether the current directory has the required long-task files:

```bash
npx codex-long-task-starter doctor
```

Detect `START.md` and print the next action:

```bash
npx codex-long-task-starter run
```

CLI safety rules:

- Writes only inside the current directory.
- Asks before overwriting existing files.
- Does not write API keys.

## Security Reminder

- API keys are local-first and stored in the current browser `localStorage`.
- API keys must not be committed to Git.
- API keys must not be included in `ProjectSpec`, Markdown files, ZIP exports, examples, logs, issues, screenshots, or test snapshots.
- The local proxy forwards keys only for active requests and should not persist or print them.
- Browser direct mode may expose request metadata to browser tooling and can fail because of CORS.
- If a key has been shared in chat, screenshots, issue text, logs, or commits, revoke it with the provider and create a new one.

See [SECURITY.md](SECURITY.md).

## Examples

```text
examples/simple-todo-app/
examples/chrome-extension/
```

Each example includes `project-spec.json` and the 7 generated Markdown files.

## Validation Commands

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

## Known Limitations

- `v0.1.0-alpha.0` is an alpha release for local use.
- No login, cloud database, billing, team collaboration, template marketplace, Electron app, or Docker image.
- Real model quality should continue to be tested with more long-form project interviews.
- npm alpha publishing has not been completed yet.

## Project Docs

- [中文 README](README.zh-CN.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [Release Notes](RELEASE_NOTES.md)
- [发布说明中文](RELEASE_NOTES.zh-CN.md)
- [Release Checklist](docs/release-checklist.md)
- [GitHub Release Preparation](docs/github-release.md)
- [Next Planning Brief](docs/next-planning-brief.md)

## License

MIT
