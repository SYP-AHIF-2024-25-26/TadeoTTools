# Fragen zur Spezifikation von TadeoTTools

1. **Jahreswechsel:** In einer künftigen Erweiterung sollen mehrere Schuljahre geplant werden können. Veranstaltungen von Vorjahren sind als abgeschlossen im Lese-Modus zugänglich, nur aktuelle Veranstaltungen sind editierbar. Man kann auch pro Schuljahr mehrere Veranstaltungen für dieselben Schüler planen. Derzeit soll das System weiterhin nur eine Veranstaltung unterstützen.

2. **Zwei Tage:** Seit 2026 ist der Der Tag der offenen Tür nur mehr einen Tag lang. Es soll aber möglich sein eine Veranstaltung für mehrere Tage zu planen, wobei alle Zuordnungen automatisch für alle Tage gültig sind. Nur die Statistik muss unterschiedliche Tage auswerten können.
3. **Zukünftige Funktionen:** im FSD unter
   „Kann (später)“
4. **Sprache:** Wie ist

## 2) Rollen und Berechtigungen

5. **Schüler:innen als Stop-Manager:** Ist so gewollt und admin macht das in Users & Data
6. **Reichweite von Stop-Managern:** Wie ist aber: **(a)** Stop-Manager dürfen nur eigene Stationen ändern (ist eine Lücke im Backend)
7. **Was Stop-Manager ändern dürfen:** Wie ist, stop manager dürfen auch den Namen ändern.
8. **Abteilung anlegen:** Wie ist, aber ändern dürfen auch nur admins.
9. Gruppen sehen alle bzw die guide app. bearbeiten nur admins.
10. **Lehrer:innen ohne Rolle:** dazu müsste eine neue Seite designed werden, in der nur die öffentlichen stop groups mit den zugehörigen stations angezeigt werden. Also eine Vorschau auf die guide app. Diese Seite können alle Rollen sehen, auch students. Daher muss auch eine neue Navigation für Schüler überlegt werden (TODO)
11. **Erster Admin:** Der ldap user sysadmin soll immer automatisch geseeded werden. Bessere wäre eine .env config, in der der erste Admin definiert ist.
12. **Admins verwalten:** Es muss verhindert werden, dass alle admins gelöscht werden. Es muss immer mindestens ein Admin übrig bleiben.
13. **Kassa-Berechtigung:** In einer künftigen Erweiterung soll es konfigurierbar sein, welche Stationen berechtigt sind, Kassa-Artikel zu verkaufen. Dann könnte man zb. auch der Infrastruktur-Station diese Berechtigung geben, nicht nur dem hardcodierten Buffet.
14. **Testendpunkte:** Sollen bleiben

## 3) Systemkontext und Betrieb

15. **Produktion:** Das Deployment auf `tadeot.htl-leonding.ac.at` ist „manuell“, genau wie auf vm45 aber anderer domain. Es laufen dort alle neuen Kiosk-Apps - gleiches compose file wie vm45.
16. **Altes Backend:** Das alte Backend sowie dessen alte Administrationsseite sollen in die bestehenden TadeotTools migriert werden, aber erst nach dem diesjährigen Tag der offenen Tür am 20.11.26.
17. **Geräte:** Es sind nur Android Tablets verschiedener Generationen und verschiedenen Auflösungen für die Kiosk-apps in Verwendung, an Besucher-Handies werden keine Anforderungen gestellt.
18. **Mehrere Kiosk-Geräte:** Registration und Feedback-Kiosk laufen gemeinsam auf einem tablet, Kassa jeweils nur auf einem Tablet. Es muss aber möglich sein alle kiosk apps auf einem einzigen Tablet zu installieren.

## 4) Fachliche Kernobjekte

19. **Station in mehreren Gruppen:** Wie ist.
20. **Interne Stationen:** wie ist und ja.
21. **Beschreibung einer Station:** Markdown ist verbindlich, und derzeit kann man im Dashboard nur maximal 255 Zeichen eingeben was zu wenig ist. 500 Zeichen ist aber das absolute Maximum weil der Beschreibungstext in der Guide App gut überschaubar bleiben soll.
22. **„Requested Infrastructure“:** Admins brauchen dieses Feld um die Infrastruktur-Wünsche der Stationen zu analysieren und zu überprüfen, ob die Wünsche verfügbar sind oder nicht. Eine zusätzliche Page wo nur die Infrastruktur-Wünsche pro Station mit Raumnummer gezeigt werden und ein admin diese als "verfügbar" sowie als "erledigt" markieren kann. Aber einer konfigurierbaren deadline dürfen stop manager das Feld nicht mehr editieren, aber sie können sehen ob die wünsche verfügbar bzw. erledigt sind.

23. **Stockwerk:** wie ist
24. **Abteilungen:** Wie ist.
25. **Abteilung der Schüler:innen:** Ja, soll verknüpft werden. Jedoch ergibt sich die Abteilung eines students aus dessen Klassenname (enthält HIF, HITM, HEL | FEL, HBG), d.h. der Import kann den Abteilungsnamen ignorieren und soll sich nur auf die Klasse beziehen. Die Abteilung wird dann automatisch aus der Klasse abgeleitet.

26. **Abteilungsbild:** wie ist.

## 5) Tour und GuideApp

27. **Sichtbarkeit:** Wie ist.
28. **Direktlinks / QR-Codes:** Das wäre cool wenn das in zukunft eingebaut wird (QR-Code)
29. **Countdown:** wie ist
30. **Fortschritt:** wie ist
31. **Offline:** nur ein extra

## 6) Zuteilung der Schüler:innen

32. **Herkunft der Anfragen:** Der Import von schülern mit assignment wäre nur als restore point gedacht. d.h. man könnte die aktuellen zuordnungen auf csv exportieren und damit sichern. bei einem neuhosting der anwendung könnten diese altdaten dann importiert und wiederhergestellt werden. Grundsätzlich entstehen assignments aber ausschließlich über das UI durch Requests von StopResponsibles (manuell).
33. **Zuordnung beim Import:** Nein, der benutzername soll immer der unique schlüssel sein.
    Es kann in verschiedenen Klassen gleichnamige Schüler geben.
34. **Import ganz oder gar nicht:** Gehört mit 32 gemeinsam behandelt und muss noch geklärt werden. Eher nicht abbrechen sondern wie bei student überspringen.
35. **Status DECLINED:** declined soll verschwinden.
36. **Einzelne Schüler:innen löschen:** wie ist.
37. **Sichtbarkeit für Schüler:innen:** wie ist.
38. **Benachrichtigung:** Künftig sollen Email-Notifikationen eingebaut werden, damit die Schülerinnen über alle Request-Änderungen informiert werden. Derzeit ist das nicht implementiert, und es gibt keine Benachrichtigung. Die Schüler:innen müssen sich selbstständig einloggen und die Änderungen prüfen.

## 7) Import und Export

39. **Stationsplanung in Produktion:** Die Stationen werden von Jahr zu Jahr übernommen und in einem neuen Jahr manuell im Dashboard überarbeitet. Export und Import wäre nur zur Datensicherstellung und -wiederherstellung notwendig.
40. **Schüler- und Lehrerlisten:** Schülerdaten müssen jedes Jahr aus Sokrates manuell exportiert werden. Lehrerlisten ändern sich sehr selten, diese bleiben im echtsystem erhalten.
41. **`GET /v1/api/resetDB`:** entfernen.
42. **CSV-Spaltennamen:** vereinheitlichen

## 8) Feedback

43. **Quelle:** Ja, es soll künftig unterscheidbar sein.
44. **Prüfung am Server:** wie ist
45. **Einmal pro Handy:** wie ist.
46. **Fragen ändern löscht Antworten:** OK.
47. **Kommas:** wie ist
48. **Bedingungen:** ja
49. **Aufbewahrung:** manuelle löschung wie bisher.

## 9) Kiosks

50. **Anmeldung, Geschlecht:** es sol auch "keine angabe" möglich sein. dazu muss aber das alte backend migriert und modifiziert sein.
51. **Anmeldung, Postleitzahlen:** Ja. sicherstellen dass die PLZ liste aktuell ist.
52. **Anmeldung, Foto für den Roboterführerschein:** Einwilligung wird im Rahmen des Registration-Kiosk eingeholt, Fotos werden im alten Admin-Dashboard über einen Button manuell gelöscht.
53. **Anmeldung ohne Warteschlange:** wie ist
54. **Kassa, offener Endpunkt:** Nein, muss bei der Migration des alten admin backends gefixt werden.
55. **Kassa, Storno:** wie ist.
56. **Statistik, Uhrzeit:** Es muss sichergestellt werden dass die Zeitzone korrekt behandelt wird.

## 10) Datenschutz und Sicherheit

57. **Aufbewahrung der Personendaten:** Stop-Manager werden gar nicht gelöscht, außer es werden die Schüler, die StopManager sind, gelöscht. SchülerInnen werden von admins zu einem frei wählbaren Zeitpunkt gelöscht, spätestens im neuen Schuljahr wenn die Planung des neuen Tags der Offenen Tür ansteht.
58. **Rechtsrahmen:** DSGVO
59. **CORS:** wie ist, damit man lokale frontends gegen das Testsystem (vm45) testen kann. Aufdem Produktivsystem (tadeot.htl-leonding.ac.at) darf das nicht möglich sein, da die docker images und das repo public sind und jeder ein frontend auf localhost starten kann.

## 11) Nicht-funktionale Anforderungen

60. **Mengen:** wie ist
61. **Verfügbarkeit:** kein sla

## 12) Abnahme und Prioritäten

62. **Abnahme:**
    GuideApp mit Tour und Karte, Feedback (Handy und Kiosk), Anmeldung, Kassa, Statistik,
    Dashboard für Tourplanung und Zuteilung. altes backend und admin nach der migration ebenfalls.
63. **Prioritäten:** ja

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
