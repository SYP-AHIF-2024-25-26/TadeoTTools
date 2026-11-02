# Fragen zur Spezifikation von TadeoTTools

Grundlage für `spec/fsd.md` (#93). Anders als bei franklyn beschreibt das FSD den **aktuellen
Stand der Implementierung**. Die Fragen unten betreffen Stellen, an denen der Code etwas tut, das
nirgends entschieden oder dokumentiert ist, an denen Code und Doku sich widersprechen, oder an denen
etwas nur halb gebaut ist. Bei jeder Frage steht unter **Ist**, was der Code heute macht.

Bitte beantworte **jede Frage mit derselben Nummer** in `spec/answers.md`. „Wie Ist“ reicht, wenn
das aktuelle Verhalten so gewollt ist; dann kommt es so ins FSD. Alles andere wird im FSD unter
„Offene Punkte“ als Lücke geführt und später ein Issue bzw. eine `[GAP]`-Aufgabe.

Die Überschriften entsprechen den geplanten Abschnitten des FSD.

## 1) Zweck, Rahmen, Zeitraum

1. **Jahreswechsel:** Das Datenmodell kennt kein Jahr und keine Veranstaltung. Wie wird ein neuer
   Tag der offenen Tür vorbereitet: Was wird gelöscht, was bleibt?
   Ist: Es gibt „Delete All Students“ (Schüler:innen samt Zuteilungen) und „Feedback löschen“
   (Antworten, Fragen bleiben). Stationen, Gruppen, Abteilungen und Stop-Manager bleiben stehen.
2. **Zwei Tage:** Der Tag der offenen Tür dauert zwei Tage. Gilt für beide Tage dieselbe Tour und
   dieselbe Zuteilung der Schüler:innen? Muss das System die Tage unterscheiden (Zuteilung pro Tag,
   Statistik pro Tag)?
   Ist: Es gibt keinen Tagesbezug, nur die Statistik-Diashow zeigt Anmeldungen pro Tag.
3. **Zukünftige Funktionen:** Das README nennt Schichtplanung, Warteschlangen-Management,
   Gutscheinverwaltung fürs Buffet und eine Lösung für andere Schulen. Sollen sie im FSD unter
   „Kann (später)“ stehen oder wegfallen?
4. **Sprache:** Die Besucher-Apps und Kiosks sind deutsch (du-Form), das Dashboard ist englisch.
   Ist das verbindlich?

## 2) Rollen und Berechtigungen

5. **Schüler:innen als Stop-Manager:** Stop-Manager stehen in einer eigenen Tabelle
   (`StopManagers`); eine Schülerin wird Stop-Managerin, indem sie zusätzlich dort eingetragen
   wird. Ist das so gewollt, und wer macht das (Admin über „Users & Data“)?
6. **Reichweite von Stop-Managern:** Stop-Manager können über die API **alle** Stationen lesen,
   alle Schüler:innen samt Zuteilungen, alle Stop-Manager und die Stationen anderer Stop-Manager,
   und `PUT /v1/stop-manager/stops` ändert **jede** Station (keine Prüfung, ob sie ihr/ihm gehört).
   Das Dashboard zeigt ihnen nur die eigenen. Bisher hieß es „keine Besitzprüfung nötig“. Soll das
   FSD sagen: **(a)** Stop-Manager dürfen nur eigene Stationen ändern (dann eine Lücke im
   Backend) oder **(b)** sie dürfen alle ändern, das Dashboard schränkt nur die Ansicht ein (wie Ist)?
7. **Was Stop-Manager ändern dürfen:** Ist: Name, Beschreibung, Raum, „Requested Infrastructure“
   und die Schüler:innen der Station (auch Bestätigen). Abteilungen, Gruppen und Stop-Manager nur
   Admins. Soll ein Stop-Manager auch den **Namen** der Station ändern dürfen? (Der Name „Buffet“
   entscheidet z. B. über den Kassa-Zugang, siehe Frage 13.)
8. **Abteilung anlegen:** `POST /v1/api/divisions` erlaubt auch Stop-Managern, eine Abteilung
   anzulegen; Ändern und Löschen dürfen nur Admins. Soll Anlegen auch nur für Admins sein?
9. `GET /v1/api/groups` (alle Gruppen, auch nicht öffentliche) ist für Stop-Manager offen, mit dem
   Kommentar „fix later to admin only“. Brauchen Stop-Manager das, oder nur Admins?
10. **Lehrer:innen ohne Rolle:** Wer weder Admin noch Stop-Manager ist, landet auf `/student`. Diese
    Seite braucht aber die LeoAuth-Rolle „Student“; eine Lehrkraft sieht dort nur einen Fehler.
    Was soll eine Lehrkraft ohne Rolle sehen?
11. **Erster Admin:** Admin ist nur, wer in der Tabelle `Admins` steht. Das Seeding aus
    `API/SETUP.md` ist auskommentiert, der erste Admin kommt also nur per SQL in die Datenbank.
    Reicht das (und gehört es in die Betriebsdoku), oder soll es wieder einen Seed-Weg geben?
12. **Admins verwalten:** Admins können andere Admins anlegen und entfernen, sich selbst aber nicht.
    Ein Admin wird nur über den Benutzernamen (`preferred_username`) angelegt; es wird nicht geprüft,
    ob es den Benutzer gibt. Reicht das?
13. **Kassa-Berechtigung:** Kassieren dürfen alle Lehrer:innen, alle Admins und Schüler:innen mit
    bestätigter Zuteilung zur Station, die genau „Buffet“ heißt. Das alte Backend kennt mehrere
    Buffets. Ist der fest eingebaute Stationsname so gewollt, und gilt die Berechtigung für alle
    Buffets?
14. **Testendpunkte:** `GET /v1/users/at-least-logged-in`, `/at-least-student`, `/everyone-allowed`
    und `/token-data` werden von keiner App gebraucht (soweit gefunden). Gehören sie ins FSD, oder
    werden sie entfernt?

## 3) Systemkontext und Betrieb

15. **Produktion:** Das Deployment auf `tadeot.htl-leonding.ac.at` ist „manuell“. Wie genau, und
    wer macht es? Welche App läuft dort unter `/registration`, `/kassa` und `/statistics`: die alte
    oder die neue (#79, #81, #83)?
16. **Altes Backend:** Anmeldung, Kassa und Statistik nutzen dauerhaft das alte Backend
    (`htl-leo-tadeot`), das nicht verändert werden darf. Bleibt das so, oder ist eine Übernahme ins
    eigene Backend geplant (dann „Kann (später)“)?
17. **Geräte:** Gibt es Vorgaben zu den Geräten: welche Tablets (iPad/Android) an Ein- und Ausgang
    und beim Buffet, welcher PC am Beamer, Mindestanforderungen an Besucher-Handys?
18. **Mehrere Kiosk-Geräte:** Wie viele Tablets laufen je Kiosk gleichzeitig? (Ist: alle
    Kiosks sind dafür gebaut, mehrere Geräte vertragen sich; die Kassa unterscheidet Geräte über
    die Kennung in der `orderNumber`.)

## 4) Fachliche Kernobjekte

19. **Station in mehreren Gruppen:** Eine Station kann mehreren Stationsgruppen zugeordnet sein
    (M:N, eigene Reihenfolge je Gruppe). Ist das gewollt, oder gehört eine Station zu genau einer
    Gruppe?
20. **Interne Stationen:** Stationen ohne öffentliche Gruppe (z. B. „Buffet“) erscheinen nicht in
    der GuideApp, können aber Schüler:innen und Stop-Manager haben. Ist „intern“ ein eigener
    Begriff, den das FSD so nennen soll?
21. **Beschreibung einer Station:** GuideApp und Schülerseite zeigen die Beschreibung als
    **Markdown** (HTML darin geht durch), das Dashboard hat ein einfaches Textfeld, ein Kommentar
    im Backend spricht von „HTML aus dem Rich-Text-Editor“. Höchstlänge 500 Zeichen. Ist Markdown
    das verbindliche Format, und reichen 500 Zeichen?
22. **„Requested Infrastructure“:** Feld der Station (bis 500 Zeichen), im Dashboard bearbeitbar
    und im Stations-CSV exportiert, sonst nirgends verwendet. Wofür ist es da, wer liest es?
23. **Stockwerk:** Die Spalte „Stock“ der Stationsplanung wird beim Import ignoriert; die GuideApp
    leitet das Stockwerk aus der Raumnummer ab (U/E/1). Reicht das?
24. **Abteilungen:** Sind die Abteilungen fest (HIF, HITM, HEL, HBG und dazu ALL/ORG), oder frei im
    Dashboard verwaltbar? Ist: im Dashboard frei verwaltbar, aber die GuideApp hat eine fest
    eingebaute Reihenfolge (HIF, HITM, HEL, HBG) und die Statistik fest eingebaute Farben.
25. **Abteilung der Schüler:innen:** `Student.Department` ist freier Text aus dem Import (z. B.
    „Medientechnik“) und nicht mit den Abteilungen verknüpft; der Filter im Dashboard übersetzt mit
    einer fest eingebauten Tabelle. Soll das verknüpft werden, oder bleibt es Text?
26. **Abteilungsbild:** nur PNG/JPG (Dashboard), wird immer als `image/png` ausgeliefert, keine
    Größenbegrenzung. Braucht es eine Vorgabe (Format, Größe)?

## 5) Tour und GuideApp

27. **Sichtbarkeit:** Nur ganze Gruppen sind öffentlich oder nicht; eine einzelne Station lässt
    sich nicht verstecken. Reicht das?
28. **Direktlinks / QR-Codes:** Ein direkter Link auf eine Station (`/tour/:gruppe/stop/:station`)
    führt ohne vorherigen Besuch auf die Startseite zurück. Sind QR-Codes an den Stationen
    geplant, und muss ein Direktlink dann funktionieren?
29. **Countdown:** Ist er eingeschaltet, zeigt die GuideApp **nur** die Countdown-Seite (auch das
    Feedback ist dann nicht erreichbar). Der Wert ist der Beginn des nächsten Tags der offenen
    Tür; das Ende ist fest 19:00 Uhr; ein zweiter Tag wird nicht angezeigt. Ist das so richtig?
30. **Fortschritt:** Der Fortschritt („gesehen“) liegt nur im Browser und geht beim Löschen der
    Browserdaten verloren; „Über uns“ setzt ihn zurück. Ist das so gewollt (keine Anmeldung, kein
    Sync)?
31. **Offline:** Die GuideApp zeigt bei fehlender Verbindung die zuletzt geladenen Daten. Ist
    Offline-Fähigkeit eine Anforderung für die GuideApp, oder nur ein Extra?

## 6) Zuteilung der Schüler:innen

32. **Herkunft der Anfragen:** Anfragen (Status PENDING) entstehen nur über den CSV-Import
    „Assignments“ (`Stop;Klasse;Nachname;Vorname;Abteilung`) oder von Hand im Dashboard. Woher
    kommt die Datei (z. B. Microsoft Forms)? Sollen sich Schüler:innen selbst im Dashboard für eine
    Station melden können?
33. **Zuordnung beim Import:** Der Import findet Schüler:innen über Klasse + Nachname + Vorname +
    Abteilung, nicht über den Benutzernamen. Zwei gleichnamige Personen in einer Klasse werden
    verwechselt. Ist das hinnehmbar?
34. **Import ganz oder gar nicht:** Ein einziger Fehler (Station oder Person nicht gefunden) bricht
    den ganzen Assignment-Import ab, der Student-Import überspringt dagegen bereits vorhandene. Ist
    das gewollt?
35. **Status DECLINED:** Das Dashboard legt keine abgelehnten Zuteilungen mehr an (Doppelte werden
    gelöscht), alte Zeilen gibt es noch. Soll DECLINED aus dem FSD (und später aus dem Modell)
    verschwinden?
36. **Einzelne Schüler:innen löschen:** Es gibt nur „Delete All Students“, kein Löschen einer
    einzelnen Person. Braucht es das?
37. **Sichtbarkeit für Schüler:innen:** Auf ihrer Seite sehen Schüler:innen Name, Klasse und
    Abteilung der anderen an derselben Station, auch bei noch offenen Anfragen. In Ordnung?
38. **Benachrichtigung:** Schüler:innen erfahren nur über das Dashboard, ob sie bestätigt wurden
    (keine E-Mail). Reicht das?

## 7) Import und Export

39. **Stationsplanung in Produktion:** Die Stationsplanung (`TdoT_Stationsplanung_*.csv`) wird nur
    beim Start im Development-Modus importiert oder mit `ImportConsoleApp`. Diese löscht die
    **ganze Datenbank** und legt sie ohne Migrationen an (spätere Migrationen schlagen dann fehl).
    Wie kommen die Stationen jedes Jahr in die Produktion? Braucht es einen Import im Dashboard?
40. **Schüler- und Lehrerlisten:** Woher kommen die echten Listen (Format
    `EdufsUsername;FirstName;LastName;StudentClass;Department` bzw. `EdufsUsername;FirstName;LastName`)?
    `Students.csv`/`Teachers.csv` im Repo sind Testdaten.
41. **`GET /v1/api/resetDB`:** nicht implementiert (wirft immer einen Fehler). Entfernen, oder
    implementieren (was soll es zurücksetzen)?
42. **CSV-Spaltennamen:** Stations- und Abteilungs-Export haben englische Spaltennamen, Schüler- und
    Stations-Schüler-Export deutsche. Vereinheitlichen, oder so lassen?

## 8) Feedback

43. **Quelle:** Feedback aus der GuideApp (Handy der Besucher:innen) und vom Feedback-Kiosk (Tablet
    am Ausgang) landet ununterscheidbar in derselben Tabelle. Soll die Quelle gespeichert werden?
44. **Prüfung am Server:** Das Backend prüft beim Absenden weder Pflichtfragen noch, ob eine Antwort
    zu den Optionen oder zum Bewertungsbereich passt; der Endpunkt ist ohne Login und ohne
    Mengenbegrenzung. Reicht die Prüfung in den Apps?
45. **Einmal pro Handy:** Die GuideApp merkt sich im Browser, dass schon Feedback gegeben wurde, und
    zeigt dann nur noch „Danke“. Ist „einmal pro Gerät“ eine Anforderung (sie lässt sich leicht
    umgehen) oder nur Komfort?
46. **Fragen ändern löscht Antworten:** Wird eine Frage entfernt oder ihr Typ geändert, werden ihre
    Antworten mitgelöscht (das Dashboard warnt vorher). In Ordnung?
47. **Kommas:** Mehrfachauswahl wird als „A, B“ gespeichert, Bewertungs-Beschriftungen
    kommagetrennt. Optionen oder Beschriftungen mit Komma zerfallen deshalb. Bisher entschieden:
    keine Migration. Soll der Konfigurator Kommas in Optionen verbieten?
48. **Bedingungen:** Eine Frage mit mehreren Bedingungen wird nur gezeigt, wenn **alle** erfüllt
    sind (UND); verglichen wird auf Gleichheit mit einem Wert. Reicht das?
49. **Aufbewahrung:** Wie lange bleibt Feedback gespeichert? Freitext kann personenbezogene Daten
    enthalten.

## 9) Kiosks

50. **Anmeldung, Geschlecht:** nur männlich/weiblich, weil das alte Backend ein `IsMale`-Feld hat.
    So ins FSD?
51. **Anmeldung, Postleitzahlen:** nur österreichische (Liste aus dem alten Backend), keine Eingabe
    für andere. So ins FSD?
52. **Anmeldung, Foto für den Roboterführerschein:** Das Foto liegt am alten Server als
    `Visitor_<Id>.png`. Wird eine Einwilligung eingeholt (wie, von wem bei Minderjährigen)? Wer
    löscht die Fotos und wann?
53. **Anmeldung ohne Warteschlange:** Speichern braucht eine Verbindung (keine Outbox wie bei
    Feedback und Kassa). Bleibt das so?
54. **Kassa, offener Endpunkt:** Nur der Bildschirm ist geschützt; `POST /api/orders` des alten
    Backends geht ohne Login. Ist das ein akzeptiertes Risiko?
55. **Kassa, Storno:** Ein abgeschlossener Verkauf lässt sich nicht rückgängig machen (das alte
    Backend hat keinen Endpunkt). So ins FSD?
56. **Statistik, Uhrzeit:** Das alte Backend liefert die Stunden um 1 h verschoben; das wurde so
    gelassen. Zeigt die Folie „Anmeldungen pro Stunde“ damit die richtige Uhrzeit, und soll das FSD
    die Verschiebung nennen?

## 10) Datenschutz und Sicherheit

57. **Aufbewahrung der Personendaten:** Wann werden Schüler:innen, Stop-Manager und Zuteilungen
    nach dem Tag der offenen Tür gelöscht (siehe auch Frage 1)?
58. **Rechtsrahmen:** Gibt es für die Besucherdaten (Anmeldung, Fotos) eine Vorgabe der Schule
    (DSGVO-Grundlage, Hinweis an die Besucher:innen), die ins FSD gehört?
59. **CORS:** In Produktion sind neben der echten Domain auch `localhost:4200/4300/5005` erlaubt.
    Gewollt (lokale Entwicklung gegen Staging), und gilt das auch für die Produktion?

## 11) Nicht-funktionale Anforderungen

60. **Mengen:** Gibt es Zahlen, die das FSD nennen soll (Besucher:innen pro Tag, gleichzeitige
    Handys, Zahl der Stationen und Schüler:innen)? Ohne Antwort nennt das FSD keine Zahlen.
61. **Verfügbarkeit:** Muss am Tag der offenen Tür jemand erreichbar sein, wenn ein Server ausfällt?
    Gibt es eine Vorgabe, oder „kein SLA“ wie bei franklyn?

## 12) Abnahme und Prioritäten

62. **Abnahme:** Was muss am Tag der offenen Tür mindestens funktionieren? Vorschlag:
    GuideApp mit Tour und Karte, Feedback (Handy und Kiosk), Anmeldung, Kassa, Statistik,
    Dashboard für Tourplanung und Zuteilung.
63. **Prioritäten:** Einverstanden, dass alles Gebaute „Muss“ ist und nur Lücken und die
    README-Ideen unter „Soll“/„Kann“ landen?

---

## Bereits entschieden (kommt so ins FSD, bitte nur widersprechen, wenn falsch)

- Doppelte oder konkurrierende Anfragen werden **gelöscht**, nicht abgelehnt.
- Eine Schülerin, ein Schüler kann für **höchstens eine** Station bestätigt sein (Backend
  prüft das, 400).
- Konflikt = mehr als eine nicht abgelehnte Anfrage. Farben: Approved grün, Pending türkis,
  Conflict orange.
- Abteilungsfarben werden nie überlagert oder getönt; Kontrast nur über die Textfarbe.
- Es gibt systemweit genau **eine** Tour; ihre Reihenfolge (Gruppen, dann Stationen je Gruppe)
  bestimmen die Admins.
- Feedback ist anonym; Besucher:innen brauchen kein Konto.
- Feedback-Kiosk und Kassa senden über eine Warteschlange am Gerät. Der Feedback-Kiosk verwirft
  400/409-Antworten, die Kassa verwirft nie etwas („nicht übertragbar“).
- Das alte Backend wird nicht verändert.
- CSV-Exporte: `;` getrennt, UTF-8 mit BOM (für Excel).

## Befunde ohne Entscheidungsbedarf (werden eigene Issues, nicht Teil des FSD)

- Der Backend-Start schreibt den Connection-String samt Passwort ins Log.
- Der Admin-Check vergleicht mit `ILIKE`; `_` oder `%` in einem Benutzernamen wirken als Platzhalter.
- Neue Stationsgruppen bekommen `Order = 0`, neue Stationen in einer Gruppe ebenfalls; mehrere
  Einträge mit derselben Position haben keine feste Reihenfolge, bis jemand im Dashboard umsortiert.
- `PUT /v1/api/stops` ändert die Gruppen einer Station nicht (nur beim Anlegen); das geht nur über
  die Gruppenseite.
- Der Abteilungs-CSV-Export heißt `stops-export.csv`.
- `PUT /v1/api/students/{id}` ignoriert die `id` in der URL.
- Keycloak: Audience wird nicht geprüft, `RequireHttpsMetadata = false`.
- `CLAUDE.md` nennt `StopGroup.Rank`; das Feld heißt `Order`. `TadeotTools_Dokumentation.md` nennt
  eine Tabelle `Teachers`/`TeacherAssignments`; sie heißen `StopManagers`/`StopManagerAssignments`.
