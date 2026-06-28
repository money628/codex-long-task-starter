# Release Checklist

This checklist is for preparing `v0.1.0-alpha` open source releases.

## Before Release

- [ ] Confirm the working tree only contains intended changes.
- [ ] Confirm `README.md` explains the project, Web flow, CLI flow, API configuration, examples, FAQ, and security notes.
- [ ] Confirm `README.zh-CN.md` exists and is suitable for Chinese developers.
- [ ] Confirm `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, and `CHANGELOG.md` exist.
- [ ] Confirm `RELEASE_NOTES.md` and `RELEASE_NOTES.zh-CN.md` exist.
- [ ] Confirm `.github/ISSUE_TEMPLATE/` and `.github/pull_request_template.md` exist.
- [ ] Confirm `docs/github-release.md` has the repository description, topics, and release notes draft.
- [ ] Confirm `examples/` contains realistic generated files and no secrets.
- [ ] Confirm `docs/acceptance-checklist.md` reflects the real project status.
- [ ] Run `pnpm install --frozen-lockfile=false`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm verify:release`.
- [ ] Run `pnpm devlog`.
- [ ] Run `node apps/cli/src/index.js doctor`.

## Manual Web Verification

- [ ] Open the Web app locally.
- [ ] Configure provider preset and API key.
- [ ] Test connection.
- [ ] Create a project.
- [ ] Complete an AI interview.
- [ ] Generate and inspect ProjectSpec.
- [ ] Confirm incomplete ProjectSpec prompts the user clearly.
- [ ] Generate Markdown files.
- [ ] Edit Markdown.
- [ ] Copy current file.
- [ ] Copy all files.
- [ ] Download ZIP.
- [ ] Export `project-spec.json`.
- [ ] Confirm exported files do not contain API keys.

## CLI Verification

- [ ] `init` writes files from `project-spec.json`.
- [ ] `init-files` writes files from an existing generated directory.
- [ ] `doctor` reports required files.
- [ ] `run` detects `START.md` and prints the next action.
- [ ] Existing files are not overwritten without confirmation.

## Publishing Notes

Publish package order:

1. Publish `@codex-starter/core`.
2. Publish `codex-long-task-starter`.
3. Verify remote install with `npx codex-long-task-starter@alpha doctor`.

Use the `alpha` tag until the project is ready for a stable release.
