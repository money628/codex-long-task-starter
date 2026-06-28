# Codex Long Task Starter v0.1.0-alpha.0

Codex Long Task Starter `v0.1.0-alpha.0` is the first local-first alpha release.

It helps users configure their own OpenAI-compatible API key, run an AI interview for project requirements, generate a validated `ProjectSpec`, export Codex/OpenCode-ready Markdown files, and write those files into a target project through the CLI.

## Highlights

- Chinese Web UI for model configuration, project creation, AI interview, ProjectSpec preview, and Markdown export.
- OpenAI-compatible provider presets: OpenAI, DeepSeek, Moonshot / Kimi, Qwen, OpenRouter, and custom providers.
- Local proxy mode to reduce browser CORS issues.
- JSON validation and repair for interview turns and ProjectSpec generation.
- ProjectSpec completeness checks before final Markdown generation.
- ZIP download and `project-spec.json` export.
- CLI commands: `init`, `init-files`, `doctor`, and `run`.
- Example outputs for a todo app and a Chrome extension.
- Release verification script and GitHub Actions CI.

## Security

- API keys are local-first and stored in the user's local browser environment.
- API keys must not be included in Markdown files, ZIP exports, `ProjectSpec`, examples, logs, issues, screenshots, commits, or test snapshots.
- If an API key has been shared in chat, screenshots, issues, logs, or commits, revoke it with the provider and create a new one.
- See `SECURITY.md` for the full security policy.

## Validation

The release candidate was checked with:

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

GitHub Actions CI passed on `main`.

## Known Limitations

- Alpha release, intended for local use.
- No login, cloud database, SaaS billing, team collaboration, template marketplace, Electron app, or Docker image.
- npm alpha publishing has not been completed yet.
- Real model quality should continue to be tested with more long-form project interviews.
