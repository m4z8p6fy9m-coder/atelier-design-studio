# CSP und Hosting-Header (0.10.2)

Stand: 18. Oktober 2026. Die statische App liefert im HTML direkt nach der Zeichencodierung eine Meta-CSP aus. Ausführbare Inline-Skripte waren im 0.10.1-App-Einstieg bereits nicht vorhanden; alle Produktionsskripte bleiben externe lokale ES-Module. Auch die Test-Einstiege verwenden externe Module. Die CSP lässt nur Skripte derselben Origin zu, kein `unsafe-inline`, `unsafe-eval`, `data:` oder `blob:` für Skripte. `object-src 'none'` und `base-uri 'none'` sind gesetzt.

`style-src 'self' 'unsafe-inline'` bleibt für bestehende dynamische Editor-/SVG-Stile erforderlich. Das ist eine bewusste verbleibende Ausnahme für CSS, nicht für Skripte. Bilder und eigene Schriften benötigen `data:`/`blob:`, Video-Exporte `blob:`. In der Gastmodus-Demo 0.10.4 sind Verbindungen auf dieselbe Origin beschränkt; Appwrite ist nicht freigegeben. Nur beim Selbsthosting privater Tresore wird der eigene Appwrite-Endpunkt ausdrücklich ergänzt. Der optionale Legacy-Server verwendet weiterhin dieselbe Origin. Bei einem eigenen Appwrite-Endpunkt muss die explizite `connect-src`-Liste sowohl im Meta-Tag als auch in den Hosting-Headern angepasst werden. Es wurden keine CDN-Skripte zugelassen.

Eine Meta-CSP gilt erst ab ihrer Position im Dokument. Sie ist kein Schutz gegen einen Host, der HTML, eigene Skripte oder den Service Worker verändert. `script-src 'self'` erlaubt jedes Skript der eigenen Origin; deshalb dort keine unkontrollierten Uploads als ausführbare Ressourcen ausliefern. CSP ersetzt weder korrektes Escaping noch einen unabhängigen XSS-Test.

## Was echte HTTP-Header braucht

- `frame-ancestors 'none'` funktioniert nicht als Meta-CSP; erst als Antwort-Header schränkt es das Einbetten fremder Seiten ein. `X-Frame-Options` ist ebenfalls ein echter Antwort-Header.
- CSP Report-Only sowie `report-uri`/`sandbox` werden nicht auf diesem Weg per Meta eingerichtet. Ein eingerichteter Reporting-Endpunkt und Datenschutzentscheidung wären separat erforderlich; hier wird nichts an einen Reporting-Dienst gesendet.
- HSTS (`Strict-Transport-Security`), MIME-Sniffing-Schutz (`X-Content-Type-Options`), Referrer-/Permissions-Policy und COOP/COEP sind keine Ersatz-Meta-CSP-Direktiven. Die Beispiele enthalten HSTS, nosniff und Referrer-Policy; COOP/COEP werden wegen möglicher Export-/Anmelde-Kompatibilität nicht pauschal gesetzt.
- Eine CSP für Service-Worker-Antworten benötigt passende HTTP-Header. Die Meta-CSP wird durch den bestehenden Offline-Shell-Cache mit dem HTML gespeichert; sie konfiguriert den Worker selbst nicht.

## Cloudflare Pages und Netlify

Beispiele liegen in `examples/cloudflare-pages/_headers` und `examples/netlify/_headers`. Nach `npm run build` die passende Datei als `dist/_headers` kopieren und `dist` als Veröffentlichungsverzeichnis wählen. Der Build kopiert sie absichtlich nicht automatisch auf GitHub Pages oder andere Hosts. Das Muster `/*` gilt für alle statischen Pfade einschließlich einer Unterpfadinstallation. Beispiele stimmen mit der Meta-CSP überein und ergänzen `frame-ancestors 'none'`. Zwei CSPs wirken gleichzeitig: ein weniger restriktiver Header hebt die Meta-CSP nicht auf.

PowerShell (Cloudflare; für Netlify den Ordnernamen ersetzen):

```powershell
npm run build
Copy-Item -LiteralPath examples/cloudflare-pages/_headers -Destination dist/_headers
```

Nur HTTPS-Domains mit dauerhaft vorgesehenem HTTPS-Betrieb mit dem HSTS-Beispiel ausliefern. Es setzt weder `includeSubDomains` noch Preload. `_headers` steuert statische Antworten; Functions/Proxy-Antworten brauchen eigene Header. GitHub Pages wertet diese Datei nicht aus. Nach einem echten Deployment die empfangenen Header prüfen, beispielsweise `curl.exe -I https://DEINE-DOMAIN/`. In dieser Änderung wurde kein Cloudflare-/Netlify-Deployment ausgeführt. Der lokale `npm start`-Server und der Legacy-Server wurden nicht um Header-Konfiguration erweitert.

Referenzen: [MDN frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors), [CSP-Spezifikation – Meta-Einschränkungen](https://www.w3.org/TR/CSP3/#meta-element), [Cloudflare Pages Header](https://developers.cloudflare.com/pages/configuration/headers/), [Netlify Header](https://docs.netlify.com/manage/routing/headers/).
