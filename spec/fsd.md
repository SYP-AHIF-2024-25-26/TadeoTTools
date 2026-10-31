# Spezifikation: TadeoTTools – Werkzeuge für den Tag der offenen Tür der HTL Leonding

Dieses FSD beschreibt den **aktuellen Stand der Implementierung** (Stand 2026-10-21) und die in
`spec/answers.md` getroffenen Entscheidungen. Anforderungen, die der Code heute noch nicht erfüllt,
sind mit **(Lücke)** markiert; sie stehen zusätzlich in §18 unter „Soll“ bzw. „Kann“. Alles andere
ist umgesetzt.

---

## 1. Zweck und Zielbild

TadeoTTools unterstützt den Tag der offenen Tür (TdoT) der HTL Leonding: die Vorbereitung im
Dashboard, die Führung der Besucher:innen mit der GuideApp und den Betrieb am Veranstaltungstag
mit Kiosk-Apps auf Tablets.

Primäre Ziele:
- Eine von der Schule festgelegte Tour durch das Gebäude statt eines Papierplans.
- Ein Ort für die Planung von Stationen, Stationsgruppen, Abteilungen und die Zuteilung der
  Schüler:innen zu Stationen.
- Anonymes Feedback der Besucher:innen, auswertbar für das nächste Jahr.
- Anmeldung der Besucher:innen, Buffet-Kassa und Besucherstatistik am Veranstaltungstag.

Rahmen:
- Das System verwaltet genau **eine** Veranstaltung. Mehrere Schuljahre und Veranstaltungen sind
  eine spätere Erweiterung (§18 „Kann“).
- Der TdoT dauert seit 2026 einen Tag (nächster Termin: 20.11.2026). Eine mehrtägige Veranstaltung
  muss planbar bleiben: Tour und Zuteilungen gelten dann automatisch für alle Tage, nur die
  Statistik wertet Tage getrennt aus (§10.3).
- Sprache: Besucher-Apps und Kiosks deutsch (du-Form), Dashboard englisch.

Nicht-Ziele:
- Kein Konto und keine serverseitige Speicherung des Fortschritts für Besucher:innen.
- Keine Benachrichtigungen (E-Mail o. ä.) in der aktuellen Version.

---

## 2. Rollen und Berechtigungen

## 2.1 Rollen
- `Besucher:in`: nutzt GuideApp und Feedback ohne Login.
- `Schüler:in`: arbeitet am TdoT an einer Station; Login über die Schul-SSO (LeoAuth-Rolle
  „Student“).
- `Stop-Manager`: betreut eine oder mehrere Stationen; Lehrkraft oder Schüler:in. Ist, wer in der
  Tabelle `StopManagers` steht (Admins tragen das in „Users & Data“ ein).
- `Admin`: Vollzugriff. Ist, wer in der Tabelle `Admins` steht.
- `Kassier:in`: darf die Kassa bedienen (§11.2).
- `Anmelder:in`: darf am Eingang Besucher:innen anmelden (§11.3).
- `Fotostation`: darf im Dashboard die Fotos der Anmeldung für den Roboterführerschein ansehen
  und herunterladen (§5.5).

Rollen werden nicht aus dem Token gelesen: Das Backend sucht den `preferred_username` des Tokens
(ohne Beachtung der Groß-/Kleinschreibung) in den Tabellen `Admins` und `StopManagers`.

## 2.2 Rechte
- `Besucher:in`
  - Öffentliche Stationsgruppen und Stationen, Abteilungen, Feedback-Fragen und Feature-Flags lesen.
  - Feedback absenden.
- `Schüler:in`
  - Die eigenen Stationen mit Status, Beschreibung, Raum und den anderen Schüler:innen dieser
    Station (Name, Klasse, Abteilung) sehen, auch bei offenen Anfragen.
- `Stop-Manager`
  - Eigene Stationen sehen und bearbeiten: Name, Beschreibung, Raum, Kartenposition, Infrastruktur-Wünsche und
    die Schüler:innen der Station (hinzufügen, bestätigen, entfernen).
  - Nur eigene Stationen ändern. **(Lücke):** `PUT /v1/stop-manager/stops` prüft nicht, ob die
    Station dem Stop-Manager gehört; das Dashboard zeigt nur die eigenen.
  - Abteilungen, Stationsgruppen und Stop-Manager nicht anlegen, ändern oder löschen.
    **(Lücke):** `POST /v1/api/divisions` ist auch für Stop-Manager offen;
    `GET /v1/api/groups` (auch nicht öffentliche Gruppen) ebenfalls.
- `Admin`
  - Alles: Tour, Stationen, Gruppen, Abteilungen, Schüler:innen, Stop-Manager, Admins,
    Feedback-Fragebogen, Import/Export, Feature-Flags.
  - Admins anlegen (nur über den Benutzernamen, ohne Prüfung, ob es ihn gibt) und entfernen.
    Ein Admin kann sich nicht selbst entfernen; damit bleibt immer mindestens ein Admin übrig.
- `Kassier:in`: Verkäufe an der Kassa erfassen.
- `Anmelder:in`: Besucher:innen am Anmelde-Kiosk anmelden.
- `Fotostation`: die Liste aller Fotos sehen, einzelne Fotos ansehen und herunterladen,
  alle Fotos als ZIP laden. Nicht löschen (nur Admins, §11.3).

## 2.3 Erster Admin
- **(Lücke):** Der erste Admin wird beim Start automatisch angelegt, konfiguriert über eine
  Umgebungsvariable (`.env`), Standard ist der LDAP-Benutzer `sysadmin`. Heute ist das Seeding
  auskommentiert; der erste Admin kommt nur per SQL in die Datenbank.

## 2.4 Benutzer ohne Rolle
- Wer weder Admin noch Stop-Manager ist, landet im Dashboard auf `/student`. Eine Lehrkraft ohne
  Rolle sieht dort nur einen Fehler.
- **(Lücke):** Eine Vorschau-Seite zeigt allen angemeldeten Rollen (auch Schüler:innen und
  Lehrkräften ohne Rolle) die öffentlichen Stationsgruppen mit ihren Stationen, wie in der
  GuideApp. Dafür braucht es eine eigene Navigation für Schüler:innen (Entwurf offen, §19).

## 2.5 Testendpunkte
- `GET /v1/users/at-least-logged-in`, `/at-least-student`, `/everyone-allowed` und `/token-data`
  bleiben als Diagnose-Endpunkte bestehen.

---

## 3. Systemkontext und technische Leitplanken

## 3.1 Bestandteile
- `backend/`: .NET 10 Minimal API mit EF Core auf PostgreSQL; alle Routen unter `/v1`.
  `/v1/api/...` ist die geschützte Verwaltungsschnittstelle, `/v1/...` ohne `api` das, was
  GuideApp und Kiosks lesen.
- `dashboard/`: Angular 22, Login über Keycloak, für Admins, Stop-Manager und Schüler:innen.
- `guide/`: GuideApp, Angular-22-PWA ohne Login.
- `kiosk/feedback/`, `kiosk/statistics/`, `kiosk/registration/`, `kiosk/cashier/` (Angular 22):
  PWAs für feste Geräte (§11).
- Altes Backend `htl-leo-tadeot` (eigenes Repo): abgelöst. Kassa, Anmeldung und Statistik laufen
  über `backend/` (Anmeldung und Statistik seit der Umstellung am 30.10.2026). Bis nach dem TdoT
  bleibt das alte Backend der Rückfall und wird **nicht verändert** (§3.4).
- `tools/photo-downloader/`: Programm für die Roboterführerschein-Stationen, holt die Fotos der
  Anmeldung (§11.3).

## 3.2 Identität
- Keycloak der Schule (`auth.htl-leonding.ac.at`, Realm `htlleonding`), JWT über LeoAuth.

## 3.3 Betrieb
- Docker-Images in GHCR, je App ein Image. Ein Push auf `main` baut die geänderten Images und
  deployt automatisch auf das Testsystem (vm45).
- Produktion `tadeot.htl-leonding.ac.at`: manuelles Deployment wie auf vm45, gleiche
  Compose-Datei, andere Domain. Dort laufen alle neuen Kiosk-Apps.
- Datenbank-Migrationen werden beim Start des Backends angewendet.

## 3.4 Altes Backend
- Das alte Backend und seine Administrationsseite wurden vor dem TdoT in zwei Schritten in
  TadeoTTools migriert:
  1. Buffet und Kassa (umgestellt): Produkte, Buffets, Speisekarten, Kassenbewegungen und
     Verkäufe liegen in `backend/` und werden im Dashboard verwaltet (§11.2).
  2. Anmeldung, Statistik und Fotos (umgestellt am 30.10.2026): Orte, Bezirke, Auswahllisten,
     Anmeldungen und Fotos liegen in `backend/` und werden im Dashboard verwaltet (§11.3, §11.4).
- Daten aus dem alten Backend kommen nur als CSV-Datei ins System, über den Import im Dashboard;
  `backend/` ruft das alte Backend nie auf. Die Orte und Bezirke wurden am 29.10.2026 exportiert.
- Das alte Backend bleibt unverändert und läuft bis nach dem 20.11.2026 als Rückfall weiter. Ein
  Rückfall setzt nur die Images der Kiosks zurück. Die Orte behalten ihre alten IDs, damit ein
  zurückgestellter Anmelde-Kiosk gültige IDs sendet. Die Produkte wurden von Hand angelegt; vor
  einem Rückfall der Kassa müssen die Warteschlangen der Tablets leer sein.

## 3.5 Geräte
- Kiosk-Apps laufen auf Android-Tablets verschiedener Generationen und Auflösungen.
- Anmeldung und Feedback-Kiosk laufen gemeinsam auf einem Tablet; die Kassa jeweils auf einem
  eigenen. Alle Kiosk-Apps müssen auch zusammen auf einem einzigen Tablet installierbar sein.
- Mehrere Geräte je Kiosk vertragen sich.
- An die Handys der Besucher:innen werden keine Anforderungen gestellt.

---

## 4. Fachliche Kernobjekte

## 4.1 Station (Stop)
Felder:
- Name (eindeutig, max. 100 Zeichen)
- Beschreibung (Markdown, max. 500 Zeichen)
- Raumnummer (max. 50 Zeichen)
- Infrastruktur-Wünsche (max. 500 Zeichen)
- Abteilungen (0..n)

Eigenschaften:
- Eine Station kann mehreren Stationsgruppen angehören, mit eigener Reihenfolge je Gruppe.
- Eine Station ohne öffentliche Gruppe ist **intern** (z. B. „Buffet“): nicht in der GuideApp,
  aber mit Schüler:innen und Stop-Managern.
- Die Raumnummer bleibt der Text, den Besucher:innen lesen. Wo die Station auf der Karte liegt,
  bestimmt die Verknüpfung mit einem oder mehreren Orten (§4.1a); passen Text und Verknüpfung nicht
  zusammen, warnt das Dashboard.
- **(Lücke):** Das Dashboard begrenzt die Beschreibung auf 255 Zeichen; es müssen 500 sein
  (das Backend erlaubt 500; mehr soll es nicht geben, damit der Text in der GuideApp überschaubar
  bleibt).

## 4.1a Ort auf der Karte (MapPlace)
- Jeder Raum der Stockwerkspläne (U, E, 1) und jede benannte Stelle ist genau ein Ort: Stockwerk,
  eindeutiger Code (Raumnummer wie auf dem Plan, geteilte Räume als `E58-1`, oder Name der Stelle),
  optional Name (z. B. „Aula OG“), Position auf dem Plan.
- Eine Station kann an mehreren Orten liegen, ein Ort mehrere Stationen enthalten.
- Ein Ort kann ein öffentliches Label mit Symbol haben (z. B. „Buffet“). Es erscheint auf der Karte
  ohne Stationsseite; die interne Station selbst bleibt unsichtbar.
- Orte legen, verschieben, ändern und löschen nur Admins (Dashboard-Seite „Map“). Verknüpfen dürfen
  Admins und, bei ihren Stationen, Stop-Manager.

## 4.2 Stationsgruppe (StopGroup)
- Name (eindeutig, max. 300), Beschreibung (max. 3000), öffentlich ja/nein, Position in der Tour.
- Nur ganze Gruppen sind öffentlich oder nicht; eine einzelne Station lässt sich nicht verstecken.

## 4.3 Tour
- Es gibt systemweit genau **eine** Tour: die öffentlichen Gruppen in ihrer Reihenfolge, darin die
  Stationen in ihrer Reihenfolge je Gruppe. Die Reihenfolge bestimmen die Admins.

## 4.4 Abteilung (Division)
- Name (eindeutig), Farbe (`#RRGGBB`), optional ein Bild (PNG/JPG), Stationen.
- Abteilungen sind im Dashboard frei verwaltbar. Die GuideApp kennt eine feste Reihenfolge
  (HIF, HITM, HEL, HBG), die Statistik feste Farben.
- Abteilungsfarben werden nie überlagert oder getönt; Kontrast nur über die Textfarbe.

## 4.5 Schüler:in (Student)
- Benutzername (`EdufsUsername`, eindeutiger Schlüssel), Vor- und Nachname, Klasse, Abteilung.
- **(Lücke):** Die Abteilung wird aus der Klasse abgeleitet (Klassenname enthält HIF, HITM,
  HEL bzw. FEL, HBG) und mit den Abteilungen verknüpft; der Import ignoriert die Abteilungsspalte.
  Heute ist sie freier Text aus dem Import.

## 4.6 Stop-Manager
- Benutzername (Schlüssel), Vor- und Nachname, zugeordnete Stationen.

## 4.7 Zuteilung (StudentAssignment)
- Schüler:in, Station, Status `PENDING` (Anfrage) oder `ACCEPTED` (bestätigt).
- **(Lücke):** Der Status `DECLINED` entfällt (das Dashboard legt ihn nicht mehr an, im Modell
  und in alten Daten gibt es ihn noch).

## 4.8 Feature-Flag
- Schlüssel (eindeutig), ein/aus, Beschreibung, optional ein Wert. Heute gibt es `showCountdown`
  (§6.4).

---

## 5. Authentifizierung und Rollenermittlung

## 5.1 Dashboard
1. Login über Keycloak (`login-required`).
2. Das Dashboard fragt das Backend: `GET /v1/users/is-admin`, dann `GET /v1/users/in-database`
   (Stop-Manager).
3. Admins landen auf der Übersicht, Stop-Manager auf `/stop-manager`, alle anderen auf `/student`.

## 5.2 GuideApp, Feedback-Kiosk, Statistik
- Kein Login.

## 5.3 Anmeldung
- Login über Keycloak wie bei der Kassa (§5.4); der Zugang wird beim Start über
  `GET /v1/users/is-registrar` geprüft (§11.3).
- Nur `POST /v1/visitors` verlangt die Anmeldung. `GET /v1/cities`, `GET /v1/registration-options`
  und `GET /v1/visitors/count` bleiben offen (keine personenbezogenen Daten); der Kiosk lädt sie
  schon vor dem Login.
- Beim Start einer Anmeldung muss der Login noch mindestens 10 Minuten gelten, sonst wird zuerst
  neu eingeloggt: Der Login lädt die Seite neu und würde eingegebene Angaben verwerfen.

## 5.4 Kassa
- Login über Keycloak (gleicher Client wie das Dashboard). Der Zugang wird beim Start über
  `GET /v1/users/is-cashier` geprüft (§11.2).
- Ein einziges Token: Jede Anfrage an `backend/` trägt die Anmeldung; `GET /v1/buffets` und
  `POST /v1/orders` verlangen dieselbe Berechtigung wie `is-cashier`. Läuft die Anmeldung ab oder
  wird der Zugang entzogen, kehrt die Kassa zur Anmeldung zurück; wartende Verkäufe bleiben am Gerät.

## 5.5 Fotos im Dashboard (Roboterführerschein)
- Zugang: die Stop-Manager der Station, die genau „Roboterführerschein“ heißt, die Schüler:innen
  mit bestätigter Zuteilung zu ihr (Groß-/Kleinschreibung egal) und Admins. Anders als bei Kassa
  und Anmeldung haben Lehrkräfte nicht von sich aus Zugang, nur als Stop-Manager der Station.
  Geprüft über `GET /v1/users/is-photo-viewer`.
- Kein eigener Menüpunkt: Der Abschnitt „Fotos“ erscheint auf `/student` und `/stop-manager` nur
  für die Leute der Station (nicht für Admins, die diese Seiten ansehen); Admins finden ihn im Tab
  „Registrations“ auf `/registration`.
- Kein Foto wird von selbst gezeigt. Alle Fotos stehen als Raster von Buttons (Besuchernummer
  und Uhrzeit der Anmeldung, Wiener Zeit) in Nummernfolge, geblättert mit standardmäßig 20 Fotos
  pro Seite (wählbar 20, 50, 100). Ein Klick zeigt das Foto klein neben dem Raster (am Handy
  darunter), mit Download (`Visitor_0001.png`) und „Hide“; ein zweiter Klick blendet es aus.
  Dazu die Anzahl, die höchste
  Nummer und alle Fotos als ZIP. Die Liste wird alle 30 Sekunden nachgeladen, solange der Tab
  sichtbar ist.
- Die Fotodateien selbst bleiben öffentlich (§11.3); geschützt sind die Liste und das ZIP.

---

## 6. Tour und GuideApp

## 6.1 Seiten
- Start: Liste der öffentlichen Stationsgruppen in Tour-Reihenfolge.
- Gruppe: Stationen der Gruppe in Reihenfolge, Wischgesten zwischen Gruppen.
- Station: Beschreibung (Markdown), Raum, Abteilungen, „gesehen“ markieren.
- Karte: Stockwerkspläne U/E/1 mit einer Markierung je Ort mit öffentlichen Stationen, in den exakten
  Abteilungsfarben, darunter die Stationen des Stockwerks als Liste. Eine Markierung zeigt auf der
  Karte eine Kurzansicht der Station (Name, Raum, Anfang der Beschreibung, „gesehen“, „Zur Station“),
  mehrere oder zu nah beieinanderliegende Orte eine Auswahl. Die Stationsseite führt dann zurück zur
  Karte, aufs selbe Stockwerk, ohne Blättern in der Gruppe. „Auf der Karte“ hebt alle Orte der
  Station hervor (`/map/:raum?stop=id`).
- Feedback (§9), Über uns/Impressum (Link auf https://www.htl-leonding.at/impressum), Countdown.

## 6.2 Fortschritt
- Gesehene Stationen und Gruppen werden nur im Browser gespeichert; „Über uns“ setzt sie zurück.
  Kein Sync, kein Konto.

## 6.3 Offline
- Die GuideApp ist eine installierbare PWA und zeigt ohne Verbindung die zuletzt geladenen
  Daten. Das ist ein Extra, keine Anforderung.

## 6.4 Countdown
- Ist `showCountdown` eingeschaltet, zeigt die GuideApp **nur** die Countdown-Seite (auch kein
  Feedback). Der Wert des Flags ist der Beginn des nächsten TdoT; das Ende ist fest 19:00 Uhr.

## 6.5 Direktlinks
- Ein Direktlink auf eine Station ohne vorherigen Besuch führt zurück auf die Startseite.
  QR-Codes an den Stationen mit funktionierendem Direktlink sind eine spätere Erweiterung
  (§18 „Kann“).

---

## 7. Tourplanung im Dashboard (Admins)

- Stationsgruppen anlegen, bearbeiten, löschen, öffentlich schalten und in der Tour umsortieren.
- Stationen anlegen, bearbeiten, löschen, Gruppen, Abteilungen, Stop-Manager und Schüler:innen
  zuordnen; Reihenfolge der Stationen je Gruppe festlegen.
- Abteilungen anlegen, bearbeiten (Farbe, Bild), löschen (Tab in „Users & Data“).
- Ungespeicherte Änderungen werden beim Verlassen der Seite abgefragt.

## 7.1 Infrastruktur-Wünsche
- Heute: Freitextfeld der Station, im Dashboard bearbeitbar und im Stations-CSV exportiert.
- **(Lücke):** Eine eigene Admin-Seite zeigt die Infrastruktur-Wünsche aller Stationen mit
  Raumnummer; ein Admin markiert jeden Wunsch als „verfügbar“ und als „erledigt“. Nach einer
  konfigurierbaren Deadline können Stop-Manager das Feld nicht mehr ändern, sehen aber, ob ihre
  Wünsche verfügbar bzw. erledigt sind.

---

## 8. Zuteilung der Schüler:innen

## 8.1 Entstehung
- Zuteilungen entstehen ausschließlich im Dashboard: Stop-Manager (für eigene Stationen) und
  Admins fügen Schüler:innen als Anfrage (`PENDING`) hinzu und bestätigen sie (`ACCEPTED`).
- Der CSV-Import von Zuteilungen dient nur der Wiederherstellung einer Sicherung (§12).

## 8.2 Regeln
- Eine Schülerin, ein Schüler ist für **höchstens eine** Station bestätigt. Das Backend lehnt eine
  zweite Bestätigung mit 400 ab.
- Konflikt: eine Person hat mehr als eine Anfrage. Admins lösen Konflikte auf der Seite
  „Students“.
- Doppelte oder konkurrierende Anfragen werden **gelöscht**, nicht abgelehnt.
- Farben: Approved grün, Pending türkis, Conflict orange.

## 8.3 Verwaltung
- Admins importieren Schüler:innen per CSV (vorhandene werden übersprungen) und löschen sie
  gesammelt („Delete All Students“, samt Zuteilungen). Ein Löschen einzelner Personen gibt es
  nicht.
- Schüler:innen erfahren ihre Zuteilung nur durch Einloggen. **E-Mail-Benachrichtigung** bei
  Änderungen ist eine spätere Erweiterung (§18 „Kann“).

---

## 9. Feedback

## 9.1 Fragebogen (Admins)
- Fragetypen: Text (Platzhalter), Bewertung (Min 1–9, Max 2–10, Beschriftungen kommagetrennt),
  Einfach- und Mehrfachauswahl (Optionen).
- Reihenfolge, Pflichtfrage ja/nein.
- Bedingungen: Eine Frage kann von Antworten anderer Fragen abhängen. Sie wird nur gezeigt, wenn
  **alle** Bedingungen erfüllt sind (UND, Vergleich auf Gleichheit mit einem Wert).
- Wird eine Frage entfernt oder ihr Typ geändert, werden ihre Antworten mitgelöscht; das
  Dashboard warnt vorher.
- Mehrfachauswahl wird als „A, B“ gespeichert; Optionen und Beschriftungen mit Komma zerfallen
  (bewusst so gelassen).

## 9.2 Abgabe
- Anonym, ohne Login, über `POST /v1/add-feedbacks`. Nur nicht leere Antworten werden gesendet.
- Pflichtfragen und Wertebereiche prüfen die Apps; das Backend prüft sie nicht.
- GuideApp: einmal pro Gerät (im Browser gemerkt, danach nur „Danke“). Das ist Komfort, kein
  Schutz.
- Feedback-Kiosk: §11.1.
- **(Lücke):** Die Quelle (GuideApp oder Kiosk) wird mitgespeichert. Heute ist sie nicht
  unterscheidbar.

## 9.3 Auswertung
- Admins sehen die Antworten, exportieren sie als CSV und löschen sie manuell (Fragen bleiben).

---

## 10. Import, Export, Datensicherung

## 10.1 Format
- CSV, `;` getrennt, UTF-8 mit BOM (für Excel).
- **(Lücke):** Spaltennamen werden vereinheitlicht (heute: Stations- und Abteilungs-Export
  englisch, Schüler- und Stations-Schüler-Export deutsch).

## 10.2 Datenquellen
- Schülerliste: jedes Jahr manuell aus Sokrates exportiert und importiert.
- Lehrkräfte: ändern sich selten und bleiben im Echtsystem erhalten.
- Stationen, Gruppen und Abteilungen werden von Jahr zu Jahr übernommen und im Dashboard
  überarbeitet. Die Stationsplanung (`TdoT_Stationsplanung_*.csv`) wird nur im
  Development-Modus beim Start importiert.

## 10.3 Sicherung und Wiederherstellung
- Exporte (Stationen, Abteilungen, Schüler:innen, Schüler:innen je Station, Feedback) und Importe
  (Schüler:innen, Stop-Manager, Zuteilungen) dienen der Datensicherung und Wiederherstellung,
  z. B. bei einem Neuhosting.
- **(Lücke):** Der Zuteilungs-Import findet Personen über den **Benutzernamen** (heute über Klasse
  und Namen; gleichnamige Schüler:innen werden verwechselt).
- **(Lücke):** Der Zuteilungs-Import überspringt fehlerhafte Zeilen wie der Schüler-Import, statt
  ganz abzubrechen (Details offen, §19).
- **(Lücke):** `GET /v1/api/resetDB` (nicht implementiert) wird entfernt.

## 10.4 Statistik pro Tag
- Die Statistik-Diashow zeigt Anmeldungen pro Stunde je Tag (§11.4). Weitere Auswertungen pro Tag
  sind nicht nötig.

---

## 11. Kiosk-Apps

## 11.1 Feedback-Kiosk (`kiosk/feedback`, Ausgang)
- Schüler:innen erfassen am Tablet das Feedback der Besucher:innen; danach startet der Bogen neu.
- Fertiges Feedback geht über eine Warteschlange am Gerät (`localStorage`) und wird wiederholt,
  bis das Backend es annimmt; 400/409-Antworten werden verworfen.

## 11.2 Kassa (`kiosk/cashier`, Buffet, `/kassa`)
- Zugang: alle Lehrkräfte (LeoAuth), alle Admins und Schüler:innen mit bestätigter Zuteilung zur
  Station, die genau „Buffet“ heißt.
- Produkte, Buffets und Speisekarten verwalten Admins im Dashboard (Seite „Buffet“). Die Kassa
  liest sie über `GET /v1/buffets`; Preise in ganzen Cent; ein negativer Preis ist ein Gutschein
  (max. einer pro Verkauf, auch vom Backend geprüft). Ein Produkt hat an allen Buffets denselben
  Preis.
- Mehrere Buffets sind möglich; ein Buffet ohne Produkte auf der Speisekarte erscheint nicht in der
  Kassa, ohne dass es oder seine Verkäufe gelöscht werden.
- Verkäufe gehen über eine Warteschlange am Gerät und werden der Reihe nach gesendet. Nichts wird
  verworfen; abgelehnte Verkäufe bleiben als „nicht übertragbar“ stehen.
- `orderNumber` = `<Gerätekennung>-<laufende Nummer>`. `POST /v1/orders` speichert jede Nummer
  nur einmal und beantwortet eine Wiederholung mit Erfolg; ein erneut gesendeter Verkauf zählt
  also nicht doppelt.
- Jeder Verkauf speichert den Preis, zu dem verkauft wurde; eine spätere Preisänderung ändert den
  Umsatz nicht.
- Ein abgeschlossener Verkauf lässt sich nicht stornieren.
- `POST /v1/orders` verlangt die Anmeldung als Kassier:in.
- **(Lücke):** Welche Stationen kassieren dürfen, ist konfigurierbar (z. B. auch die
  Infrastruktur-Station), statt des fest eingebauten Namens „Buffet“.

## 11.3 Anmeldung (`kiosk/registration`, Eingang, `/registration`)
- Zugang: alle Lehrkräfte (LeoAuth), alle Admins und Schüler:innen mit bestätigter Zuteilung zur
  Station, die genau „Empfang“ heißt (fest eingebaut, Groß-/Kleinschreibung egal; wie bei der
  Kassa, §11.2). Stop-Manager sind nicht ausgeschlossen, die Rolle allein gibt aber keinen
  Zugang: Lehrkräfte unter ihnen dürfen als Lehrkräfte anmelden, Schüler:innen unter ihnen nur mit
  der Zuteilung zu „Empfang“. Offene oder abgelehnte Zuteilungen zählen nicht.
- Der Kiosk sagt „einloggen“/„ausloggen“, weil „Anmelden“ dort das Speichern einer Besucherin
  oder eines Besuchers ist. Die Statusleiste zeigt, wer eingeloggt ist; „Ausloggen“ gibt es nur
  auf dem Startbildschirm, mit Rückfrage (z. B. beim Schichtwechsel).
- Kein Datenverlust durch den Login: „Anmeldung starten“ prüft zuerst, ob die Sitzung noch
  mindestens 10 Minuten gilt, sonst wird vorher neu eingeloggt (§5.3). Wird das Speichern trotzdem
  wegen des Logins abgelehnt (abgelaufen oder Zugang entzogen), bleiben die Angaben stehen und
  werden erst nach Rückfrage verworfen.
- Jede Anmeldung speichert, wer am Kiosk eingeloggt war (Benutzername); er steht im CSV-Export
  („Angemeldet von“).
- Schüler:innen erfassen ankommende Besucher:innen: Postleitzahl/Ort, Angaben zur Person, wie sie
  von der Schule erfahren haben, Interessen, optional ein Foto für den Roboterführerschein.
- Nur österreichische Postleitzahlen; die Liste muss aktuell sein. Admins pflegen Orte und Bezirke
  im Dashboard (Seite „Registration“): anlegen, ändern (auch den Bezirk eines Orts), löschen. Ein
  Ort mit Anmeldungen und ein Bezirk mit Orten lassen sich nicht löschen. Die erste Befüllung
  kommt per CSV-Import aus den Daten des alten Backends; ein Import füllt nur eine leere Liste,
  ganz oder gar nicht.
- Die Auswahllisten „Grund des Besuchs“ und „Schultyp“ pflegen Admins ebenfalls dort (Reihenfolge,
  ergänzen, entfernen). Eine Anmeldung speichert den gewählten Text; eine spätere Änderung der
  Liste ändert sie nicht.
- Geschlecht: männlich, weiblich oder „keine Angabe“.
- Die Einwilligung zum Foto wird am Kiosk eingeholt. Das Foto liegt als Datei `Visitor_0001.png`
  (Besuchernummer) im Backend und ist **ohne Login über die Besuchernummer abrufbar**, damit die
  Roboterführerschein-Stationen es mit dem PhotoDownloader holen können (Entscheidung, bis nach
  dem TdoT 20.11.2026; dann neu entscheiden). Zusätzlich zeigt das Dashboard die Fotos der
  Station (§5.5). Kann das Foto nicht gespeichert werden, wird auch die Anmeldung nicht gespeichert.
- Admins exportieren die Anmeldungen als CSV, laden alle Fotos als ZIP und löschen alle
  Anmeldungen (samt Fotos) oder nur alle Fotos im Dashboard. Nach dem Löschen aller Anmeldungen beginnt die
  Besuchernummer (und damit die Nummer für den Roboterführerschein) wieder bei 1.
- Speichern braucht eine Verbindung (keine Warteschlange).

## 11.4 Statistik (`kiosk/statistics`, Beamer in der Aula, `/statistics`)
- Unbeaufsichtigte Diashow (nur lesend, `GET /v1/visitor-statistics`): Besucherzahl, Anmeldungen
  pro Stunde, Abteilungen, Gründe, Schultypen, Bezirke, Geschlecht.
- Die Bezirks-Folie zählt die Anmeldungen je Bezirk des gewählten Orts (Begleitpersonen nicht
  mitgezählt; das alte Backend zählte die Orte mit Anmeldungen). Wien erscheint je
  Gemeindebezirk, so wie die Wiener Orte im Dashboard ihren Bezirken zugeordnet sind.
- Aktualisierung alle 60 s, Zwischenspeicher im Browser; Fehler werden nie angezeigt, nur der
  „Stand“ bleibt stehen.
- `?delay=N` setzt die Sekunden pro Folie (3–120, Standard 10).
- Die Stunden-Folie zeigt eine Zeile je Tag: den letzten Tag und Tage mit Anmeldungen in der Woche
  davor (max. 3).
- Die Stunden sind Wiener Zeit (Sommer- und Winterzeit); das Backend speichert in UTC.

---

## 12. Datenhaltung, Löschung, Aufbewahrung

- Schüler:innen (samt Zuteilungen) löscht ein Admin zu einem frei wählbaren Zeitpunkt,
  spätestens im neuen Schuljahr, wenn die Planung des nächsten TdoT beginnt.
- Stop-Manager werden nicht gelöscht, außer als Teil der Schüler:innen, die Stop-Manager sind.
- Feedback wird manuell gelöscht (§9.3).
- Anmeldungen und Fotos löscht ein Admin im Dashboard nach dem TdoT, nach dem Export (§11.3);
  damit auch der gespeicherte Benutzername der Anmelder:innen. Das Archiv der Daten aus dem alten
  Backend wird an dem Tag gelöscht, den die Aufbewahrungsregel der Schule vorgibt.
- Stationen, Gruppen und Abteilungen bleiben über die Jahre bestehen.

---

## 13. Sicherheit und Datenschutz

## 13.1 Rahmen
- DSGVO.

## 13.2 Zugriff
- Nach §2. Verwaltungsendpunkte unter `/v1/api` brauchen ein Token und die passende Rolle.

## 13.3 CORS
- Testsystem (vm45): neben der eigenen Domain sind lokale Frontends (`localhost`) erlaubt, damit
  man lokal gegen das Testsystem entwickeln kann.
- **(Lücke):** Produktion (`tadeot.htl-leonding.ac.at`) erlaubt kein `localhost`, weil Images und
  Repo öffentlich sind. Heute ist die Liste für beide Systeme gleich.

## 13.4 Fehlerantworten
- Validierungsfehler → 400, Datenbank-Konflikte (z. B. doppelter Name) → 409, jeweils als
  ProblemDetails.

---

## 14. Nicht-funktionale Anforderungen

- Mengen: keine Vorgaben.
- Verfügbarkeit/SLA: kein SLA.
- Kiosk-Apps müssen auf Android-Tablets verschiedener Auflösungen bedienbar sein (§3.5).
- GuideApp: auf dem Weg durchs Gebäude mit einem kurzen Blick lesbar.

---

## 15. UI-Anforderungen

## 15.1 Dashboard
- Übersicht, Stationsgruppen (Tour), Stationen, Station (Detail), Stationsgruppe (Detail),
  Abteilung (Detail), Students (Zuteilungen und Konflikte), Stop-Manager, Users & Data (Admins,
  Stop-Manager, Abteilungen, Import/Export, Löschen, Feature-Flags), Feedback-Konfigurator,
  Schülerseite.
- Detailseiten über Query-Parameter (`/stop?…`, `/stopgroup?…`, `/division?…`).

## 15.2 GuideApp
- §6.1. Abteilungsfarben und -bilder der Schule bleiben unverändert (§4.4).

## 15.3 Kiosks
- Bedienung ohne Router-Navigation durch Besucher:innen; großflächig für Tablets.

---

## 16. User Stories mit Akzeptanzkriterien

## US-01 Tour folgen
Als Besucher:in möchte ich die Stationen in der Reihenfolge der Schule sehen und wissen, wo sie
sind.

Akzeptanzkriterien:
- Nur öffentliche Gruppen erscheinen, in Tour-Reihenfolge, die Stationen je Gruppe ebenfalls.
- Jede Station zeigt Beschreibung, Raum und auf der Karte das Stockwerk mit dem hervorgehobenen Raum.
- Auf der Karte führt ein Klick auf eine Markierung zur Station.
- „Gesehen“ bleibt im Browser erhalten und lässt sich zurücksetzen.

## US-02 Feedback geben
Als Besucher:in möchte ich am Handy oder am Kiosk anonym Feedback geben.

Akzeptanzkriterien:
- Bedingte Fragen erscheinen nur, wenn alle Bedingungen erfüllt sind.
- Pflichtfragen müssen beantwortet sein.
- Am Kiosk geht Feedback ohne Verbindung nicht verloren.

## US-03 Tour planen
Als Admin möchte ich Gruppen und Stationen anlegen und die Reihenfolge festlegen.

Akzeptanzkriterien:
- Reihenfolge von Gruppen und Stationen je Gruppe ist im Dashboard änderbar.
- Nicht öffentliche Gruppen erscheinen nicht in der GuideApp.

## US-04 Station betreuen
Als Stop-Manager möchte ich meine Stationen pflegen und Schüler:innen zuteilen.

Akzeptanzkriterien:
- Nur eigene Stationen sind sichtbar und änderbar (Backend prüft das, siehe Lücke §2.2).
- Eine bereits anderswo bestätigte Person kann nicht bestätigt werden (400).

## US-05 Konflikte lösen
Als Admin möchte ich sehen, wer mehr als eine Anfrage hat, und das auflösen.

Akzeptanzkriterien:
- Konflikte sind orange markiert.
- Auflösen löscht die übrigen Anfragen.

## US-06 Eigene Station sehen
Als Schüler:in möchte ich sehen, an welcher Station ich eingeteilt bin.

Akzeptanzkriterien:
- Station, Status, Beschreibung, Raum und die anderen Schüler:innen der Station werden gezeigt.

## US-07 Besucher:in anmelden
Als Schüler:in am Eingang möchte ich ankommende Besucher:innen erfassen.

Akzeptanzkriterien:
- Nur gültige österreichische Postleitzahlen.
- Ohne Verbindung wird nicht gespeichert, und das ist sichtbar.
- Nur berechtigte Personen kommen nach dem Login zur Anmeldung; ein ablaufender Login verwirft
  keine bereits eingegebenen Angaben ohne Rückfrage.

## US-08 Kassieren
Als Kassier:in möchte ich Verkäufe am Buffet erfassen.

Akzeptanzkriterien:
- Nur berechtigte Personen kommen nach dem Login zur Kassa.
- Verkäufe ohne Verbindung werden später gesendet; abgelehnte bleiben sichtbar.

## US-09 Statistik zeigen
Als Organisator:in möchte ich in der Aula aktuelle Besucherzahlen zeigen.

Akzeptanzkriterien:
- Die Diashow läuft unbeaufsichtigt und aktualisiert sich alle 60 s.
- Ein Ausfall des Backends zeigt keinen Fehler, nur einen stehenden „Stand“.

## US-10 Daten sichern
Als Admin möchte ich Daten exportieren und bei einem Neuhosting wieder importieren.

Akzeptanzkriterien:
- Exporte sind `;`-getrennte CSV mit UTF-8-BOM und lassen sich in Excel öffnen.
- Schüler:innen, Stop-Manager und Zuteilungen lassen sich aus diesen Dateien wieder importieren.

---

## 17. Abnahme

Ein Stand gilt als abnahmefähig für den TdoT, wenn mindestens funktioniert:
- GuideApp mit Tour und Karte.
- Feedback am Handy und am Kiosk.
- Anmeldung, Kassa, Statistik.
- Dashboard für Tourplanung und Zuteilung.
- Die Funktionen des alten Backends und seiner Administrationsseite in TadeoTTools (seit der
  Migration, §3.4).

---

## 18. Priorisierung

## Muss
- Alles, was in §1–17 ohne **(Lücke)** steht.

## Soll
- Stop-Manager dürfen nur eigene Stationen ändern; Abteilungen anlegen und alle Gruppen lesen nur
  Admins (§2.2).
- Erster Admin per `.env`-Seed (§2.3).
- Beschreibung im Dashboard bis 500 Zeichen (§4.1).
- `DECLINED` entfernen (§4.7).
- Abteilung der Schüler:innen aus der Klasse ableiten (§4.5).
- Zuteilungs-Import über Benutzernamen, fehlerhafte Zeilen überspringen (§10.3).
- `resetDB` entfernen, CSV-Spaltennamen vereinheitlichen (§10).
- Feedback-Quelle speichern (§9.2).
- Kein `localhost` in CORS der Produktion (§13.3).
- Infrastruktur-Seite mit „verfügbar“/„erledigt“ und Deadline (§7.1).
- Vorschau-Seite der Tour für alle Rollen und Navigation für Schüler:innen (§2.4).

## Kann (später)
- Mehrere Schuljahre und Veranstaltungen; abgeschlossene nur lesbar, nur aktuelle editierbar;
  mehrere Veranstaltungen pro Schuljahr für dieselben Schüler:innen.
- Konfigurierbar, welche Stationen kassieren dürfen (§11.2); ebenso für die Anmeldung statt
  „Empfang“ (§11.3).
- QR-Codes an Stationen mit funktionierendem Direktlink (§6.5).
- E-Mail-Benachrichtigung bei Änderungen an Zuteilungen (§8.3).
- Aus dem README: Schichtplanung, Warteschlangen-Management, Gutscheinverwaltung fürs Buffet,
  Lösung für andere Schulen.

---

## 19. Offene Punkte

- **Zuteilungs-Import (§10.3):** Wie genau überspringen (welche Fehler, Rückmeldung an den Admin)
  ist noch zu klären (Antworten 32/34).
- **Navigation für Schüler:innen (§2.4):** Entwurf der Vorschau-Seite und der Navigation offen.
- **Alte Endpunkte (§3.4):** Bis zum 20.11.2026 bleiben die Endpunkte des alten Backends (Buffet,
  Anmeldung, Statistik) ohne Login erreichbar (es wird nicht verändert), werden aber nur noch im
  Rückfall verwendet. Danach wird das alte Backend abgeschaltet. Im Rückfall der Anmeldung braucht
  der alte Kiosk keinen Login und speichert keinen Benutzernamen.
- **Mehrtägige Veranstaltung (§1):** Das Datenmodell kennt keinen Tag; wie Tage geplant werden,
  wird mit der Erweiterung „mehrere Veranstaltungen“ entschieden.
