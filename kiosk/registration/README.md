# TadeoT Anmeldung (Kiosk)

Anmelde-App für die Tablets am Eingang beim Tag der offenen Tür. Schüler:innen sprechen mit den
ankommenden Besucher:innen und tragen die Angaben am Tablet ein; der Bildschirm spricht die
Besucher:innen an (du-Form), die Statusleiste oben die Schüler:innen.

Ersetzt die alte Angular-14-App (`tadeot-frontend/registration` im Repository `htl-leo-tadeot`).
Das **alte Backend bleibt unverändert** und wird weiter verwendet; diese App ruft nicht die API
dieses Repositorys auf.

## Ablauf

Start → fünf Schritte → Übersicht („Alles richtig?“) → Anmelden → fertig.

1. **Wohnort:** Postleitzahl über das eingebaute Ziffernfeld (auch über eine Tastatur), danach
   den Ort antippen; danach geht es von selbst weiter. Gibt es zur Postleitzahl nur einen Ort, ist er
   schon gewählt (dann „Weiter“ oder den Ort antippen). Die Liste kennt
   nur österreichische Postleitzahlen.
2. **Über dich:** Geschlecht, Begleitpersonen (0–4), Schulstufe (7–13), Schultyp.
3. **Erfahren:** wie die Person von der Schule erfahren hat; ein Tippen geht weiter, außer bei
   „Anderes“ (dann ein freiwilliges Textfeld).
4. **Interessen:** Zweige, Mehrfachauswahl, freiwillig.
5. **Foto:** für den Roboterführerschein, freiwillig. Die Kamera startet mit der zuletzt auf
   diesem Gerät gewählten Kamera, sonst mit der Rückkamera (das Tablet hält die Schülerin oder
   der Schüler). Kameras, die nur Schwarz liefern (Infrarot-Sensoren für Windows Hello,
   virtuelle Kameras ohne Quelle), werden dabei automatisch übersprungen. „Kamera wechseln“
   geht der Reihe nach durch alle Kameras außer Infrarot; die gewählte merkt sich das Gerät,
   ihr Name steht unter dem Bild. Gespeichert
   wird ein Hochformat-Ausschnitt (480 × 640, PNG).

- In der Übersicht öffnet ein Tippen auf eine Angabe den passenden Schritt; „Zur Übersicht“ führt
  zurück.
- **Mit Foto** zeigt der letzte Bildschirm die **Nummer für den Roboterführerschein** (die Id des
  Besuchers, das Foto liegt am Server als `Visitor_<Id>.png`). Er bleibt stehen, bis jemand
  „Nächste Anmeldung“ tippt. **Ohne Foto** geht die App nach 5 Sekunden (oder Antippen) zurück
  zum Start.
- „Abbrechen“ verwirft alle Angaben (mit Rückfrage). Nach 75 s ohne Eingabe fragt das Tablet
  „Noch da?“ und verwirft die Anmeldung samt Foto nach weiteren 15 s.
- Die Statusleiste zeigt die Zahl der Anmeldungen (alle 30 s aktualisiert) und „Keine Verbindung
  zum Server“, sobald das Backend nicht erreichbar ist.

## Ohne Verbindung

- Orte, Besuchsgründe und Schultypen werden in `localStorage` zwischengespeichert; eine Anmeldung
  kann also auch ohne Verbindung begonnen werden. Ohne Zwischenspeicher versucht das Tablet alle
  30 s selbst, die Listen zu laden.
- **Anmelden braucht eine Verbindung.** Schlägt das Speichern fehl, bleiben alle Angaben und das
  Foto erhalten, und „Erneut versuchen“ sendet noch einmal. Auf dem Tablet wird nichts
  gespeichert.
- PWA mit Service Worker: auf dem Tablet über „Zum Startbildschirm hinzufügen“ installieren. Die
  App startet im Vollbild und hält den Bildschirm wach. Eine neue Version wird erst auf dem
  Startbildschirm geladen.
- Die Kamera funktioniert nur über HTTPS (oder `localhost`).

## Entwicklung

```bash
npm i
npx ng serve            # standalone, Backend-URL aus src/environments/environment.development.ts
npm run build
npm run lint
npm run format
```

**Achtung:** `environment.development.ts` zeigt auf das **echte** alte Backend. Lesen ist harmlos,
aber jedes „Anmelden“ legt dort einen echten Besucher an (die Daten werden vor dem Tag der offenen
Tür im alten Admin gelöscht). Zum Testen lieber ein Mock-Backend verwenden.

Unter Aspire (`backend/AppHost`) startet die App mit `npm start`; `update_base_url.js` schreibt
dabei `REGISTRATION_API_URL` in `environment.development.ts` (nicht committen).

Verwendete Endpunkte des alten Backends (alle ohne Login): `GET /api/Cities`,
`GET /api/ReasonsForVisit`, `GET /api/SchoolTypes`, `GET /api/Visitors/count`,
`POST /api/Visitors` (Antwort: die neue Id; das Foto als PNG-Data-URL in `photoFileName`).

## Docker

`BACKEND_URL` ist die URL des alten Backends **ohne** `/api`
(z. B. `https://tadeot.htl-leonding.ac.at/tadeot-api`) und wird beim Containerstart in `env.js`
geschrieben. Die `base href` ist relativ (`./`), daher läuft dasselbe Image unter `/` und hinter
einem Pfad-Präfix (Präfix im Reverse Proxy entfernen). Der Aufruf muss mit `/` enden
(`…/registration/`), sonst lädt der Browser `main.js` und `env.js` vom Root. Mit Traefik:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tadeot-registration.rule=Host(`${DOMAIN}`) && (Path(`/registration`) || PathPrefix(`/registration/`))"
  - "traefik.http.routers.tadeot-registration.entrypoints=websecure"
  - "traefik.http.routers.tadeot-registration.tls=true"
  - "traefik.http.services.tadeot-registration.loadbalancer.server.port=80"
  # …/registration -> …/registration/ ($$ ist in Compose-Dateien ein einzelnes $)
  - "traefik.http.middlewares.tadeot-registration-slash.redirectregex.regex=^(https?://[^/]+/registration)$$"
  - "traefik.http.middlewares.tadeot-registration-slash.redirectregex.replacement=$${1}/"
  - "traefik.http.middlewares.tadeot-registration-stripprefix.stripprefix.prefixes=/registration"
  - "traefik.http.routers.tadeot-registration.middlewares=tadeot-registration-slash,tadeot-registration-stripprefix"
```

Auf demselben Host darf nur **eine** App unter `/registration` laufen: die alte oder diese.

```bash
docker build -t tadeot-registration .
docker run -p 8080:80 -e BACKEND_URL=https://tadeot.htl-leonding.ac.at/tadeot-api tadeot-registration
```
