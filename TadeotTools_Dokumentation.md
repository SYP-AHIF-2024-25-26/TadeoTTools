# TadeoTTools - Projektdokumentation

## Übersicht
**TadeoTTools** ist ein umfassendes System zur Verwaltung und Durchführung des "Tages der offenen Tür". Es besteht aus drei Hauptkomponenten: einem Backend (`.NET`), einem Admin-Dashboard (`Angular`) und einer Frontend-App (`Angular`) für Besucher und Guides. Mit dem System können Stationen, Abteilungen, Zuweisungen (Lehrer, Schüler) und das Feedback-Management effizient gesteuert werden.

---

## 1. Projektstruktur
Das Projekt gliedert sich physisch in folgende Hauptverzeichnisse:
- **`backend/`**: Beinhaltet die REST-API, geschrieben in C# mit .NET und Entity Framework Core.
- **`guide/`**: Die GuideApp, die öffentliche Web-App (PWA) für Besucher und Guides, entwickelt mit Angular und TailwindCSS.
- **`dashboard/`**: Das Admin-Dashboard zur Datenverwaltung, ebenfalls entwickelt mit Angular.
- **`kiosk/`**: Kiosk-Apps für fest aufgestellte Geräte, je App ein Unterordner. Derzeit `kiosk/feedback/` (Feedback-App für die Tablets am Ausgang), `kiosk/registration/` (Anmelde-App für die Tablets am Eingang), `kiosk/cashier/` (Kassa für das Buffet) und `kiosk/statistics/` (Diashow mit der Besucherstatistik für den Beamer). Alle Kiosk-Apps verwenden `backend/`; das alte TadeoT-Backend bleibt bis nach dem TdoT als Rückfall. Dazu kommt `tools/photo-downloader/`, das Programm, mit dem die Roboterführerschein-Stationen die Fotos der Besucher:innen holen.
- **`deployment/`** & **`docker-compose.yml`**: Beschreibt die Bereitstellung der Applikationen und der zugehörigen PostgreSQL-Datenbank als Docker-Container.

---

## 2. Frontend (Besucher & Guide Web-App)
Das Frontend dient Besuchern und Guides als interaktiver Leitfaden durch den Tag der offenen Tür. 

### How-To-Use: Besucher & Guides
- **Tour Starten:** Als User oder Guide startet man auf der Startseite, auf der die verschiedenen Touren/Stopgroups, aus denen sich der Leitfaden zusammensetzt, aufgelistet sind.
- **Navigation:** Man klickt sich durch die Tour, sieht Beschreibungen und Raumnummern der Stationen (auch direkt auf der Karte abrufbar).
- **Fortschritt:** Besucher sowie Guides können Stationen, die sie bereits besucht haben, als "erledigt" markieren, um den Überblick zu behalten.
- **Tour zurücksetzen:** In der Sektion "Über uns" lässt sich der eigene Fortschritt im Leitfaden jederzeit manuell zurücksetzen. Es existiert systemweit nur *ein* festgelegter Leitfaden.
- **Feedback:** Am Ende des Tages schließt man den Besuch idealerweise über die Feedback-Seite ab und reicht das vom Administrator individuell konfigurierte Feedback ein.

### Seiten (Pages / Routing)
- **Startseite (`/` bzw. `/main`)**: Die Landingpage `MainPageComponent`. Hier werden die Stopgroups/Touren aufgelistet, um durch den Tag zu leiten.
- **Countdown (`/countdown`)**: Die `NextYearPageComponent`, die den Countdown zum Start des Events anzeigt. *Kann im Dashboard mittels der Feature-Flag "ShowCountdown" gesteuert werden (zu finden in "User-Management" > "Data Import/Export" ganz unten).*
- **Feedback (`/feedback`)**: Die `FeedbackComponent` erlaubt Nutzern, am Ende ihres Besuchs das vom Admin konfigurierte Feedback abzuschließen.
- **Tour-Übersicht (`/tour/:stopGroupId`)**: Die `StopPageComponent`. Sie zeigt eine Liste der Stationen innerhalb einer Stationsgruppe des Leitfadens an.
- **Stations-Detailansicht (`/tour/:stopGroupId/stop/:stopId`)**: Die `StopDescriptionPageComponent`. Detaillierte Ansicht einer einzelnen Station inkl. Beschreibung, Ort/Raumnummer und der Möglichkeit, die Station als "erledigt" zu markieren.
- **Karte (`/map` & `/map/:roomNr`)**: Die `MapComponent`. Ein Bereich für einen interaktiven Raumplan oder eine Übersichtskarte. Der Parameter `roomNr` ermöglicht das direkte Hervorheben eines bestimmten Raums.
- **Über uns (`/about`)**: Die `AboutPageComponent` für allgemeine Informationen. *Inkludiert zudem den Button, um den aktuellen Fortschritt im Leitfaden zurückzusetzen.*

---

## 3. Dashboard (Admin-Bereich)
Das Dashboard dient zur Datenpflege, Konfiguration und Verwaltung.

### How-To-Use: Rollenkonzept
- **Schüler / Guides:** Können sich ins Dashboard einloggen, haben jedoch keine allgemeinen Administrationsrechte. Dort können sie aber die dedizierte *Student-Page* besuchen, welche sämtliche Informationen über exakt die Station bereithält, der sie aktuell für den Tag zugeteilt sind.
- **Stop-Manager:** Stop-Manager können klassische Lehrer (Teachers) aber auch Schüler (Students) sein. Sie werden stets vom Admin als verantwortliche Person für bestimmte Stationen festgelegt. Wenn sie sich im Dashboard einloggen, greifen sie gezielt auf ihre zugewiesenen Stationen zu und können diese verwalten.
- **Admin:** Besitzt volle Rechte über die gesamte Plattform. Aufgaben beinhalten: Schülerschaft verwalten, Student-Konflikte lösen (z.B. Zuweisungen an doppelte Stationen prüfen), Abteilungen erstellen, das dynamische Feedback konfigurieren und der Aufbau des finalen **Leitfadens** (also die stringente Anordnung aller Stopgroups). Zudem weist der Admin auf den Stations-Unterseiten die jeweiligen Stop-Manager zu.

### Seiten (Pages / Routing)
- **Login (`/login`)**: Nutzt die `LoginComponent`. Die Anmeldung ins System erfolgt sicher via Schulaccount-SSO (Keycloak).
- **Übersicht / Overview (`/overview`)**: Startseite der Admins nach dem Login; erreichbar über das Logo (kein eigener Menüpunkt).
- **Students & Stops (`/students-and-stops`)**: Ein Menüpunkt mit drei Tabs: Students (Standard), Stop Groups (`?tab=stopgroups`) und Stops (`?tab=stops`). Die alten Adressen `/students`, `/stopgroups` und `/stops` leiten auf den passenden Tab weiter. Wer Stop Groups mit ungespeicherter Reihenfolge verlässt (auch per Tab-Wechsel), wird gefragt.
- **Stationsgruppen / StopGroups (Tab Stop Groups & `/stopgroup`)**: Verwaltung *des einen* zentralen Leitfadens. Hier werden neue Stopgroups erstellt (`StopGroupsComponent`) und verwaltet (`StopgroupDetailsComponent`). *Wichtig:* Die Anordnung der Gruppen/Stationen hier ändert direkt die finale Reihenfolge im Frontend!
- **Stationen / Stops (Tab Stops & `/stop`)**: Umfassende Liste (`StopsComponent`) und Detailansicht (`StopDetailsComponent`) aller Stationen. Auf den Detailseiten einzelner Stops werden zudem vom Admin die zuständigen **Stop-Manager zugewiesen**.
- **Abteilungen / Divisions (`/divisions` & `/division`)**: Verwaltung (`DivisionsListComponent` / `DivisionDetailsComponent`) inkl. Farbkodierung, Bilder und zugeordneter Stationen.
- **Schüler / Students (Tab Students & `/student`)**: In der ListView (`ListStudentsComponent`) ermöglicht dies dem Admin und System Administratoren die Übersicht aller zugewiesener Schüler sowie das Lösen von organisatorischen Konflikten. In der `StudentComponent` Ansicht (nur für den relevanten Schüler) sind die Einsatzdetails aufgelistet.
- **Stationsmanager / Stop-Manager (`/stop-manager`)**: Übersicht der Stationsverantwortlichen. (*Hinweis: Manager werden vom Admin auf der Stop-Details Seite zugewiesen - neue Manager-Accounts können im UserManagement hinzugefügt werden*).
- **Fotos für den Roboterführerschein (Abschnitt auf `/student`, `/stop-manager` und im Tab *Registrations*)**: `VisitorPhotosComponent`, nur sichtbar, wenn `GET /v1/users/is-photo-viewer` 200 liefert, auf `/student` und `/stop-manager` zusätzlich nur mit `atStop: true` (nicht für Admins, die diese Seiten ansehen). Zeigt kein Foto von selbst: geblättertes Raster von Buttons aller Fotos in Nummernfolge (Nummer und Uhrzeit, 20 pro Seite, wählbar 20/50/100; die Liste wird alle 30 s nachgeladen, solange der Tab sichtbar ist); ein Klick zeigt das Foto klein neben dem Raster (am Handy darunter) mit Download, alle Fotos als ZIP.
- **Nutzerverwaltung (`/user-management`)**: Anlegen/Löschen der Administratoren und der Stop-Manager. Zusätzlich bietet das Modul den Im- und Export (`Upload`/`CSV`) aller Datensätze, den massenhaften Reset (`Wipe`) aller Studenten-Einträge und die Parameter, um z.B. den Frontend-Countdown einzustellen.
- **Feedback-Konfigurator (`/feedback`)**: Tool zum dynamischen Erstellen und Bearbeiten von Feedback-Fragen, Antwort-Optionen und Konditionierungen, das den Endnutzern auf der Frontend-Feedbackpage dargestellt wird.
- **Buffet (`/buffet`, nur Admins)**: Produkte (Name, Einheit, Preis in Euro; ein negativer Preis ist ein Gutschein), je Buffet eine Karte mit Ort, Beschreibung, der Speisekarte in Reihenfolge der Kassa (ein Buffet ohne Produkte erscheint nicht in der Kassa), Ein- und Auszahlungen; dazu die Verkäufe je Buffet und Produkt, CSV-Export und „Delete all sales“.
- **Registration (`/registration`, nur Admins)**: Daten der Anmeldung, in Tabs. *Registrations*: Anzahl Anmeldungen, CSV-Export, der Foto-Abschnitt (siehe oben) mit der Anzahl Fotos, „Delete all registrations“ (samt Fotos) und „Delete all photos“. *Towns*: alle Orte mit Suche (PLZ oder Name) und Bezirksfilter, anlegen, ändern (auch den Bezirk), löschen (nicht bei Anmeldungen aus dem Ort). *Districts*: Bezirke anlegen, ändern, löschen (nicht, solange Orte dazugehören). *Choice Lists*: „Reasons for visit“ und „School types“ ordnen, ergänzen, entfernen, gemeinsam speichern; bestehende Anmeldungen behalten ihren Text. Jede leere Liste lässt sich per CSV füllen (zuerst die Bezirke), jede gefüllte als CSV exportieren.

---

## 4. Backend (REST API)
Die API bündelt sich basierend auf der Swagger Spezifikation in folgende logische Gruppen:

### API Referenz (Endpoints)

**Admin Management:**
- `GET /v1/api/admins` - Ruft alle Administratoren ab
- `POST /v1/api/admins` - Fügt einen neuen Admin hinzu
- `DELETE /v1/api/admins/{name}` - Löscht einen Admin

**Division Management (Abteilungen):**
- `GET /v1/divisions` - Holt alle öffentlich relevanten Abteilungen
- `GET /v1/divisions/{divisionId}/image` - Ruft das Bild einer bestimmten Abteilung ab
- `GET /v1/api/divisions/csv` - Exportiert die Abteilungen als CSV
- `POST /v1/api/divisions` - Erstellt eine neue Abteilung
- `PUT /v1/api/divisions` - Aktualisiert Abteilungsdaten
- `PUT /v1/api/divisions/image` - Aktualisiert das zugewiesene Bild
- `DELETE /v1/api/divisions/{divisionId}` - Löscht eine Abteilung
- `DELETE /v1/api/divisions/{divisionId}/image` - Löscht ein referenziertes Abteilungsbild

**Stop Management (Stationen):**
- `GET /v1/stops` - Holt öffentliche Stationen
- `GET /v1/stops/correlating` - Holt miteinander in Beziehung stehende Stationen
- `GET /v1/api/stops` - Holt alle Stationen (Admin-Sicht)
- `GET /v1/api/stops/{stopId:int}` - Details zu einer Station
- `GET /v1/api/stops/by-division` - Stationen nach Division sortiert abfragen
- `GET /v1/api/stops/stop-manager/{stopManagerId}` - Alle Stationen eines Stop-Managers
- `GET /v1/api/stops/csv` - CSV-Export aller Stationen
- `GET /v1/api/stops/{stopId:int}/csv` - CSV-Export von Daten einer Station
- `POST /v1/api/stops` - Erstellt eine neue Station
- `PUT /v1/api/stops` - Aktualisiert eine bestehende Station
- `PUT /v1/stop-manager/stops` - Erlaubt einem Stop-Manager die Aktualisierung seiner Station
- `DELETE /v1/api/stops/{stopId:int}` - Löscht eine Station

**StopGroup Management (Stationsgruppen / Leitfaden):**
- `GET /v1/groups` - Holt alle Stationsgruppen (Frontend)
- `GET /v1/api/groups` - Holt interne Ansicht (Dashboard)
- `GET /v1/api/groups/{groupId:int}` - Holt ein spezifisches Element
- `POST /v1/api/groups` - Erstellt eine neue Gruppe
- `PUT /v1/api/groups` - Aktualisiert eine Gruppe
- `PUT /v1/api/groups/order` - Passt die Sortierung/den Leitfaden der Stationen innerhalb einer Gruppe an
- `DELETE /v1/api/groups/{groupId:int}` - Löscht eine Stationsgruppe

**StopManager Management:**
- `GET /v1/api/stopmanagers` - Listet alle Stationsmanager
- `GET /v1/api/stopmanagers/{id}` - Details für einen Stop-Manager
- `POST /v1/api/stopmanagers` - Fügt Manager manuell hinzu
- `POST /v1/api/stopmanagers/upload` - Erstellt Stop-Manager via CSV-Upload
- `PUT /v1/api/stopmanagers` - Aktualisiert Manager-Daten
- `DELETE /v1/api/stopmanagers/{id}` - Löscht einen Manager

**Student Management (Schüler):**
- `GET /v1/api/students` - Ruft alle Schüler ab
- `GET /v1/api/students/csv` - Exportiert die Schüler als CSV
- `POST /v1/api/students` - Legt einen Schüler an
- `POST /v1/api/students/upload` - CSV-Upload (Massenanlegen der Schülerschaft)
- `POST /v1/api/students/assignments/upload` - CSV-Upload für Zuweisungen (Schüler -> Station)
- `PUT /v1/api/students/{id}` - Aktualisiert Schülerdaten
- `DELETE /v1/api/students` - Setzt alle Schüler zurück / löscht Bestand

**Feedback Management:**
- `GET /v1/feedback-questions` - Ruft die parametrisierten Fragen ab
- `GET /v1/get-answers-csv` - Exportiert abgegebene Antworten in CSV
- `POST /v1/add-feedbacks` - Reicht Nutzer-Feedback ein
- `POST /v1/save-questions` - Speichert aktualisierte Fragenstruktur aus Konfigurator

**Feature-Flags & Base Settings:**
- `GET /v1/featureflags/{name}` - Prüft den Status bestimmter UI-Toggles (z.B. "ShowCountdown")
- `PUT /v1/featureflags/{name}` - Setzt einen Feature-Flag-Wert 
- `GET /v1/api/resetDB` - Endpunkt für Entwicklungszwecke (Wipes Database)

**User Roles / Session Evaluation:**
- `GET /v1/users/at-least-logged-in`
- `GET /v1/users/at-least-student`
- `GET /v1/users/everyone-allowed`
- `GET /v1/users/is-admin`
- `GET /v1/users/token-data`
- `GET /v1/users/in-database`
- `GET /v1/users/is-cashier` (Kassa-Kiosk: 200 für Lehrer:innen, Admins und Schüler:innen mit bestätigter Zuteilung zur Station „Buffet“, sonst 403)
- `GET /v1/users/is-registrar` (Anmelde-Kiosk: dasselbe für die Station „Empfang“, Richtlinie `IsRegistrar`; Antwort wie `is-cashier`: `{ name, studentClass }`)
- `GET /v1/users/is-photo-viewer` (Dashboard, Foto-Abschnitt; Richtlinie `IsPhotoViewer`: Admins, Stop-Manager und Schüler:innen mit bestätigter Zuteilung der Station „Roboterführerschein“, Lehrkräfte nur als deren Stop-Manager; Antwort `{ atStop }`, `false` für Admins ohne Bezug zur Station)

**Buffet (Kassa-Kiosk, Richtlinie `IsCashier`):**
- `GET /v1/buffets` - Buffets mit Produkten auf der Speisekarte, in Reihenfolge der Kassa, Preise in Cent (gleiche Form wie das alte `GET /api/Buffets`)
- `POST /v1/orders` - Speichert einen Verkauf (`{ buffetId, date, orderNumber, soldUnits: [{ productId, amount }] }`). Eine bereits gespeicherte `orderNumber` wird mit 200 beantwortet, ohne sie erneut zu speichern; 404 für ein unbekanntes Buffet, 400 für Produkte, die nicht auf der Speisekarte stehen, Mengen außerhalb 1–99 oder mehr als einen Gutschein

**Buffet (Verwaltung, nur Admins):**
- `GET /v1/api/products` - Alle Produkte mit Anzahl Speisekarten und verkaufter Menge
- `POST /v1/api/products`, `PUT /v1/api/products/{productId}` - Produkt anlegen / ändern (409 bei doppeltem Namen)
- `DELETE /v1/api/products/{productId}` - Löscht ein Produkt (409, solange es auf einer Speisekarte steht oder Verkäufe hat)
- `GET /v1/api/buffets` - Buffets mit Speisekarte, Kassenbewegungen und Anzahl Verkäufe
- `POST /v1/api/buffets`, `PUT /v1/api/buffets/{buffetId}` - Buffet anlegen / ändern (409 bei doppeltem Ort)
- `DELETE /v1/api/buffets/{buffetId}` - Löscht ein Buffet samt Speisekarte (409 bei Verkäufen oder Kassenbewegungen)
- `PUT /v1/api/buffets/{buffetId}/menu` - Ersetzt die Speisekarte (Liste von Produkt-IDs in Reihenfolge)
- `POST /v1/api/buffets/{buffetId}/cash-movements`, `DELETE /v1/api/cash-movements/{cashMovementId}` - Ein- und Auszahlungen
- `GET /v1/api/sales` - Umsatz je Buffet und Produkt, aus den gespeicherten Verkaufspreisen
- `GET /v1/api/sales/csv` - Alle verkauften Positionen als CSV (Uhrzeit in Wiener Zeit)
- `DELETE /v1/api/sales` - Löscht alle Verkäufe

**Anmeldung (Anmelde-Kiosk; nur das Speichern braucht den Login):**
- `GET /v1/cities` - Alle Orte (`id`, `name`, `zipCode`), nach Name (gleiche Form wie das alte `GET /api/Cities`)
- `GET /v1/registration-options` - `{ reasonsForVisit, schoolTypes }` in Reihenfolge des Kiosks
- `GET /v1/visitors/count` - `{ count, adultsCount }`
- `POST /v1/visitors` (Richtlinie `IsRegistrar`) - Speichert eine Anmeldung samt dem `preferred_username` des Logins (`gender`: `Male`, `Female` oder `NotStated`; Foto als PNG-Data-URL in `photo`), Antwort: die neue Id. 400 für einen unbekannten Ort oder ein Foto, das kein PNG ist; 500, wenn das Foto nicht gespeichert werden kann (dann wird auch die Anmeldung nicht gespeichert)

**Statistik und Fotos (ohne Login):**
- `GET /v1/visitor-statistics` - Alles für die Diashow: Anzahl, Anmeldungen pro Stunde (Wiener Zeit), Abteilungen, Gründe, Schultypen, Anmeldungen je Bezirk, Geschlecht
- `GET /v1/visitor-photos` - Dateinamen aller Fotos; die Datei selbst unter `GET /v1/visitor-photos/Visitor_0001.png` (für den PhotoDownloader)

**Anmeldung (Verwaltung, nur Admins):**
- `GET/POST /v1/api/districts`, `PUT/DELETE /v1/api/districts/{districtId}` - Bezirke (409 bei doppelter Nummer oder doppeltem Namen; Löschen nur ohne Orte)
- `GET/POST /v1/api/cities`, `PUT/DELETE /v1/api/cities/{cityId}` - Orte (409 bei doppelter PLZ + Name; Löschen nur ohne Anmeldungen)
- `GET /v1/api/registration-options`, `PUT /v1/api/registration-options/{kind}` - Auswahllisten (`kind` = `reasons-for-visit` oder `school-types`; ersetzt die ganze Liste)
- `GET` und `POST /v1/api/districts/csv`, `/v1/api/cities/csv`, `/v1/api/registration-options/{kind}/csv` - CSV-Export und -Import mit denselben Spalten (`Number;Name`, `Id;ZipCode;Name;Number;DistrictNumber`, `Order;Name`). Der Import (Datei als Request-Body, `text/csv`) füllt nur eine leere Liste (sonst 409), ganz oder gar nicht (400 mit `{ errors: ["Line 3: …"] }`); angegebene Orts-IDs bleiben erhalten
- `GET /v1/api/visitors/summary` - Anzahl Anmeldungen, Begleitpersonen und Fotos
- `GET /v1/api/visitors/csv` - Alle Anmeldungen als CSV (Wiener Zeit)
- `DELETE /v1/api/visitors` - Löscht alle Anmeldungen und alle Fotodateien; die nächste Anmeldung bekommt wieder die Id 1 (Roboterführerschein-Nummer, Foto `Visitor_0001.png`)
- `DELETE /v1/api/visitor-photos` - Löscht alle Fotos (die Anmeldungen bleiben)

**Fotos im Dashboard (Richtlinie `IsPhotoViewer`):**
- `GET /v1/api/visitor-photos` - Alle Fotos, neueste zuerst: `[{ id, fileName, createdAt }]`, `createdAt` in UTC; die Datei liegt öffentlich unter `/v1/visitor-photos/{fileName}`
- `GET /v1/api/visitor-photos/zip` - Alle Fotos als ZIP

---

## 5. Datenmodell
Das in Entity-Framework Core hinterlegte PostgreSQL Datenmodell umfasst folgende Relationen, Tabellen und Funktionalitäten:

### Personen- und Authentifizierungsentitäten
- **Students (Schüler)**: Beinhaltet primär `EdufsUsername`, `FirstName`, `LastName`, `StudentClass` ("xAHIF") und `Department`.
- **Teachers (Lehrer/Stop-Manager)**: Beinhaltet `EdufsUsername`, `FirstName` und `LastName`.
- **Admins**: Eine Rolle, in der lediglich die berechtigten `Id`s (Usernames) abgelegt werden.

### Zuweisungen (Assignments)
- **StudentAssignments**: Weist einem Schüler (`StudentId`) exakt eine Station (`StopId`) zu unter Verwendung eines bestimmten `Status`. (Erlaubt dem Admin Konfliktvermeidung).
- **TeacherAssignments**: Weist einen Lehrer (`TeacherId`) einer Station (`StopId`) zu (erhält damit StopManager-Befugnisse). Generell können als StopManager auch verifizierte `Students` gesetzt werden.

### Strukturierungs-Entitäten (Leitfaden, Abteilungen)
- **Stops (Stationen)**: `Id`, `Name`, `Description`, und `RoomNr` (Raum/Geografie).
- **Divisions (Abteilungen)**: Repräsentiert das Label der Schulabteilung (`Id`, `Name`, `Color` via Hexcode, `Image` per Byte-Stream gespeichert).
  - Nutzt eine M2M Beziehung via **DivisionStop** zu der jeweiligen Station.
- **StopGroups (Stationsgruppen)**: Bausteine / Kategorien des Master-Leitfadens (`Id`, `Rank`, `Name`, `Description`, `IsPublic`).
  - Via **StopGroupAssignments** ist die M2M Tabelle angebunden, welche das Attribute `Order` (z.B. Station 1, 2, 3...) direkt aufnimmt und somit die App-Routenfolge steuert.

### Feedback-Engine
- **FeedbackQuestions**: Die Fragestellung (`Id`, `Question`, `Order`, `Required`). Die Spalte `Discriminator` steuert über Eigenschaften wie `MinRating`, `MaxRating`, `RatingLabels`, `AllowMultiple` oder `Placeholder` ab, wie das Frontend diese darstellt (z.B. Checkboxen oder Sternerating).
- **FeedbackOptions**: Entitäten für das MultiSelect / RadioButton-Menü, die genau einer Frage zugeteilt sind (`Value`).
- **FeedbackDependencies**: Logische Konditionen (Frage 2 wird nur unter der Voraussetzung gezeigt, dass bei Frage 1 der Wert in `ConditionValue` gewählt wurde).
- **FeedbackQuestionAnswers**: Konkrete Speicherung des eingereichten Wertes (`Answer`) referenzierend auf die jeweilige Frage und den Einreicher.

### Buffet
- **Products**: `Name` (eindeutig, max. 40), `Unit`, `PriceCents` (negativ = Gutschein). Ein Preis gilt an allen Buffets.
- **Buffets**: `Location` (eindeutig, max. 3 Zeichen), `Description`. Über **BuffetProducts** (`BuffetId`, `ProductId`, `Order`) hängt die Speisekarte.
- **CashMovements**: Ein- (positiv) und Auszahlungen (negativ) eines Buffets in Cent, Zeit in UTC.
- **Orders**: ein Verkauf mit eindeutiger `OrderNumber` (vom Tablet), `CreatedAt` (UTC, Zeitpunkt des Abschließens), `BuffetId` und `CashierUsername`. **OrderItems** speichern `Quantity` und `UnitPriceCents`, den Preis beim Verkauf; spätere Preisänderungen ändern den Umsatz nicht.

### Anmeldung
- **Districts**: `Number` (dreistellig, eindeutig, Statistik Austria) und `Name` (eindeutig).
- **Cities**: `ZipCode` (vierstellig), `Name`, `Number` (Gemeindekennziffer, nicht eindeutig: in Wien teilen sich viele PLZ eine) und `DistrictId`. PLZ + Name sind eindeutig. Die IDs stammen aus dem alten System, damit ein auf das alte Backend zurückgestellter Kiosk gültige IDs sendet.
- **RegistrationOptions**: Einträge der zwei Auswahllisten (`Kind` = Grund des Besuchs oder Schultyp) mit `Order`.
- **Visitors**: `CreatedAt` (UTC), `Gender`, `Adults` (0–4), `SchoolLevel` (7–13), `CityId`, Grund und Schultyp als **Text** (eine spätere Änderung der Liste ändert alte Anmeldungen nicht), acht Interessen, `Comment`, `HasPhoto`, `RegisteredBy` (`preferred_username` des Logins am Kiosk; in der CSV-Spalte „Angemeldet von“). Das Foto liegt als Datei `Visitor_0001.png` im Ordner `Photos:Path`.

### System-Konfiguration
- **FeatureFlags**: Beschreibt globale Key-Value Pairs im System wie den Boolean "ShowCountdown", welche von Frontends oder Dashboards abgefragt und mittels Admin-Status rekonfiguriert werden können.

---

## 6. How-To-Run / Deployment

### Lokale Entwicklung (Aspire)
Für die lokale Entwicklung und Orchestrierung des Backends wird .NET Aspire verwendet. Zuerst müssen in `guide`, `dashboard`, `kiosk/feedback`, `kiosk/registration`, `kiosk/cashier` und `kiosk/statistics` die Node-Abhängigkeiten installiert werden:
```bash
cd guide && npm i
cd ../dashboard && npm i
cd ../kiosk/feedback && npm i
cd ../registration && npm i
cd ../cashier && npm i
cd ../statistics && npm i
```
Anschließend das Backend über das `AppHost` Projekt starten:
```bash
cd backend/AppHost
dotnet run
```

### Deployment (Docker CI/CD)
Das Projekt nutzt eine automatisierte Build-Pipeline (GitHub Actions). Bei jedem Push auf den Hauptzweig (`main`) werden automatisch neue Docker-Images für alle drei Services gebaut und in der **GitHub Container Registry (GHCR)** unter dem Owner `syp-ahif-2024-25-26` veröffentlicht:

- `ghcr.io/syp-ahif-2024-25-26/tadeottools/backend`
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/frontend` (aus `guide/`)
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/dashboard`
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/feedback` (aus `kiosk/feedback/`)
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/registration` (aus `kiosk/registration/`)
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/cashier` (aus `kiosk/cashier/`)
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/statistics` (aus `kiosk/statistics/`)

#### Staging-Umgebung (automatisch)
Nach jedem Push auf `main` wird die neue Version automatisch auf die **Staging-Umgebung** deployed:

> **URL:** [vm45.htl-leonding.ac.at](http://vm45.htl-leonding.ac.at)

Diese Umgebung dient zum Testen und Validieren von Änderungen vor dem produktiven Einsatz.

#### Produktionsumgebung (manuell)
Das Deployment auf die **Produktionsumgebung** muss manuell angestoßen werden:

> **URL:** [tadeot.htl-leonding.ac.at](https://tadeot.htl-leonding.ac.at)

Hier läuft die für den tatsächlichen Tag der offenen Tür relevante, stabile Version des Systems.

### Environment-Variablen der Container

> **Hinweis:** Die Datei `example-docker-compose.yml` beschreibt den generellen Aufbau des Deployments. Die darin referenzierten Docker-Images werden in der GitHub Container Registry (GHCR) unter `ghcr.io/syp-ahif-2024-25-26/tadeottools/` gehostet und **können nicht ohne GHCR-Authentifizierung gepullt werden**.

**Frontend** (`tadeot-frontend-201126`):

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `BACKEND_URL` | Öffentliche URL des Backends | `https://tadeot.htl-leonding.ac.at/tadeot-backend-201126` |

**Dashboard** (`tadeot-dashboard-201126`):

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `BASE_HREF` | Basispfad des Dashboards | `/adm-dashboard/` |
| `BACKEND_URL` | Öffentliche URL des Backends inkl. `/v1` | `https://tadeot.htl-leonding.ac.at/tadeot-backend-201126/v1` |
| `KEYCLOAK_REDIRECT_URI` | Redirect-URL nach Keycloak-Login | `https://tadeot.htl-leonding.ac.at/adm-dashboard/` |

**Backend** (`tadeot-backend-201126`):

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | Laufzeitumgebung | `Production` |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED` | Aktiviert Proxy-Header-Weiterleitung | `true` |
| `ConnectionStrings__DefaultConnection` | EF Core Datenbankverbindung | `Host=tadeot-postgres;Database=tadeot;Username=user;Password=...` |
| `ASPNETCORE_URLS` | Interner Port-Binding | `http://+:4100` |
| `Photos__Path` | Ordner der Besucherfotos (optional; Standard `/app/photos`, dort einen Host-Ordner mounten, den UID 1654 schreiben darf) | `/app/photos` |

**PostgreSQL** (`tadeot-postgres`):

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `POSTGRES_USER` | Datenbankbenutzer | `user` |
| `POSTGRES_PASSWORD` | Datenbankpasswort | `...` |
| `POSTGRES_DB` | Name der Datenbank | `tadeot` |
