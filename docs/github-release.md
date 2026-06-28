# GitHub Release Preparation

Use this document when publishing Codex Long Task Starter as an open source `v0.1.0-alpha` project.

## Repository Setup

Recommended repository name:

```text
codex-long-task-starter
```

Short description:

```text
Local-first Web and CLI starter that turns AI coding project ideas into ProjectSpec and Codex/OpenCode-ready Markdown task packs.
```

Suggested topics:

```text
codex, opencode, ai-coding, openai-compatible, project-spec, markdown-generator, cli, react, vite, local-first
```

Important note for this local workspace:

The current machine may report the Git root as `C:/`. Before publishing, create or move to a clean project-only Git repository so system files are never staged.

Recommended clean publish flow:

```bash
cd "C:\Users\13974\Documents\结合工作流"
git init
git add apps packages docs examples scripts tests .github README.md LICENSE CONTRIBUTING.md SECURITY.md CHANGELOG.md codex.md package.json pnpm-lock.yaml pnpm-workspace.yaml
git status --short
git commit -m "chore: prepare v0.1.0-alpha release"
git branch -M main
git remote add origin https://github.com/<owner>/codex-long-task-starter.git
git push -u origin main
```

If Git still points at `C:/`, stop and create a fresh folder or fix the local Git setup before adding files.

## Release Title

```text
v0.1.0-alpha.0
```

## Release Notes Draft

Use `RELEASE_NOTES.md` as the canonical English release notes and `RELEASE_NOTES.zh-CN.md` as the Chinese release notes.

Codex Long Task Starter `v0.1.0-alpha.0` is the first local-first alpha release. It helps users configure their own OpenAI-compatible API key, run an AI interview for project requirements, generate a validated `ProjectSpec`, export Codex/OpenCode-ready Markdown files, and write those files into a target project through the CLI.

### Highlights

- Chinese Web UI for model configuration, project creation, AI interview, ProjectSpec preview, and Markdown export.
- OpenAI-compatible provider presets including OpenAI, DeepSeek, Moonshot / Kimi, Qwen, OpenRouter, and custom providers.
- Local proxy mode to reduce browser CORS issues.
- JSON validation and repair for interview turns and ProjectSpec generation.
- ZIP download and `project-spec.json` export.
- CLI commands: `init`, `init-files`, `doctor`, and `run`.
- Example outputs for a todo app and Chrome extension.
- Release verification script and GitHub Actions CI.

### Security

- API keys are local-first and must not be included in Markdown, ZIP exports, ProjectSpec, examples, logs, or issues.
- Users who previously shared a key in chat or screenshots should revoke it and create a new one.
- See `SECURITY.md` for details.

### Validation

Before this release, run:

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

### Known Limitations

- Alpha release, intended for local use.
- No login, cloud database, SaaS billing, team collaboration, template marketplace, Electron app, or Docker image.
- Real model quality should continue to be tested with more long-form project interviews.

## After Publishing

- Confirm GitHub Actions passes on `main`.
- Create the `v0.1.0-alpha.0` GitHub Release from the notes above.
- If publishing to npm, follow `docs/release-checklist.md`.
- After npm publish, verify:

```bash
npx codex-long-task-starter@alpha doctor
```
