# Changelog

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
