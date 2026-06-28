# Codex Long Task Starter

Local-first AI tooling that turns vague project ideas into Codex / OpenCode executable task packs.

Codex Long Task Starter helps you configure your own OpenAI-compatible API key, run an AI interview to clarify requirements, generate a validated `ProjectSpec`, export Codex/OpenCode-ready Markdown files, and write them into a target project with a CLI.

中文说明见 [README.md](README.md)。

Current version: `v0.1.0-alpha.1`

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

## Usage

See the Chinese default README for the most complete current usage guide: [README.md](README.md).

## Security Reminder

- API keys are local-first and stored in the current browser `localStorage`.
- API keys must not be committed to Git.
- API keys must not be included in `ProjectSpec`, Markdown files, ZIP exports, examples, logs, issues, screenshots, or test snapshots.
- If a key has been shared in chat, screenshots, issue text, logs, or commits, revoke it with the provider and create a new one.

See [SECURITY.md](SECURITY.md).

## Validation Commands

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

## License

MIT
