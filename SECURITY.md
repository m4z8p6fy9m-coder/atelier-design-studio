# Security

Atelier is an early-stage project. Security fixes target the current `main` branch; no long-term support policy is in place.

## Reporting a vulnerability

If the repository's **Security → Report a vulnerability** option is available, use it to report privately. Otherwise, open an issue asking the maintainer for a private reporting channel **without including exploit details, credentials or personal information**. Private vulnerability reporting is not assumed to be enabled.

Include the affected version, impact, reproduction steps and a minimal example through the private channel once available. No response-time guarantee or bug bounty is offered.

## Running Atelier

- Keep `.env`, SMTP credentials, OAuth secrets and the server `data/` directory out of Git.
- Use HTTPS and persistent storage for an internet-facing account server. Follow [server setup](docs/SERVER.md) and [account setup](docs/ACCOUNTS.md).
- Export backups before clearing browser storage. The static editor stores projects in the current browser and origin.
- Do not upload private designs or session data with a bug report.

## Private vaults in 0.10

The optional managed Appwrite mode encrypts private workspace records in the browser before local storage and backup. The guest workspace and optional legacy Node collaboration server do not share this guarantee. See [PRIVATE-VAULTS.md](docs/PRIVATE-VAULTS.md) for key handling, recovery limits, exposed metadata, multi-tab behavior and malicious-host/script threats. No independent security audit has been performed.
