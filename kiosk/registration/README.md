# TadeoT Anmeldung (Kiosk)

Anmelde-App für die Tablets am Eingang beim Tag der offenen Tür. Schüler:innen sprechen mit den
ankommenden Besucher:innen und tragen die Angaben am Tablet ein; der Bildschirm spricht die
Besucher:innen an (du-Form), die Statusleiste oben die Schüler:innen.

Ersetzt die alte Angular-14-App (`tadeot-frontend/registration` im Repository `htl-leo-tadeot`).
Sie speichert über die API dieses Repositorys (`backend/`, mit Schul-Login, siehe „Login“). Orte, Gründe und Schultypen
pflegen Admins im Dashboard (Seite „Registration“). Bis 20.11.2026 bleibt das alte Backend die
Rückfallebene: dafür das alte Image dieser App pinnen; die Orts-IDs sind in beiden Systemen gleich.

## Login

Vor der ersten Anmeldung loggt man sich mit dem Schulkonto ein (Keycloak `auth.htl-leonding.ac.at`,
Realm `htlleonding`, Client `htlleonding-service`, wie Dashboard und Kassa). Die App wählt dafür die
Wörter **einloggen/ausloggen**, weil „Anmelden“ hier das Speichern einer Besucherin oder eines
Besuchers ist. Erst „Einloggen“ leitet zur Keycloak-Anmeldung weiter; ist das Tablet noch
eingeloggt (z. B. nach einem Neuladen), geht es ohne Knopfdruck weiter (`check-sso`). Danach fragt
die App `GET /v1/users/is-registrar`. Besucher:innen anmelden dürfen:

- alle **Lehrer:innen** (laut LDAP-Eintrag im Token),
- **Admins** des Dashboards,
- **Schüler:innen**, deren Zuteilung zur Station mit dem Namen **„Empfang“** bestätigt ist
  (Groß-/Kleinschreibung egal; offene oder abgelehnte Anfragen zählen nicht).

Alle anderen sehen „Kein Zugang zur Anmeldung“ und kommen über „Ausloggen“ zurück. Die Statusleiste
zeigt, wer eingeloggt ist; „Ausloggen“ (nur auf dem Startbildschirm, mit Rückfrage) beendet den
Login, z. B. beim Schichtwechsel. Jede Anmeldung speichert den Benutzernamen (`RegisteredBy`, im
CSV-Export „Angemeldet von“).

- **Kein Datenverlust durch ablaufenden Login:** Das Einloggen lädt die Seite neu und würde
  eingegebene Angaben samt Foto verwerfen. Deshalb erneuert „Anmeldung starten“ zuerst das Token
  und prüft am Refresh-Token, wie lange die Keycloak-Sitzung noch gilt. Sind es weniger als
  10 Minuten (`MIN_SESSION_FOR_REGISTRATION_MS`), heißt es „Der Login läuft bald ab“ und man loggt
  sich neu ein, bevor etwas eingegeben ist. Eine Anmeldung dauert nie so lange: „Noch da?“
  verwirft sie nach 90 s ohne Eingabe.
- Antwortet Keycloak bei dieser Prüfung nicht (kein WLAN, 5 s), startet die Anmeldung trotzdem;
  das Speichern braucht ohnehin eine Verbindung und bietet „Erneut versuchen“.
- Lehnt das Backend das Speichern trotzdem mit 401 (Sitzung serverseitig beendet) oder 403
  (Zugang entzogen) ab, bleibt die Übersicht stehen; erst nach Rückfrage werden die Angaben
  verworfen und es geht zum Login bzw. zu „Kein Zugang“.
- Orte, Auswahllisten und Zähler laden ohne Login; nur `POST /v1/visitors` verlangt ihn.
- Keycloak: Der Client `htlleonding-service` akzeptiert jede Redirect-URI und erlaubt CORS für jede
  Herkunft (geprüft am 30.10.2026 für vm45, Produktion und `localhost`); es ist nichts einzutragen.
  Wird der Client eingeschränkt, muss die URL der App (`…/registration/*`) dort stehen.

## Ablauf

Start → fünf Schritte → Übersicht („Alles richtig?“) → Anmelden → fertig.

1. **Wohnort:** Postleitzahl über das eingebaute Ziffernfeld (auch über eine Tastatur), danach
   den Ort antippen; danach geht es von selbst weiter. Gibt es zur Postleitzahl nur einen Ort, ist er
   schon gewählt (dann „Weiter“ oder den Ort antippen). Die Liste kennt
   nur österreichische Postleitzahlen.
2. **Über dich:** Geschlecht (männlich, weiblich, keine Angabe), Begleitpersonen (0–4),
   Schulstufe (7–13), Schultyp.
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
- Die Listen werden beim Start der App, bei „Start“ (im Hintergrund, die Anmeldung beginnt sofort)
  und bei der Rückkehr zum Startbildschirm neu geladen. Eine Änderung im Dashboard gilt also ab der
  nächsten Anmeldung; misslingt das Laden, bleiben die zwischengespeicherten Listen.
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

Mit `npx ng serve` erwartet die App die API unter `http://localhost:5001`; lokal braucht das Backend
Orte und die beiden Auswahllisten (im Dashboard per CSV importieren). Unter Aspire
(`backend/AppHost`) startet die App mit `npm start`; `update_base_url.js` schreibt dabei die URL der
API in `environment.development.ts` (nicht committen).

Verwendete Endpunkte: ohne Login `GET /v1/cities`, `GET /v1/registration-options`,
`GET /v1/visitors/count`; mit Login `GET /v1/users/is-registrar` und `POST /v1/visitors` (Antwort: die neue Id; `gender` ist `Male`, `Female`
oder `NotStated`; das Foto als PNG-Data-URL in `photo`, sonst `null`). Das Backend speichert das
Foto als `Visitor_0001.png`; gelingt das nicht, wird auch die Anmeldung nicht gespeichert.

## Docker

`BACKEND_URL` ist die URL von `backend/` **ohne** `/v1`
(z. B. `https://tadeot.htl-leonding.ac.at/tadeot-backend-201126`) und wird beim Containerstart in `env.js`
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
docker run -p 8080:80 -e BACKEND_URL=https://tadeot.htl-leonding.ac.at/tadeot-backend-201126 tadeot-registration
```
