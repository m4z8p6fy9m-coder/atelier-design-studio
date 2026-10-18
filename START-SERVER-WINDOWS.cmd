@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Bitte Node.js 20.12 oder neuer installieren.
  pause
  exit /b 1
)
if not exist "node_modules\nodemailer\package.json" (
  echo Mailbibliothek wird installiert. Eine Internetverbindung ist erforderlich.
  call npm ci --ignore-scripts --no-fund
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Atelier mit Konten und gemeinsamen Projekten startet.
echo E-Mail und Google zuerst in .env einrichten. Anleitung: docs/ACCOUNTS.md
echo Lokale Konfiguration pruefen: npm run auth:check
echo Danach http://127.0.0.1:4174/ im Browser oeffnen.
echo Serverdaten werden im Ordner data gespeichert. Nicht auf GitHub hochladen.
node scripts/cloud.mjs
pause
