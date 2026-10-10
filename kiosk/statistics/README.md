# TadeoT Statistik (Kiosk)

Diashow mit der Besucherstatistik für den Tag der offenen Tür. Sie läuft im Browser eines PCs, der
an einem Beamer in der Halle hängt, stundenlang und ohne Bedienung. Wer vorbeigeht, sieht für ein
paar Sekunden, wie viele sich schon angemeldet haben, wann sie gekommen sind und was sie
interessiert.

Ersetzt die alte Angular-14-App (`tadeot-frontend/statistics` im Repository `htl-leo-tadeot`). Das
**alte Backend bleibt unverändert** und wird weiter verwendet; diese App ruft nicht die API dieses
Repositorys auf und **liest nur** (keine POST-Anfragen).

## Folien

Immer in dieser Reihenfolge; eine Folie ohne Daten wird übersprungen.

1. **Angemeldet:** Zahl der Anmeldungen und „mit Begleitung“ (Anmeldungen + Begleitpersonen), wie
   in der Statusleiste der Anmelde-Tablets.
2. **Anmeldungen pro Stunde:** eine Zeile pro Tag mit gemeinsamer Stundenachse und gemeinsamem
   Maßstab, das Datum am Zeilenanfang („Fr., 21. Nov.“). Gezeigt werden der letzte Tag in den Daten
   und die Tage mit Anmeldungen in der Woche davor (z. B. Freitag und Samstag), höchstens 3;
   ältere Tage (voriges Jahr) bleiben weg. Die Stunde mit den meisten Anmeldungen ist je Tag dunkler.
   Testanmeldungen in der Woche vor dem Tag der offenen Tür erscheinen als eigene Zeile, daher vorher
   die Besucher im alten Admin löschen.
3. **Das interessiert unsere Gäste:** Interesse an den Abteilungen (Mehrfachnennungen), die vier
   Abteilungen in ihren Farben (aus `DESIGN.md`, in `src/app/shared/constants.ts`).
4. **So haben unsere Gäste von uns erfahren**
5. **Aus diesen Schulen kommen unsere Gäste** (mit Prozent)
6. **Aus diesen Bezirken kommen unsere Gäste:** Achtung, `districtcount` im alten Backend zählt die
   **Gemeinden** je Bezirk, aus denen sich jemand angemeldet hat (die 10 häufigsten Bezirke), nicht
   die Besucher. Die Folie sagt das so („17 Gemeinden“).
7. **Angemeldet nach Geschlecht**

Mehr als 12 Kategorien werden zu „n weitere“ zusammengefasst. Kategorien mit 0 werden nicht gezeigt.
Ohne Anmeldungen zeigt die App nur „Tag der offenen Tür – Hier erscheinen gleich die ersten
Anmeldungen.“

## Aufruf

- `…/statistics/` – 10 Sekunden pro Folie.
- `…/statistics/?delay=15` – Sekunden pro Folie (3 bis 120).
- `…/statistics/?days=all` – „Anmeldungen pro Stunde“ zeigt alle Tage in den Daten (auch frühere
  Jahre, höchstens die letzten 3), z. B. zum Ausprobieren der Tageszeilen mit alten Daten. Lässt sich
  mit `delay` kombinieren (`?delay=5&days=all`).
- Alte Lesezeichen `…/statistics/slideshow/15` (auch mit `/` am Ende) leitet der nginx im Image auf
  `…/statistics/?delay=15` um; `…/statistics/slideshow/` auf `…/statistics/`.
- Am Beamer-PC den Browser im Vollbild öffnen (F11 oder `chrome --kiosk <URL>`); der Mauszeiger ist
  über der App ausgeblendet. Die App hält den Bildschirm wach (Wake Lock), soweit der Browser das
  erlaubt; Energiesparen des PCs trotzdem ausschalten.

## Ohne Verbindung

- Alle Zahlen werden **jede Minute** neu geladen und in `localStorage` zwischengespeichert. Eine
  Folie behält die Zahlen, mit denen sie begonnen hat; neue Zahlen kommen mit der nächsten Folie.
- Fällt der Server oder das WLAN aus, läuft die Diashow mit den zuletzt geladenen Zahlen weiter.
  Fehler werden **nie** angezeigt; nur die Uhrzeit bei „Stand“ (oben, klein) bleibt stehen. Das ist
  der Hinweis für die Betreuung, dass keine neuen Daten mehr kommen.
- Beim ersten Start ohne Daten zeigt die App das Logo und „Tag der offenen Tür“ und versucht es alle
  15 Sekunden erneut.
- PWA mit Service Worker: die App selbst startet auch offline aus dem Cache. Eine neue Version wird
  erst zwischen zwei Folien geladen.

## Entwicklung

```bash
npm i
npx ng serve            # standalone, Backend-URL aus src/environments/environment.development.ts
npm run build
npm run lint
npm run format
```

**Achtung:** `environment.development.ts` zeigt auf das **echte** alte Backend mit echten
Anmeldedaten. Die App liest nur, aber die Zahlen sind personenbezogene Auswertungen: Screenshots
davon nicht weitergeben. Zum Testen ein Mock-Backend mit Testdaten verwenden.

Unter Aspire (`backend/AppHost`) startet die App mit `npm start`; `update_base_url.js` schreibt
dabei `STATISTICS_API_URL` in `environment.development.ts` (nicht committen).

Verwendete Endpunkte des alten Backends (alle `GET`, ohne Login): `/api/Visitors/count`,
`/api/Visitors/bytime`, `/departmentcount`, `/reasoncount`, `/schooltypecount`, `/districtcount`,
`/gendercount` (jeweils `[{ category, count }]`).

Das alte Backend verschiebt die Stunde in `bytime` um +1 (Winterzeit). Am Tag der offenen Tür
(November bis Jänner) stimmt die Uhrzeit; Testanmeldungen im Sommer erscheinen eine Stunde zu spät.

## Docker

`BACKEND_URL` ist die URL des alten Backends **ohne** `/api`
(z. B. `https://tadeot.htl-leonding.ac.at/tadeot-api`) und wird beim Containerstart in `env.js`
geschrieben. Die `base href` ist relativ (`./`), daher läuft dasselbe Image unter `/` und hinter
einem Pfad-Präfix (Präfix im Reverse Proxy entfernen). Der Aufruf muss mit `/` enden
(`…/statistics/`), sonst lädt der Browser `main.js` und `env.js` vom Root. Mit Traefik, unter dem
bisherigen Pfad `/statistics`:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tadeot-statistics.rule=Host(`${DOMAIN}`) && (Path(`/statistics`) || PathPrefix(`/statistics/`))"
  - "traefik.http.routers.tadeot-statistics.entrypoints=websecure"
  - "traefik.http.routers.tadeot-statistics.tls=true"
  - "traefik.http.services.tadeot-statistics.loadbalancer.server.port=80"
  # …/statistics -> …/statistics/ ($$ ist in Compose-Dateien ein einzelnes $)
  - "traefik.http.middlewares.tadeot-statistics-slash.redirectregex.regex=^(https?://[^/]+/statistics)$$"
  - "traefik.http.middlewares.tadeot-statistics-slash.redirectregex.replacement=$${1}/"
  - "traefik.http.middlewares.tadeot-statistics-stripprefix.stripprefix.prefixes=/statistics"
  - "traefik.http.routers.tadeot-statistics.middlewares=tadeot-statistics-slash,tadeot-statistics-stripprefix"
```

Die Umleitungen der alten `/slideshow/<n>`-Adressen sind relativ (`absolute_redirect off` in
`nginx.conf`) und brauchen daher keine eigene Traefik-Regel. Auf demselben Host darf nur **eine**
App unter `/statistics` laufen: die alte oder diese.

```bash
docker build -t tadeot-statistics .
docker run -p 8080:80 -e BACKEND_URL=https://tadeot.htl-leonding.ac.at/tadeot-api tadeot-statistics
```
