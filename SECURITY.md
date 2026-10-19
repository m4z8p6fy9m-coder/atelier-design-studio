# Security

Atelier is an early-stage project. Security fixes target the current `main` branch; no long-term support policy is in place.

## Reporting a vulnerability

If the repository's **Security → Report a vulnerability** option is available, use it to report privately. Otherwise, open an issue asking the maintainer for a private reporting channel **without including exploit details, credentials or personal information**. Private vulnerability reporting is not assumed to be enabled.

Include the affected version, impact, reproduction steps and a minimal example through the private channel once available. No response-time guarantee or bug bounty is offered.

## Running Atelier

The 0.10.4 public demo and unmodified download run in guest mode only. Account APIs are disabled in the shipped configuration; private vaults require your own deployment and Appwrite project. See [SELF-HOSTING-VAULTS.md](docs/SELF-HOSTING-VAULTS.md). Guest browser data is readable local storage, not an encrypted vault. Removing the old demo hostname is an operator step and does not revoke every possible API client.

- Keep `.env`, SMTP credentials, OAuth secrets and the server `data/` directory out of Git.
- Use HTTPS and persistent storage for an internet-facing account server. Follow [server setup](docs/SERVER.md) and [account setup](docs/ACCOUNTS.md).
- Export backups before clearing browser storage. The static editor stores projects in the current browser and origin.
- Do not upload private designs or session data with a bug report.

## Private vaults in 0.10

The optional managed Appwrite mode encrypts private workspace records in the browser before local storage and backup. The guest workspace and optional legacy Node collaboration server do not share this guarantee. See [PRIVATE-VAULTS.md](docs/PRIVATE-VAULTS.md) for key handling, recovery limits, exposed metadata, multi-tab behavior and malicious-host/script threats. No independent security audit has been performed.

## 0.10.1 candidate

See [the hardening record](docs/HARDENING-0.10.1.md) for reproduced failures, exact test evidence and limits. Same-origin tab revocation is cooperative, cloud compare-and-swap remains unavailable, legacy histories lack authenticated parent links, and provider-double tests are not real multi-account validation. This candidate is not published by the local hardening work.

Lokaler Kandidat 0.10.2: [Prüfbericht, Migration und verbleibende Grenzen](docs/HARDENING-0.10.2.md), [CSP/HTTP-Header](docs/CSP-HEADERS.md). Kein unabhängiges Audit; alte Passwort-Hüllen und Backups bleiben grundsätzlich nutzbar.

Lokaler 0.10.3-Kandidat: [Prüfbericht und Grenzen](docs/HARDENING-0.10.3.md), [Formate für Review](docs/FORMAT.md), [ausgeschalteter Remote-CAS-Prototyp](docs/REMOTE-CAS.md). Keine echte DEK-Rotation; alte Hüllen können weiter denselben Datenschlüssel freigeben. Echte Provider-/CAS-Live-Nachweise fehlen.
