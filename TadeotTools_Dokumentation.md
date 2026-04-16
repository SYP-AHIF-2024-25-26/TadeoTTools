# TadeoTTools - Projektdokumentation

## Übersicht
**TadeoTTools** ist ein umfassendes System zur Verwaltung und Durchführung des "Tages der offenen Tür". Es besteht aus drei Hauptkomponenten: einem Backend (`.NET`), einem Admin-Dashboard (`Angular`) und einer Frontend-App (`Angular`) für Besucher und Guides. Mit dem System können Stationen, Abteilungen, Zuweisungen (Lehrer, Schüler) und das Feedback-Management effizient gesteuert werden.

---

## 1. Projektstruktur
Das Projekt gliedert sich physisch in folgende Hauptverzeichnisse:
- **`backend/`**: Beinhaltet die REST-API, geschrieben in C# mit .NET und Entity Framework Core.
- **`frontend/`**: Die webbasierte App für Besucher und Guides, entwickelt mit Angular und TailwindCSS.
- **`dashboard/`**: Das Admin-Dashboard zur Datenverwaltung, ebenfalls entwickelt mit Angular.
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
- **Stationsgruppen / StopGroups (`/stopgroups` & `/stopgroup`)**: Verwaltung *des einen* zentralen Leitfadens. Hier werden neue Stopgroups erstellt (`StopGroupsComponent`) und verwaltet (`StopgroupDetailsComponent`). *Wichtig:* Die Anordnung der Gruppen/Stationen hier ändert direkt die finale Reihenfolge im Frontend!
- **Stationen / Stops (`/stops` & `/stop`)**: Umfassende Liste (`StopsComponent`) und Detailansicht (`StopDetailsComponent`) aller Stationen. Auf den Detailseiten einzelner Stops werden zudem vom Admin die zuständigen **Stop-Manager zugewiesen**.
- **Abteilungen / Divisions (`/divisions` & `/division`)**: Verwaltung (`DivisionsListComponent` / `DivisionDetailsComponent`) inkl. Farbkodierung, Bilder und zugeordneter Stationen.
- **Schüler / Students (`/students` & `/student`)**: In der ListView (`ListStudentsComponent`) ermöglicht dies dem Admin und System Administratoren die Übersicht aller zugewiesener Schüler sowie das Lösen von organisatorischen Konflikten. In der `StudentComponent` Ansicht (nur für den relevanten Schüler) sind die Einsatzdetails aufgelistet.
- **Stationsmanager / Stop-Manager (`/stop-manager`)**: Übersicht der Stationsverantwortlichen. (*Hinweis: Manager werden vom Admin auf der Stop-Details Seite zugewiesen - neue Manager-Accounts können im UserManagement hinzugefügt werden*).
- **Nutzerverwaltung (`/user-management`)**: Anlegen/Löschen der Administratoren und der Stop-Manager. Zusätzlich bietet das Modul den Im- und Export (`Upload`/`CSV`) aller Datensätze, den massenhaften Reset (`Wipe`) aller Studenten-Einträge und die Parameter, um z.B. den Frontend-Countdown einzustellen.
- **Feedback-Konfigurator (`/feedback`)**: Tool zum dynamischen Erstellen und Bearbeiten von Feedback-Fragen, Antwort-Optionen und Konditionierungen, das den Endnutzern auf der Frontend-Feedbackpage dargestellt wird.

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

### System-Konfiguration
- **FeatureFlags**: Beschreibt globale Key-Value Pairs im System wie den Boolean "ShowCountdown", welche von Frontends oder Dashboards abgefragt und mittels Admin-Status rekonfiguriert werden können.

---

## 6. How-To-Run / Deployment

### Lokale Entwicklung (Aspire)
Für die lokale Entwicklung und Orchestrierung des Backends wird .NET Aspire verwendet. Zuerst müssen in `frontend` und `dashboard` die Node-Abhängigkeiten installiert werden:
```bash
cd frontend && npm i
cd ../dashboard && npm i
```
Anschließend das Backend über das `AppHost` Projekt starten:
```bash
cd backend/AppHost
dotnet run
```

### Deployment (Docker CI/CD)
Das Projekt nutzt eine automatisierte Build-Pipeline (GitHub Actions). Bei jedem Push auf den Hauptzweig (`main`) werden automatisch neue Docker-Images für alle drei Services gebaut und in der **GitHub Container Registry (GHCR)** unter dem Owner `syp-ahif-2024-25-26` veröffentlicht:

- `ghcr.io/syp-ahif-2024-25-26/tadeottools/backend`
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/frontend`
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/dashboard`

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

**PostgreSQL** (`tadeot-postgres`):

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `POSTGRES_USER` | Datenbankbenutzer | `user` |
| `POSTGRES_PASSWORD` | Datenbankpasswort | `...` |
| `POSTGRES_DB` | Name der Datenbank | `tadeot` |
