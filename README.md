> [!IMPORTANT]
> Das Pflichtenheft ist noch nicht vollständig

# TadeotTools

## Team-Mitglieder
- Luca Haas
- Andreas Huber
- Melanie Dohr

## 1. Ausgangslage

### 1.1. Ist-Situation
Es gab bereits ein Projekt zu den TadeoT-Tools. Darin kann man Auswahllisten konfigurieren und Besucherdaten als CSV exportieren und sich die Fotos der Besucher ansehen. 

Unter Anmeldung erfolgt die Besucheranmeldung.

Außerdem werden Statistiken anhand der Daten erstellt und übersichtlich als Powerpoint in verschiedenen Diagrammarten dargestellt.

Zudem gibt es eine Kassa-App und eine Darstellung der Erlöse, Produkte und des Kassastandes.

Man kann sich eine Feedback-Auswertung ansehen und alle Feedback-Antworten verwalten.

Dann gibt es noch eine Feedback-App, in der man als Besucher Feedback geben kann.

### 1.2. Verbesserungspotentiale

Das Design ist fragwürdig und viele Features noch nicht ganz ausgereift. Wir würden gerne das Projekt von Grund auf neu starten und somit ein sauberes Fundament schaffen.

## Zielsetzung

Im Generellen werden wir die gesamte UI überarbeiten.

Features, die schon existieren, deren genereller Aufbau aber Verbesserungspotential hat:
- Genereller Aufbau der Website (andere Sidebar, Links die teilweise nicht funktionieren)
- Kassa-App
- Buffet Statistiken 
- Buffet Verwaltung
- Administration Feedback

Neue Features:
- Stations- und Mitarbeiterverwaltung
- Erstellung + Export von Schichtplänen pro Station
- Feedback-Fragen-Konfigurator
- Mobile Version hinzufügen
- Version Upgrades & Refactoring im Frontend Angular und im Backend .NET auf jeweils möglichst neue Version

Noch unklar:
- Inwiefern? -> Warteschlangen-Management
- Aktueller Standpunkt? -> Historisierung (=> Archivierung der Daten von Vorjahren)
- Integration Schülys-Buffetgutscheinverwaltung -> möglich?

## User Stories
1. mehrere Stories für komplett neue UI (Ablauf aus Userperspektive) 
2. Stations- und Mitarbeiterverwaltung
3. Erstellung + Export von Schichtplänen pro Station

4. Feedback-Fragen-Konfigurator
   
  - Administrator kann Feedback-Fragen für den Tag der offenen Tür konfigurieren
  - Als ein: Administrator
  - Möchte ich: Einen Feedback-Fragen-Konfigurator für den Tag der offenen Tür erstellen
  - Damit: Besucher einfach Feedback zu ihrer Erfahrung geben und angeben können, ob sie sich vorstellen können, in Zukunft die Schule zu besuchen

  <strong>Akzeptanzkriterien:</strong>
  1.	Der Administrator kann Fragen erstellen, bei denen es mehrere Antwortoptionen gibt.
  2.	Die Fragen und Antworten werden in einer Datenbank abgespeichert.
  3.	Der Administrator kann auch Fragen bearbeiten und löschen.
  4.	Der Administrator erhält eine Ansicht über die aktuellen Fragen.

## Milestones



## Technologien
Frontend: 
- Angular mit Tailwind
- komplett neu aufsetzen
- neueste Angular Version verwenden

Backend:
- .NET auf neueste Version upgraden
- Große Teile übernehmen
