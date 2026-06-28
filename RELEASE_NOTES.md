# Codex Long Task Starter v0.1.0-alpha.1

`v0.1.0-alpha.1` is a usability hardening release for real local trials.

## Highlights

- Better beginner-friendly interview flow: the Web UI now asks for the user's background and coding experience before starting the AI interview.
- Interview answers can now include free-form user thoughts, and users can mark a question as "consider later" instead of being forced into a premature technical answer.
- ProjectSpec generation now has a minimum alignment threshold to reduce thin reports generated after only one interview turn.
- Markdown generation now falls back to local templates when the model or local proxy fails, so users can still edit, export, and continue.
- Web JSON export uses the same redaction path as ZIP export.
- CLI errors are now friendlier and do not expose Node stack traces for expected user mistakes.
- Examples are now verified during release checks, and CLI tests confirm example ProjectSpecs can write the full 7-file task pack.

## Security

- API keys remain local-first.
- API keys must not be exported to ProjectSpec, Markdown, ZIP files, examples, logs, screenshots, issues, or commits.
- Release verification scans documentation, examples, tests, GitHub templates, and dev logs for leaked key patterns.
- If a key was pasted into chat, screenshots, logs, or issues, revoke it immediately and create a new one.

## Validation

Validated before release:

```bash
pnpm install --frozen-lockfile=false
pnpm test
pnpm build
pnpm verify:release
pnpm devlog
node apps/cli/src/index.js doctor
```

## Known Limitations

- npm alpha is not published yet; use local checkout commands for now.
- DeepSeek interview quality still needs tuning: repeated questions and overly technical questions may appear in some flows.
- This is still a local-first alpha, not a hosted SaaS or one-click desktop app.
