# Appwrite Cloud setup

The current integration uses the official Appwrite Web SDK 29.0.0, bundled locally. Email signup, verification OTP, password recovery OTP and private encrypted vaults are implemented. See [private vaults](PRIVATE-VAULTS.md) for user instructions, threat model and limits.

## Project configuration

Create your own Appwrite Cloud project on the Free plan. Register your exact production hostname as a Web app, plus `127.0.0.1` for local tests. Avoid wildcard origins. Use the real regional API endpoint shown by your console. Copy the endpoint, project ID and storage bucket ID to `src/managed-config.js`; those three identifiers are public. No administrator API key belongs in the client or repository. Forks must use their own project instead of consuming this demo's quota.

Create one storage bucket, then configure and save each section separately:

- **File level security: enabled.** Reload the console and verify it persisted.
- Bucket permissions: authenticated users may **CREATE** only. No bucket-wide READ, UPDATE or DELETE permission; no guest/anyone permission.
- Every client-created file explicitly grants READ, UPDATE and DELETE only to `user:<the authenticated user ID>`.
- Allowed file extensions: `json`. Maximum file size: **20 MB**. Provider at-rest encryption enabled; client encryption remains mandatory.

Verify the bucket settings again after editing other sections: in this setup, a later form save initially reverted file security. Do not resolve private-file errors by granting everyone bucket-wide read access. The official permission model grants access at bucket OR file level when file security is enabled: [Appwrite storage permissions](https://appwrite.io/docs/products/storage/permissions).

The browser checks verified email before vault creation. Bucket CREATE currently applies to all authenticated accounts; a malicious modified client can bypass the browser's verification check and consume quota with uploads. Provider abuse controls, usage monitoring and stronger server-enforced verified-user upload quotas are needed before accepting untrusted traffic at scale. There is no paid upgrade configured by this application.

## Email and recovery

Appwrite's built-in generic mail service is used, with no Gmail SMTP password or domain required for this setup. Custom sender/templates may require a different plan: [message templates](https://appwrite.io/docs/products/auth/message-templates), [pricing](https://appwrite.io/pricing). Free limits and delivery conditions can change. The client uses `createEmailVerificationOTP` / `updateEmailVerificationOTP` and `createRecoveryOTP` / `updateRecoveryOTP`, with a 60-second client resend cooldown plus provider limits. Recovery does not decrypt a forgotten vault password.

## Validation

A real signup and email-code confirmation were completed by the project owner, who also created the vault password directly in the app. Automated tests cover key derivation, wrong passwords, ciphertext tampering, context binding, isolated encrypted storage, interrupted account switches, owner-only upload permissions, portable backup restore and conflict handling. End-to-end checks and their exact status are recorded in RELEASE-CHECKS-0.10.md. Do not treat mocks as proof of cross-account provider enforcement.

## Build and run

`npm start` serves the committed application and SDK bundle without dependency installation. For development, run `npm ci`, `npm run check`, `npm test`, `npm run build`. Build regenerates the bundled SDK and third-party notices. The static deployment does not contain `.env`, backend data or dependency directories.
