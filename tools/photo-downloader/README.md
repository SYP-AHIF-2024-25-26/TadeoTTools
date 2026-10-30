# PhotoDownloader

Lädt die Fotos der Besucher:innen für den Roboterführerschein auf den PC einer Station: in den
Ordner `images` neben dem Programm, als `Visitor_0001.png` (die Nummer ist die Besuchernummer, die
die Anmeldung anzeigt). Schon vorhandene Fotos werden übersprungen, das Programm kann also beliebig
oft gestartet werden.

Ersetzt den alten PhotoDownloader (`tadeot-backend/PhotoDownloader` im Repository `htl-leo-tadeot`).
Bis 20.11.2026 bleibt die alte `.exe` an den Stationen daneben liegen, für den Fall, dass die
Anmeldung auf das alte Backend zurückfällt.

## Verwendung

```text
PhotoDownloader.exe                     Produktion (https://tadeot.htl-leonding.ac.at/tadeot-backend-201126)
PhotoDownloader.exe <Backend-URL>       z. B. https://vm45.htl-leonding.ac.at/tadeot-backend-201126
```

Statt des Arguments geht auch die Umgebungsvariable `TADEOT_BACKEND_URL`. Am Ende wartet das
Programm auf einen Tastendruck, damit das Fenster nach einem Doppelklick offen bleibt.

Verwendete Endpunkte (ohne Login, die Fotos sind absichtlich über die Besuchernummer abrufbar):
`GET /v1/visitor-photos` (Liste der Dateinamen) und `GET /v1/visitor-photos/<Dateiname>`.

## Bauen

```bash
dotnet run -- https://vm45.htl-leonding.ac.at/tadeot-backend-201126   # zum Ausprobieren
dotnet publish -c Release                                             # eine .exe (win-x86, ohne .NET)
```

Die `.exe` liegt danach in `bin/Release/net10.0/win-x86/publish/`. Sie läuft auf 32- und
64-Bit-Windows und braucht kein installiertes .NET.
