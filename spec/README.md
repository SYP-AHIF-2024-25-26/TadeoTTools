# spec/ – Spezifikation von TadeoTTools

Dieser Ordner hält die fachliche Spezifikation und die Anleitung, wie daraus OpenSpec aufgesetzt
wird. Er ist so geschrieben, dass eine neue Sitzung (Mensch oder Claude Code) ohne Vorwissen
weitermachen kann.

| Datei | Inhalt |
|---|---|
| `fsd.md` | Das FSD: vereinbartes Verhalten des ganzen Systems, §1–19 wie bei [franklyn](https://github.com/2526-4ahitm-itp/2526-4ahitm-franklyn). Beschreibt den **Ist-Stand**; noch nicht Gebautes ist mit **(Lücke)** markiert und in §18 (Soll/Kann) gelistet, Ungeklärtes in §19. |
| `questions.md` | Die Fragen, die beim Lesen des Codes offen waren (nummeriert), mit dem jeweiligen Ist-Verhalten. |
| `answers.md` | Die Antworten dazu, gleiche Nummern. Begründung für jede Aussage im FSD. |

Herkunft: Issue #93 (FSD), die Befunde ohne Entscheidungsbedarf wurden die Issues #94–#101.

---

## 1. Stand und Entscheidung zum Zeitpunkt

- Das FSD ist fertig und auf `main` (`1305bd8`). `CLAUDE.md` verweist darauf.
- OpenSpec ist **noch nicht** eingerichtet. Empfehlung: bis zum Tag der offenen Tür am
  **20.11.2026** ohne OpenSpec arbeiten (Fixes als Issues), OpenSpec danach einführen, spätestens
  mit der Migration des alten Backends (FSD §3.4). Dort lohnt sich der Proposal-Schritt am meisten.
- Bis OpenSpec steht, gilt die schlanke Regel aus `CLAUDE.md`: Wer eine Lücke schließt, entfernt
  ihren **(Lücke)**-Vermerk im FSD und passt §18 im selben Commit an.

---

## 2. OpenSpec aufsetzen (Anleitung für die Folgesitzung)

Ziel ist derselbe Aufbau wie bei franklyn: `openspec/config.yaml`, eine Spec pro Capability unter
`openspec/specs/<capability>/spec.md`, und für jede Capability ein archivierter Change
`spec-<capability>`, damit die Historie sauber beginnt.

### 2.1 Vorbereitung

1. Issue anlegen („OpenSpec setup from the FSD“), Branch davon abzweigen (`<nr>-openspec`).
2. Franklyns Dateien als Vorlage lesen, nicht aus dem Gedächtnis nachbauen:
   `openspec/config.yaml`, ein Beispiel unter `openspec/specs/*/spec.md` und einen Eintrag unter
   `openspec/changes/archive/`. Format der Statuszeile und der Szenarien genau übernehmen.
3. CLI installieren (ist lokal noch nicht vorhanden): `npm i -g @fission-ai/openspec`,
   Version mit `openspec --version` prüfen.

### 2.2 Initialisieren

1. Im Repo-Root `openspec init` ausführen und Claude Code als Werkzeug wählen. Das erzeugt
   `openspec/` sowie die Befehle und Skills unter `.claude/` (`/opsx:explore`, `/opsx:propose`,
   `/opsx:apply`, `/opsx:archive`).
2. Achtung: `.claude/` ist lokal und wird bisher **nicht** committet. Entscheiden, ob die
   erzeugten OpenSpec-Befehle mitkommen (bei franklyn sind sie im Repo); falls ja, nur diese
   Dateien gezielt hinzufügen, nicht den ganzen Ordner.

### 2.3 `openspec/config.yaml`

```yaml
schema: spec-driven

context: |
  TadeoTTools organisiert den Tag der offenen Tür der HTL Leonding.
  Fachliche Grundlage ist spec/fsd.md (Deutsch); Specs und Proposals zitieren es als "FSD §N.M".
  Stack: .NET 10 Minimal API + EF Core + PostgreSQL (backend/), Angular zoneless
  (dashboard/, guide/, kiosk/feedback/, kiosk/statistics/ und kiosk/registration/ auf Angular 22, kiosk/cashier/ noch auf 19).
  Login über Keycloak (LeoAuth); Rollen kommen aus den Tabellen
  Admins und StopManagers, nicht aus dem Token.
  Das alte Backend htl-leo-tadeot ist abgelöst (Anmeldung, Kassa und Statistik laufen über
  backend/); es bleibt bis nach dem TdoT (20.11.2026) unverändert als Rückfall.
  Projektregeln stehen in CLAUDE.md, das visuelle System in DESIGN.md.

rules:
  proposal:
    - Jedes Proposal nennt die FSD-Stellen (§N.M), die es umsetzt oder ändert.
    - Ein Proposal betrifft genau eine Capability; mehr nur mit Begründung.
  specs:
    - Eine Capability pro Spec.
    - Jede Anforderung hat eine Statuszeile mit implemented, partial oder not-implemented.
    - Jede Anforderung hat mindestens ein Szenario (WHEN/THEN).
  tasks:
    - Jede Aufgabe ist mit [GAP] (schließt eine Lücke gegenüber der Spec) oder [SPEC] (ändert nur die Spec) markiert.
    - Die letzte Aufgabe aktualisiert den (Lücke)-Vermerk und §18 in spec/fsd.md.
```

Abgleichen mit franklyns Datei (Schlüsselnamen, Struktur der `rules`), dann `openspec validate`.

### 2.4 Capabilities und ihre FSD-Abschnitte

| Capability | FSD | Enthält Lücken |
|---|---|---|
| `auth-roles` | §2, §5 | Stop-Manager nur eigene Stationen, erster Admin per `.env`, Vorschau-Seite |
| `stops-tour` | §4.1–4.3, §7 | Beschreibung bis 500 Zeichen im Dashboard |
| `divisions` | §4.4 | Anlegen nur für Admins |
| `student-assignments` | §4.5, §4.7, §8 | Abteilung aus Klasse, DECLINED entfernen |
| `stop-managers` | §4.6 | – |
| `infrastructure-requests` | §7.1 | Infrastruktur-Seite mit Deadline (ganz neu) |
| `data-import-export` | §10 | Import über Benutzernamen, Zeilen überspringen, `resetDB` weg, Spaltennamen |
| `feedback-questionnaire` | §9 | Feedback-Quelle speichern |
| `feature-flags` | §4.8, §6.4 | – |
| `guide-app` | §6 | – (QR-Codes sind „Kann“) |
| `feedback-kiosk` | §11.1 | – |
| `cashier` | §11.2 | konfigurierbare Kassa-Stationen, Login für `POST /api/orders` (Migration) |
| `visitor-registration` | §11.3 | Geschlecht „keine Angabe“ (Migration) |
| `visitor-statistics` | §11.4 | Zeitzone |
| `deployment` | §3, §13.3 | kein `localhost` in CORS der Produktion |

### 2.5 Specs erzeugen

Pro Capability:

1. Die genannten FSD-Abschnitte lesen und **gegen den Code prüfen** (das FSD ist vom
   2026-10-21; seither geschlossene Lücken stehen in der Git-Historie und in den Issues).
2. `/opsx:propose spec-<capability>`: Proposal „Bestehendes Verhalten als Spec erfassen“, Spec
   mit den Anforderungen samt Status und Szenarien, Aufgaben nur `[SPEC]`.
3. Statusregel: ohne **(Lücke)** im FSD → `implemented`; Lücke, die teilweise gebaut ist →
   `partial`; Lücke ohne Code → `not-implemented`.
4. `openspec validate spec-<capability>`, dann `/opsx:archive spec-<capability>`. Damit landet
   die Spec unter `openspec/specs/<capability>/`.

Ein Commit pro Capability. Zum Schluss `openspec list --specs` prüfen und in `CLAUDE.md` ergänzen,
dass `openspec/specs/` ab jetzt die maßgebliche Quelle je Capability ist und `spec/fsd.md` der
Überblick bleibt.

---

## 3. Workflow danach: ein Feature umsetzen

### 3.1 Welcher Weg?

| Art der Änderung | Weg |
|---|---|
| Bugfix ohne Verhaltensänderung (z. B. #94, #98) | Issue → Branch → Commit, kein OpenSpec. |
| Lücke aus der Spec schließen, neues Feature, geändertes Verhalten | OpenSpec-Change (unten). |
| Nur Doku oder Design | Issue → Commit; `DESIGN.md` über `/impeccable document`. |

### 3.2 Der Ablauf eines Changes

1. **Issue** anlegen; es beschreibt das Ziel und verweist auf FSD-Stelle und Capability.
   Branch `<issue-nr>-<kurzname>` von `origin/main` (vorher `git fetch`).
2. **`/opsx:explore`** (optional, bei offenen Fragen): Code und Spec lesen, Varianten
   besprechen, offene Punkte aus FSD §19 klären. Noch nichts schreiben.
3. **`/opsx:propose <change-name>`**: erzeugt unter `openspec/changes/<change-name>/`
   - `proposal.md`: Warum, was ändert sich, welche FSD-Stellen;
   - `design.md` (bei größeren Changes): Entscheidungen, Alternativen, Risiken;
   - `specs/<capability>/spec.md`: Delta der Spec (`ADDED` / `MODIFIED` / `REMOVED Requirements`),
     neue Statuszeilen;
   - `tasks.md`: Checkliste, jede Aufgabe `[GAP]` oder `[SPEC]`.

   Proposal **lesen und freigeben**, bevor Code entsteht. Danach `openspec validate <change-name>`.
4. **`/opsx:apply <change-name>`**: Aufgaben der Reihe nach umsetzen und abhaken. Regeln aus
   `CLAUDE.md` gelten (Angular-Code-Regeln, Endpoint-Filter lesen Argumente nach Position,
   Env-Dateien nicht committen). Tests bzw. Build laufen lassen; UI-Änderungen bei Bedarf mit
   `/impeccable` prüfen.
5. **FSD nachziehen**: (Lücke)-Vermerk entfernen, §18 anpassen; bei neuem Verhalten den
   passenden Abschnitt ergänzen. Das ist die letzte Aufgabe in `tasks.md`.
6. **`/opsx:archive <change-name>`**: übernimmt das Delta in `openspec/specs/<capability>/` und
   verschiebt den Change nach `openspec/changes/archive/`.
7. **Abschluss**: Commit(s) mit `(#<issue>)` im Titel, auf `main` bringen, Issue mit Verweis
   auf den Commit schließen. Gearbeitet wird allein, ein PR ist nicht nötig.

### 3.3 Regeln, die man leicht vergisst

- Committen und pushen nur auf ausdrücklichen Wunsch.
- Nie committen: `*/environment.development.ts`, `backend/Database/Entities/ClassDiagram*.cd`,
  `deployment/vm45/` (enthält `.env`), `.claude/` (außer bewusst gewählten OpenSpec-Dateien),
  `shape-*.md`, `.impeccable/*` außer `design.json`.
- Nie gegen die Live-API des alten Backends schreiben (die Dev-Umgebung zeigt auf Produktion).
- Das alte Backend bleibt unverändert; Lücken, die daran hängen, sind „mit Migration“ markiert.
- Issue-Text muss zum tatsächlich Erledigten passen; Offenes wandert in ein Folge-Issue.
