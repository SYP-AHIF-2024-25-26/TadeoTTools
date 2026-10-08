# TadeoT Feedback (Kiosk)

Feedback-App für Tablets am Ausgang beim Tag der offenen Tür. Schüler:innen sprechen mit den
Besucher:innen und tragen deren Feedback am Tablet ein. Die Fragen sind dieselben wie in der
GuideApp und werden im Dashboard unter „Feedback“ konfiguriert.

## Ablauf

Start → eine Frage pro Bildschirm → Übersicht (Antwort antippen zum Ändern) → Absenden →
Danke-Bildschirm, nach 5 Sekunden (oder Antippen) wieder Start.

- Einfachauswahl und Bewertung springen nach dem Antippen automatisch weiter.
- Optionale Fragen können übersprungen werden, Pflichtfragen (`*`) nicht.
- „Abbrechen“ verwirft die laufenden Antworten (mit Rückfrage).

## Offline-Betrieb

- PWA mit Service Worker: auf dem Tablet über „Zum Startbildschirm hinzufügen“ installieren.
  Die App startet im Vollbild und hält den Bildschirm wach (Screen Wake Lock).
- Die Fragen werden in `localStorage` zwischengespeichert. Ohne WLAN zeigt der Startbildschirm
  „Offline: Fragen aus dem Zwischenspeicher“.
- Abgeschickte Feedbacks landen zuerst in einer Warteschlange in `localStorage` und werden
  gesendet, sobald das Backend erreichbar ist (alle 30 s und beim `online`-Event). Der
  Startbildschirm zeigt „N noch nicht übertragen“, solange etwas offen ist. **Tablet-Browserdaten
  nicht löschen, solange diese Anzeige sichtbar ist.**
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

Verwendete Endpunkte: `GET /v1/feedback-questions`, `POST /v1/add-feedbacks` (beide ohne Login).

## Docker

`BACKEND_URL` (ohne `/v1`) wird beim Containerstart in `env.js` geschrieben. Die `base href` ist
relativ (`./`), daher läuft dasselbe Image unter `/` und hinter einem Pfad-Präfix (z. B.
`/feedback/`, Präfix im Reverse Proxy entfernen). Der Aufruf muss dann mit `/` enden
(`…/feedback/`, nicht `…/feedback`).

```bash
docker build -t tadeot-feedback .
docker run -p 8080:80 -e BACKEND_URL=https://tadeot.htl-leonding.ac.at/tadeot-backend-201126 tadeot-feedback
```
