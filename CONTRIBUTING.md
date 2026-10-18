# Contributing to Atelier

Small, focused contributions are welcome: a reproducible bug report, a clearer guide, an accessible interaction or a well-scoped editor improvement.

## Start here

1. Read the [README](README.md) and [current scope](docs/FEATURES.md).
2. Search existing issues before opening a new one. For a substantial feature, describe the problem and proposed behavior in an issue first.
3. Fork the repository, create a branch and keep the change focused.
4. Explain what changed, why and how you verified it in your pull request. Include before/after screenshots for visual changes.

## Local development

Use Node.js 20.12 or newer. Run these commands from the repository root:

```sh
npm ci --ignore-scripts
npm start
```

Open http://127.0.0.1:4173. Source files use native JavaScript modules; there is no frontend framework or bundler to configure.

Before submitting code changes:

```sh
npm run check
npm test
npm run build
```

For rendering, storage or export changes, also open http://127.0.0.1:4173/tests/browser.html with the local server running. Describe which browsers and flows you checked.

## Project conventions

- Keep the static editor usable without an account or third-party API.
- Use browser APIs and existing modules where practical. Discuss new dependencies first.
- Respect keyboard navigation, focus states and readable contrast.
- Validate imported documents and treat uploaded files as untrusted input.
- Do not commit `.env`, credentials, server `data/`, user designs or generated `dist/` files.
- Include only code, artwork and fonts you have the right to share. Attribute third-party assets and their licenses.
- Add meaningful tests for behavior changes and update relevant documentation.

## Reporting bugs

Include browser/OS, steps to reproduce, expected and actual behavior. Attach a minimal sample only after removing private content. Use the bug report template when opening an issue.

## Security

Do not post credentials or exploitable security details in an issue. Follow [SECURITY.md](SECURITY.md).

Contributions are provided under this repository's [MIT license](LICENSE). Be constructive and respectful when collaborating.
