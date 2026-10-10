# TadeoT Feedback (Kiosk)

Feedback-App für Tablets am Ausgang beim Tag der offenen Tür. Schüler:innen sprechen mit den
Besucher:innen und tragen deren Feedback am Tablet ein. Die Fragen sind dieselben wie in der
GuideApp und werden im Dashboard unter „Feedback“ konfiguriert.

## Ablauf

Start → eine Frage pro Bildschirm → Übersicht (Antwort antippen zum Ändern) → Absenden →
Danke-Bildschirm, nach 5 Sekunden (oder Antippen) wieder Start.

- Einfachauswahl und Bewertung springen nach dem Antippen automatisch weiter.
- Optionale Fragen können übersprungen werden, Pflichtfragen (`*`) nicht: „Weiter“ zeigt dann
  „Pflichtfrage – bitte eine Antwort wählen“.
- Nach dem Ändern einer Antwort in der Übersicht führt „Zur Übersicht“ direkt zurück. Nur wenn
  die Änderung eine neue Frage einblendet, kommt zuerst diese.
- „Abbrechen“ verwirft die laufenden Antworten (mit Rückfrage).
- Nach 75 s ohne Eingabe fragt das Tablet „Noch da?“ und verwirft das Feedback nach weiteren
  15 s, damit die nächste Person nicht die Antworten der vorigen sieht.

## Offline-Betrieb

- PWA mit Service Worker: auf dem Tablet über „Zum Startbildschirm hinzufügen“ installieren.
  Die App startet im Vollbild und hält den Bildschirm wach (Screen Wake Lock).
- Die Fragen werden in `localStorage` zwischengespeichert. Ist der Server nicht erreichbar, zeigt
  die Statusleiste oben „Offline – zuletzt geladene Fragen“. Hat das Tablet noch gar keine
  Fragen, versucht es alle 30 s selbst, sie zu laden.
- Abgeschickte Feedbacks landen zuerst in einer Warteschlange in `localStorage` und werden
  gesendet, sobald das Backend erreichbar ist (alle 30 s und beim `online`-Event). Solange etwas
  offen ist, zeigt die Statusleiste auf jedem Bildschirm „N Feedbacks warten auf die
  Übertragung“ mit „Jetzt senden“. **Tablet-Browserdaten nicht löschen, solange diese Anzeige
  sichtbar ist.**
- Der Zeitstempel eines Feedbacks ist der Zeitpunkt, zu dem es beim Backend ankommt.
- Eine neue App-Version wird erst auf dem Startbildschirm geladen, nie mitten im Ausfüllen.

## Entwicklung

```bash
npm i
npx ng serve            # standalone, Backend-URL aus src/environments/environment.development.ts
npm run build
npm run lint
npm run format
```

Unter Aspire (`backend/AppHost`) startet die App mit `npm start`; wie bei den anderen Apps
überschreibt `update_base_url.js` dabei `environment.development.ts` (nicht committen).

Verwendete Endpunkte: `GET /v1/feedback-questions`, `GET /v1/divisions` (Farben der Abteilungen), `POST /v1/add-feedbacks` (alle ohne Login).

## Docker

`BACKEND_URL` (ohne `/v1`) wird beim Containerstart in `env.js` geschrieben. Die `base href` ist
relativ (`./`), daher läuft dasselbe Image unter `/` und hinter einem Pfad-Präfix (Präfix im
Reverse Proxy entfernen). Auf den VMs ist das `/feedback-kiosk/`; nicht `/feedback`, denn das ist
die Feedback-Seite der GuideApp. Der Aufruf muss mit `/` enden (`…/feedback-kiosk/`, nicht
`…/feedback-kiosk`), sonst lädt der Browser `main.js` und `env.js` vom Root. Mit Traefik:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tadeot-feedback-201126.rule=Host(`${DOMAIN}`) && (Path(`/feedback-kiosk`) || PathPrefix(`/feedback-kiosk/`))"
  - "traefik.http.routers.tadeot-feedback-201126.entrypoints=websecure"
  - "traefik.http.routers.tadeot-feedback-201126.tls=true"
  - "traefik.http.routers.tadeot-feedback-201126.tls.certresolver=tadeotresolver"
  - "traefik.http.services.tadeot-feedback-201126.loadbalancer.server.port=80"
  # …/feedback-kiosk -> …/feedback-kiosk/ ($$ ist in Compose-Dateien ein einzelnes $)
  - "traefik.http.middlewares.tadeot-feedback-201126-slash.redirectregex.regex=^(https?://[^/]+/feedback-kiosk)$$"
  - "traefik.http.middlewares.tadeot-feedback-201126-slash.redirectregex.replacement=$${1}/"
  - "traefik.http.middlewares.tadeot-feedback-201126-stripprefix.stripprefix.prefixes=/feedback-kiosk"
  - "traefik.http.routers.tadeot-feedback-201126.middlewares=tadeot-feedback-201126-slash,tadeot-feedback-201126-stripprefix"
```

Wer die GuideApp im selben Browser schon geöffnet hat, bekommt beim ersten Aufruf evtl. deren
Service Worker zu sehen; zum Testen ein privates Fenster verwenden.

```bash
docker build -t tadeot-feedback .
docker run -p 8080:80 -e BACKEND_URL=https://tadeot.htl-leonding.ac.at/tadeot-backend-201126 tadeot-feedback
```
