# 0.10 release checks

- Syntax checks: passed.
- Automated tests: **110 passed**, including ten dedicated vault/storage/backup tests.
- Static build and official SDK bundle with seven dependency license notices: passed.
- Owner performed real email registration and entered the received verification code directly in Atelier: confirmed.
- Owner created the independent vault password directly in Atelier: confirmed.
- Created a four-page Study Notes test design inside the vault, renamed it, saved and uploaded its encrypted snapshot: passed. The account's online-history UI returned that snapshot (16 KB).
- Cloud console contains only `key.json` and `snapshot.json`, with owner-specific file permissions; the design title is not a server filename.
- File security enabled, persisted after console reload. Bucket-wide read/update/delete remain disabled.
- Unauthenticated descriptor download: denied (HTTP 404).
- Wrong password, altered ciphertext, swapped owner/context, account isolation, guest separation, late write cancellation, concurrent-save generation, offline unlock, backup restore, failed remote download and owner-only upload permission assertions: passed in automated tests.
- Opened a second browser tab, owner unlocked with the vault password, then explicitly loaded the encrypted online snapshot: passed. UI showed **Online-Fassung geladen**, and the four-page test design remained available. The encrypted backup download action was triggered before the reload; its filesystem destination was not verified.
- Real password-recovery email/reset and a second distinct authenticated provider account have **not** been tested end-to-end. Automated/local tests do not establish provider enforcement between two real accounts.
- Full browser restart offline/native installation: not newly verified; see the previous offline release notes.
- This is an early feature release, not an independent security audit. Read PRIVATE-VAULTS.md before relying on it for sensitive work or a public launch.

