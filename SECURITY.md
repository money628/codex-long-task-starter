# Security Policy

Codex Long Task Starter is a local-first alpha project. It is designed to turn project ideas into `ProjectSpec` and Markdown task packs without exporting API keys or committing secrets to the repository.

## Supported Versions

| Version | Supported |
| --- | --- |
| `0.1.0-alpha.x` | Yes |

## API Key Rules

API keys are sensitive credentials. Treat them as secrets.

- API keys are entered by the user in the Web UI.
- API keys are stored in the current browser `localStorage`.
- API keys must not be committed to Git.
- API keys must not be written to `project-spec.json`.
- API keys must not be written to Markdown files.
- API keys must not be included in ZIP exports.
- API keys must not be included in examples.
- API keys must not be written to dev logs, console output, test snapshots, or release artifacts.
- API keys must not be pasted into GitHub issues, pull requests, discussions, screenshots, or chat messages.
- The local proxy forwards API keys only for the active request and should not persist, print, or cache them.

## If a Key Is Leaked

If an API key appears in chat, screenshots, issue text, logs, commits, examples, exported files, or any public place:

1. Revoke the key in the provider dashboard immediately.
2. Create a new key.
3. Remove the leaked key from local files, logs, screenshots, and browser storage.
4. If the key was committed, rotate the key even if the commit is later removed.
5. Check generated Markdown, ZIP exports, `project-spec.json`, examples, and dev logs before sharing again.

Do not open public issues containing real API keys.

## Browser Direct Mode

Browser direct mode sends requests from the browser to the configured OpenAI-compatible provider. This may fail because of CORS and may expose request metadata to browser tooling. For normal local development, use local proxy mode.

## Local Proxy Mode

Local proxy mode is intended for local development. It should forward API keys only for the active request. It must not write keys to disk, logs, generated Markdown, ZIP exports, examples, or release artifacts.

## Reporting a Vulnerability

Please report security issues through a private maintainer channel before publishing details publicly. Include:

- A short description of the issue.
- Steps to reproduce.
- Whether API keys, generated files, examples, logs, or local project files may be affected.
- Suggested mitigation if known.

Do not include real API keys in reports. Use redacted values such as `sk-...redacted`.
