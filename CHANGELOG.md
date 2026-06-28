# Changelog

## 0.1.0-alpha.1 - 2026-06-28

Usability hardening release for the first real local-first trial flow.

### Added

- User background and coding-experience fields before the AI interview.
- Interview controls for free-form user thoughts and "consider later" answers.
- ProjectSpec generation threshold to reduce premature thin reports.
- Local Markdown fallback when the model/proxy call fails during Markdown generation.
- CLI-friendly error output without Node stack traces for expected user mistakes.
- Release checks that validate example ProjectSpecs and example Markdown files.
- CLI regression tests that write generated files from example `project-spec.json`.

### Fixed

- Result page CLI command now matches the current source checkout flow before npm alpha publishing.
- Web `project-spec.json` export uses the same redaction path as ZIP export.
- API config trims Base URL, API Key, and model name to avoid copy/paste whitespace failures.
- `init-files` now reports an empty/wrong directory instead of pretending success.
- ProjectSpec bottom action bar no longer overlaps with the bottom route dock.

### Security

- Export redaction now covers ProjectSpec, Markdown files, ZIP bundle entries, and JSON export paths.
- Release verification continues to scan examples, docs, tests, dev logs, GitHub templates, and release docs for leaked keys.

### Known Limitations

- npm alpha is still not published; local checkout CLI commands are documented instead.
- DeepSeek interview quality still needs prompt tuning: some questions can repeat or be too technical for non-coders.
- This remains a local-first alpha, not a SaaS or one-click desktop installer.

## 0.1.0-alpha.0 - 2026-06-28

First alpha release candidate for open source publishing.

### Added

- Local-first Web UI for model configuration, project creation, AI interview, ProjectSpec preview, and Markdown export.
- OpenAI-compatible API integration with provider presets and local proxy mode.
- JSON parsing, schema validation, repair flow, ProjectSpec completeness checks, and Markdown generation.
- ZIP download and `project-spec.json` export.
- CLI commands: `init`, `init-files`, `doctor`, and `run`.
- Example projects for a simple todo app and a Chrome extension.
- Release verification script, GitHub Actions CI, development logs, and project documentation.

### Security

- API keys are excluded from ProjectSpec, Markdown files, ZIP exports, examples, and dev logs.
- Release verification scans examples and package metadata before publishing.

### Known Limitations

- This is an alpha release for local use, not a hosted SaaS.
- No user system, cloud database, billing, team collaboration, template marketplace, Electron app, or Docker image is included.
- Real model quality should continue to be evaluated with more long-form project interviews.
