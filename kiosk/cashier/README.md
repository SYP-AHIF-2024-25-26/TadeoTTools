# TadeoT Kassa (Kiosk)

Kassa-App für das Buffet beim Tag der offenen Tür. Eine Schülerin oder ein Schüler steht hinter dem
Buffet, tippt die gewünschten Produkte an, kassiert und gibt Rückgeld. Der Bildschirm spricht die
Person an der Kassa an, nicht die Besucher:innen.

Ersetzt die alte Angular-14-App (`tadeot-frontend/kassa` im Repository `htl-leo-tadeot`). Das
**alte Backend bleibt unverändert** und wird weiter verwendet; diese App ruft nicht die API dieses
Repositorys auf.

## Ablauf

Produkte antippen → „Kassieren“ → (optional) Betrag, der gegeben wurde → „Verkauf abschließen“.

- **Produkte:** ein Tippen auf die Kachel fügt eins hinzu, „−“ in der Ecke nimmt eins weg. Die Zahl
  im Kreis zeigt, wie viele im Einkauf sind (höchstens 99 pro Produkt). Reihenfolge, Namen und
  Preise kommen aus dem alten Admin.
- **Gutschein:** ein Produkt mit negativem Preis („Gutschein“, −2,00 €). Höchstens einer pro
  Einkauf (ein zweites Tippen nimmt ihn wieder heraus), nur zusammen mit einem Einkauf, und die
  Summe darf nicht unter 0 fallen.
- **Kassieren:** „Passend“ oder ein Schein (5/10/20/50 €, nur die, die die Summe übersteigen), oder
  den Betrag über das Ziffernfeld eintippen (mit Komma). Das Rückgeld steht groß daneben. Der
  Betrag ist freiwillig; „Verkauf abschließen“ geht auch ohne.
- Danach zeigt die Kassa wieder leere Produkte; Summe und Rückgeld des letzten Verkaufs bleiben
  stehen, bis das nächste Produkt angetippt wird.
- „Leeren“ verwirft den Einkauf (bei mehr als einem Artikel mit Rückfrage). Einen abgeschlossenen
  Verkauf kann man nicht rückgängig machen; das alte Backend hat dafür keinen Endpunkt.
- **Kassastand** (unter den Produkten): Summe und Zahl der Verkäufe auf diesem Tablet seit dem letzten
  Zurücksetzen, zum Zählen der Kassa bei Schichtende. „Auf 0 setzen“ betrifft nur diese Anzeige,
  nicht die Verkäufe am Server.
- Gibt es mehrere Buffets, fragt das Tablet beim ersten Start, für welches es kassiert, und merkt
  sich die Wahl („Wechseln“ in der Statusleiste). Bei nur einem Buffet wird es automatisch
  verwendet.

## Ohne Verbindung

- Buffets und Produkte werden in `localStorage` zwischengespeichert; die Kassa startet also auch
  ohne WLAN. Ohne Zwischenspeicher versucht das Tablet alle 30 s, sie zu laden. Danach werden sie
  alle 5 Minuten aktualisiert (Preisänderungen im Admin).
- **Jeder Verkauf wird zuerst auf dem Tablet gespeichert** und dann gesendet, der Reihe nach. Ohne
  Verbindung bleibt er gespeichert und wird alle 30 s (und sobald das WLAN wieder da ist) erneut
  gesendet; die Statusleiste zeigt dann „N Verkäufe warten auf Übertragung – Browserdaten nicht
  löschen“. Verkaufen geht dabei ganz normal weiter.
- Lehnt der Server einen Verkauf ab (400/404, z. B. Buffet oder Produkt im Admin gelöscht), wird er
  **nicht verworfen**, sondern als „nicht übertragbar“ angezeigt. Unter „Ansehen“ kann man ihn
  erneut senden oder bewusst entfernen.
- `orderNumber` ist `<Tablet-Kennung>-<laufende Nummer>` (z. B. `K7Q2-0047`). Das alte Backend
  prüft nicht auf doppelte Bestellungen; geht die Antwort auf einen Verkauf verloren und er wird
  noch einmal gesendet, lässt sich das Duplikat über `Orders.OrderNumber` finden.
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

**Achtung:** `environment.development.ts` zeigt auf das **echte** alte Backend. Lesen ist harmlos,
aber jeder abgeschlossene Verkauf landet als echter Verkauf in der Statistik. Zum Testen ein
Mock-Backend verwenden (`GET /api/Buffets` mit Testdaten, `POST /api/orders` mit 201 beantworten).

Unter Aspire (`backend/AppHost`) startet die App mit `npm start`; `update_base_url.js` schreibt
dabei `CASHIER_API_URL` in `environment.development.ts` (nicht committen).

Verwendete Endpunkte des alten Backends (beide ohne Login): `GET /api/Buffets` (Buffets mit ihren
Produkten, Preise in Cent) und `POST /api/orders`
(`{ buffetId, date, orderNumber, soldUnits: [{ productId, amount }] }`).

## Docker

`BACKEND_URL` ist die URL des alten Backends **ohne** `/api`
(z. B. `https://tadeot.htl-leonding.ac.at/tadeot-api`) und wird beim Containerstart in `env.js`
geschrieben. Die `base href` ist relativ (`./`), daher läuft dasselbe Image unter `/` und hinter
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
docker run -p 8080:80 -e BACKEND_URL=https://tadeot.htl-leonding.ac.at/tadeot-api tadeot-cashier
```
