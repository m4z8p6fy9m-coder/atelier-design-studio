> **0.10.4: Demo = Gastmodus, private Tresore = Selbsthosting.** Die folgenden älteren Beschreibungen gelten nicht als Kontoangebot der öffentlichen Demo. Aktivierung, eigene Projektwerte, CSP und Grenzen: [SELF-HOSTING-VAULTS.md](SELF-HOSTING-VAULTS.md).

> Checkout 0.10.1 is an unpublished hardening candidate. See [HARDENING-0.10.1.md](HARDENING-0.10.1.md) for verified fixes, retention rules, migration limits and tests. The published 0.10.0 release does not include these changes.

# Private accounts and encrypted vaults

Atelier supports optional Appwrite Cloud accounts alongside its separate guest workspace. Configure only public project identifiers in `src/managed-config.js`. The browser bundle never needs an administrator API key or SMTP password.

## User workflow

1. Open **Konto & Tresor**, create an account with an email address and an account password (at least 12 characters).
2. Enter the email verification code. Appwrite sends the real email; check spam and the security phrase.
3. Create a **separate vault password** of at least 12 characters. Store it safely. It never goes to Appwrite. Email password recovery resets only the account password, **not** the vault password.
4. Create designs normally. Projects, assets, settings, own templates and saved versions are encrypted before IndexedDB writes. The open vault automatically queues an encrypted online snapshot after changes (30-second debounce, with a five-minute minimum between automatic full uploads); **Jetzt online sichern** also uploads it.
5. After reopening, log in if necessary and unlock the vault again. The latest online snapshot is loaded when there are no pending local edits. **Lokalen Tresor offline entsperren** opens the last vault on the same browser using its password and locally cached descriptor.
6. Use **Verschlüsselten Tresor herunterladen** for an independent encrypted backup. **Verschlüsselte Sicherung wiederherstellen** restores a backup of the same vault after confirmation. PNG/PDF/Atelier project exports intentionally remain readable exports.

Guest designs remain in the original browser database, separate from all accounts. They are not automatically uploaded. Export a guest design as an Atelier project and import it while your vault is open to transfer it intentionally. Browser storage is not a guaranteed disk folder: clearing website data or browser eviction removes local data. Keep portable backups.

## What is encrypted?

Native Web Crypto uses AES-256-GCM, a random 96-bit nonce for every encryption and owner/store/record-bound authenticated context. PBKDF2-HMAC-SHA256 derives a non-extractable in-memory key with a random 128-bit salt and 600,000 iterations. The salt, KDF parameters and encrypted password check are stored in the account's descriptor. The password and raw key are never persisted or sent. Project names, design content, images, fonts, custom templates, brand settings and local versions are encrypted. An online snapshot receives an additional authenticated encrypted envelope.

The provider and project administrator can see account emails/names, user IDs, file sizes, timestamps, snapshot-parent IDs and encrypted bytes. They can delete or deny access to backups. They cannot decrypt stored designs using an account-password reset alone. This is **not an independently audited or certified security product**. A compromised device, a script injection or malicious code delivered by the hosting operator while you unlock can access plaintext and the key. A web host's ability to change delivered JavaScript cannot be removed by browser encryption. Use a reviewed, locally run copy when that is part of your threat model. Choose a long, unique vault passphrase: encrypted password checks allow offline password guessing.

Appwrite handles authentication, rate limits and email delivery. The official SDK may use a session fallback in browser localStorage when cross-site cookies are blocked. This is an authentication token, not a vault key; it remains sensitive to same-origin script compromise. A custom API domain is a future hardening option. Google OAuth is not enabled in this integration.

## Backups, conflicts and limits

Online snapshots are immutable. Existing snapshots are not automatically deleted, so simultaneous uploads do not overwrite encrypted files. Before upload the client checks whether the newest accessible snapshot still matches its local head. If another device changed it, upload stops and local edits remain encrypted. This is optimistic detection, **not atomic multi-device editing**: simultaneous checks can both pass. Every uploaded file stays available in **Online-Sicherungen ansehen** (paginated up to a fail-closed 1000-file scan). Download local backups before choosing which remote snapshot to load; loading replaces this account's local workspace after confirmation. There is no automatic merge or realtime collaboration in vault mode.

Each uploaded file is capped at 20 MiB in both client and bucket configuration. Full snapshots include assets and versions, so frequent changes can consume storage quickly. Free Appwrite quotas apply to the entire project, including all users; backups are not unlimited or a permanent free-service guarantee. At quota/network errors, local encryption continues and pending changes remain marked. Retention is opt-in: ten newest and at least thirty days are kept; at most three authenticated, exclusively owned safe ancestors are removed after a successful sync. Legacy-anchored or conflicted histories may not be pruned at all. See the hardening guide for the exact rules and remaining cross-device race. Monitor usage before a broad launch. Never delete the key descriptor unless you have a verified portable backup and a recovery plan.

Updated tabs share origin-scoped revocation through BroadcastChannel and a persisted marker. A lock conceals private UI immediately and permits a bound local save for up to three seconds before key references are cleared. Suspended tabs process this on resume; old clients, other origins, devices and browser profiles do not share this protocol. Close every old-version tab before upgrading and every Atelier tab on a shared computer. Explicit account changes flush pending edits, clear editor state, imported font faces, selection, clipboard and asset caches, then switch storage contexts.

## Optional legacy server

`managedConfig.enabled=false` selects the older same-origin Node account system. Its shared-project storage is **plaintext on the server**, and its guest IndexedDB is plaintext. It does not inherit the encrypted vault guarantee. See SERVER.md and ACCOUNTS.md. Do not mix the two account systems in user-facing privacy claims.

## Änderung ab 0.10.2 (lokaler Kandidat, 18.10.2026)

Neue Tresore verwenden DEK/KEK und einen separat bestätigten Recovery-Key. Alte Tresore können ausdrücklich unter Angebot eines verschlüsselten Backups migriert werden; ihr bisheriger Schlüssel bleibt verschlüsselt zum Lesen alter Datensätze enthalten. Projekt- und Backup-Containerformat bleiben erhalten. Passwortwechsel verpackt den DEK neu und widerruft alte Kopien nicht. Maßgeblich sind Ablauf, Tests und verbleibende Grenzen in [HARDENING-0.10.2.md](HARDENING-0.10.2.md).

Ab 0.10.3: [Envelope-Spezifikation](FORMAT.md) und [Prüfbericht](HARDENING-0.10.3.md) beschreiben die nun unterstützten Formate, descriptorlosen Offline-Restore, Hash-Anker und Kompression. Alte Clients können gzip-V2 nicht lesen; alle alten Tabs vor Upgrade schließen. Neue Hash-Ketten werden nicht automatisch beschnitten.
