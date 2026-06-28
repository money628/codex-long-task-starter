# Security Policy

Codex Long Task Starter is a local-first alpha project. It is designed to help users turn project ideas into `ProjectSpec` and Markdown files without sending API keys to this repository or to generated exports.

## Supported Versions

| Version | Supported |
| --- | --- |
| `0.1.0-alpha.x` | Yes |

## API Key Handling

- API keys are entered by the user in the Web UI.
- API keys are stored in the current browser `localStorage`.
- API keys must not be written to `project-spec.json`.
- API keys must not be written to Markdown files.
- API keys must not be included in ZIP exports.
- API keys must not be written to dev logs or console output.
- The local proxy forwards API keys only for the active request and should not persist or print them.

If an API key has been shared in chat, issue text, logs, screenshots, or commits, revoke it with the provider and create a new one.

## Browser Direct Mode

Browser direct mode sends requests from the browser to the configured OpenAI-compatible provider. This may fail because of CORS and may expose request metadata to browser tooling. For normal local development, use local proxy mode.

## Reporting a Vulnerability

For now, please report security issues by opening a private maintainer channel before publishing details publicly. Include:

- A short description of the issue.
- Steps to reproduce.
- Whether API keys, generated files, or local project files may be affected.
- Suggested mitigation if known.

Do not include real API keys in reports.
