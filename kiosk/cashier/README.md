# TadeoT Kassa (Kiosk)

Kassa-App für das Buffet beim Tag der offenen Tür. Eine Schülerin oder ein Schüler steht hinter dem
Buffet, tippt die gewünschten Produkte an, kassiert und gibt Rückgeld. Der Bildschirm spricht die
Person an der Kassa an, nicht die Besucher:innen.

Ersetzt die alte Angular-14-App (`tadeot-frontend/kassa` im Repository `htl-leo-tadeot`). Produkte,
Buffets und Verkäufe liegen im Backend dieses Repositorys (`backend/`) und werden im Dashboard auf
der Seite **Buffet** verwaltet. Das alte Backend bleibt unverändert und ist bis nach dem TdoT
(20.11.2026) der Rückfall: Wird das Image auf den alten Digest zurückgesetzt, verkauft die Kassa
wieder dort (die Import-Funktion übernimmt die alten IDs, wartende Verkäufe bleiben gültig).

## Anmeldung

Vor der Kassa meldet man sich mit dem Schulkonto an (Keycloak `auth.htl-leonding.ac.at`, Realm
`htlleonding`, Client `htlleonding-service`, wie das Dashboard). Die App startet mit einer eigenen
Startseite; erst „Anmelden“ leitet zur Keycloak-Anmeldung weiter. Ist das Tablet noch angemeldet
(z. B. nach einem Neuladen), geht es ohne Knopfdruck direkt zur Kassa weiter (`check-sso`, kurze
Weiterleitung ohne Formular). Danach fragt die App
`GET /v1/users/is-cashier`. Kassieren dürfen:

- alle **Lehrer:innen** (laut LDAP-Eintrag im Token),
- **Admins** des Dashboards,
- **Schüler:innen**, deren Zuteilung zur Station mit dem Namen **„Buffet“** bestätigt ist
  (Status „Accepted“; offene oder abgelehnte Anfragen zählen nicht).

Die Station muss im Dashboard genau „Buffet“ heißen (Groß-/Kleinschreibung egal). Alle anderen sehen
„Kein Zugang zur Kassa“ und kommen über „Abmelden“ zurück zur Startseite. „Abmelden“ in der
Statusleiste (nur zwischen zwei Verkäufen, mit Rückfrage) beendet die Anmeldung, z. B. beim Schichtwechsel, und
führt ebenfalls zur Startseite; wartende Verkäufe bleiben auf dem Tablet und werden weiter gesendet.

- Die Anmeldung braucht eine Verbindung. Ohne WLAN beim Start zeigt die App „Keine Verbindung“ statt
  der Kassa; das Kassieren selbst geht danach auch offline weiter.
- Jede Anfrage an das Backend trägt das Token der Anmeldung (`authInterceptor`, vorher bei Bedarf
  erneuert); `GET /v1/buffets` und `POST /v1/orders` verlangen dieselbe Berechtigung wie
  `is-cashier`. Ohne gültige Anmeldung werden Produkte nur aus dem Zwischenspeicher gezeigt und
  Verkäufe nicht gesendet.
- Läuft die Anmeldung ab (401), kehrt die App zur Startseite zurück; wird die Berechtigung entzogen
  (403), prüft sie den Zugang neu und zeigt „Kein Zugang zur Kassa“. In beiden Fällen bleiben
  wartende Verkäufe auf dem Tablet und werden nach der nächsten Anmeldung gesendet.

## Ablauf

Produkte antippen → „Kassieren“ → (optional) Betrag, der gegeben wurde → „Verkauf abschließen“.

- **Produkte:** ein Tippen auf die Kachel fügt eins hinzu; „−“ in der Einkaufsliste rechts nimmt eins
  weg (so kann ein Tippen auf eine Kachel nur hinzufügen). Die Kassa ist für ein Tablet im
  Querformat gedacht; im Hochformat steht „−“ in der Ecke der Kachel. Die Zahl
  im Kreis zeigt, wie viele im Einkauf sind (höchstens 99 pro Produkt). Reihenfolge, Namen und
  Preise kommen aus dem Dashboard (Seite „Buffet“).
- **Gutschein:** ein Produkt mit negativem Preis („Gutschein“, −2,00 €). Höchstens einer pro
  Einkauf (ein zweites Tippen nimmt ihn wieder heraus, ein anderer Gutschein ersetzt ihn), nur
  zusammen mit einem Einkauf, und die Summe darf nicht unter 0 fallen. Das Backend lehnt einen
  Verkauf mit mehr als einem Gutschein ab.
- **Kassieren:** „Passend“ oder ein Schein (5/10/20/50 €, nur die, die die Summe übersteigen), oder
  den Betrag über das Ziffernfeld eintippen (mit Komma). Das Rückgeld steht groß daneben. Der
  Betrag ist freiwillig; „Verkauf abschließen“ geht auch ohne.
- Danach zeigt die Kassa wieder leere Produkte; rechts steht groß das Rückgeld (oder „Passend
  bezahlt“) mit Summe, gegebenem Betrag und Verkaufsnummer, bis das nächste Produkt angetippt wird.
- „Leeren“ verwirft den Einkauf (bei mehr als einem Artikel mit Rückfrage). Einen abgeschlossenen
  Verkauf kann man nicht rückgängig machen.
- **Kassastand** (unter den Produkten): Summe und Zahl der Verkäufe auf diesem Tablet seit dem letzten
  Zurücksetzen, zum Zählen der Kassa bei Schichtende. „Auf 0 setzen“ betrifft nur diese Anzeige,
  nicht die Verkäufe am Server.
- Gibt es mehrere Buffets, fragt das Tablet beim ersten Start, für welches es kassiert, und merkt
  sich die Wahl („Wechseln“ in der Statusleiste). Bei nur einem Buffet wird es automatisch
  verwendet.

## Ohne Verbindung

- Buffets und Produkte werden in `localStorage` zwischengespeichert; die Kassa startet also auch
  ohne WLAN. Ohne Zwischenspeicher versucht das Tablet alle 30 s, sie zu laden. Danach werden sie
  alle 5 Minuten aktualisiert (Preisänderungen im Dashboard). Ein Buffet ohne Produkte auf der
  Karte schickt das Backend nicht mit; es verschwindet aus der Kassa.
- **Jeder Verkauf wird zuerst auf dem Tablet gespeichert** und dann gesendet, der Reihe nach. Ohne
  Verbindung bleibt er gespeichert und wird alle 30 s (und sobald das WLAN wieder da ist) erneut
  gesendet; die Statusleiste zeigt dann „N Verkäufe warten auf Übertragung – Browserdaten nicht
  löschen“. Verkaufen geht dabei ganz normal weiter.
- Lehnt der Server einen Verkauf ab (400/404, z. B. Buffet gelöscht oder Produkt nicht mehr auf der
  Karte), wird er **nicht verworfen**, sondern als „nicht übertragbar“ angezeigt. Unter „Ansehen“
  kann man ihn erneut senden oder bewusst entfernen. 401/403 zählen nicht als Ablehnung (siehe
  Anmeldung).
- `orderNumber` ist `<Tablet-Kennung>-<laufende Nummer>` (z. B. `K7Q2-0047`). Das Backend speichert
  jede Nummer nur einmal und beantwortet eine Wiederholung mit 200; geht die Antwort auf einen
  Verkauf verloren, wird er beim erneuten Senden also nicht doppelt gezählt.
- Jede Position wird mit dem Preis gespeichert, der beim Eintreffen am Server gilt; eine spätere
  Preisänderung ändert den Umsatz nicht mehr.
- `date` ist der Zeitpunkt des Abschließens, nicht des Sendens.
- PWA mit Service Worker: auf dem Tablet über „Zum Startbildschirm hinzufügen“ installieren. Die
  App startet im Vollbild und hält den Bildschirm wach. Eine neue Version wird erst zwischen zwei
  Verkäufen geladen (leerer Einkauf, Rückgeld nicht mehr angezeigt, nichts wird gerade gesendet).

## Entwicklung

```bash
npm i
npx ng serve            # standalone, Backend-URL aus src/environments/environment.development.ts
npm run build
npm run lint
npm run format
```

Unter Aspire (`backend/AppHost`) startet die App mit `npm start`; `update_base_url.js` schreibt
dabei die URL der API dieses Repositorys in `environment.development.ts` (nicht committen). Mit
`npx ng serve` erwartet die App die API unter `http://localhost:5001`. Lokal braucht das Backend
Produkte und ein Buffet (Dashboard, Seite „Buffet“, oder „Import from legacy backend“ dort).

Verwendete Endpunkte (alle mit Login, Richtlinie `IsCashier`): `GET /v1/users/is-cashier`,
`GET /v1/buffets` (Buffets mit Produkten auf der Karte, Preise in Cent, gleiche Form wie das alte
`GET /api/Buffets`) und `POST /v1/orders`
(`{ buffetId, date, orderNumber, soldUnits: [{ productId, amount }] }`, wie beim alten Backend).

## Docker

`BACKEND_URL` ist die URL des TadeoTTools-Backends **ohne** `/v1`
(z. B. `https://tadeot.htl-leonding.ac.at/tadeot-backend-201126`); sie wird beim Containerstart in
`env.js` geschrieben. Die Kassa-Domain muss in `AllowedOrigins` des Backends stehen. Die Kassa-URL muss im Keycloak-Client `htlleonding-service` als Redirect-URI
erlaubt sein. Die `base href` ist relativ (`./`), daher läuft dasselbe Image unter `/` und hinter
einem Pfad-Präfix (Präfix im Reverse Proxy entfernen). Der Aufruf muss mit `/` enden
(`…/kassa/`), sonst lädt der Browser `main.js` und `env.js` vom Root. Mit Traefik, unter dem
bisherigen Pfad `/kassa`, damit die Lesezeichen auf den Tablets weiter funktionieren:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tadeot-cashier.rule=Host(`${DOMAIN}`) && (Path(`/kassa`) || PathPrefix(`/kassa/`))"
  - "traefik.http.routers.tadeot-cashier.entrypoints=websecure"
  - "traefik.http.routers.tadeot-cashier.tls=true"
  - "traefik.http.services.tadeot-cashier.loadbalancer.server.port=80"
  # …/kassa -> …/kassa/ ($$ ist in Compose-Dateien ein einzelnes $)
  - "traefik.http.middlewares.tadeot-cashier-slash.redirectregex.regex=^(https?://[^/]+/kassa)$$"
  - "traefik.http.middlewares.tadeot-cashier-slash.redirectregex.replacement=$${1}/"
  - "traefik.http.middlewares.tadeot-cashier-stripprefix.stripprefix.prefixes=/kassa"
  - "traefik.http.routers.tadeot-cashier.middlewares=tadeot-cashier-slash,tadeot-cashier-stripprefix"
```

Auf demselben Host darf nur **eine** App unter `/kassa` laufen: die alte oder diese.

```bash
docker build -t tadeot-cashier .
docker run -p 8080:80 -e BACKEND_URL=https://tadeot.htl-leonding.ac.at/tadeot-backend-201126 tadeot-cashier
```
