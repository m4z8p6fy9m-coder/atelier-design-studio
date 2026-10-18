# Atelier 0.9 — More ways to create. A studio you can keep.

## New in this release

- **20 original editable templates:** twelve new layouts for creator posts, events, business introductions and study notes.
- **Installable web app:** application manifest, desktop/mobile icons, installation guidance and an offline-ready indicator.
- **Offline application shell:** a strict cache of public program files; account and API responses are excluded.
- **Explicit updates:** a new version activates after choosing Update laden, with a save attempt before reloading.
- The three four-page starter kits from 0.8 remain available.

## Download

Download **Atelier-v0.9.0.zip** and extract it. The archive is a source package, not a native installer. Install **Node.js 20.12+**, then double-click **START-WINDOWS.cmd** on Windows or run **npm start** on macOS/Linux. Open http://127.0.0.1:4173.

An installed web version does not need Node.js on the device. Installation is available only after opening a compatible hosted version or starting the local server, and depends on browser support. See **docs/OFFLINE.md**.

## Validation and limits

100 Node tests, JavaScript checks and static build pass. The included tests cover twenty templates, offline shell behavior under a repository subpath, exclusion of private resources and cache update behavior. Registration, readiness and installation guidance were checked in the embedded preview; full offline restart and native installation were not confirmed there.

The interface is German and desktop-focused. This is an early-stage editor, not full Canva feature parity. Cloud accounts and synchronization need a separately configured server and network connection. Keep backups of your projects before deleting browser storage.

The public live demo is a separate deployment step. A release alone does not publish a website or change repository visibility.
