# Zeiterfassung

Support-Engine enthält ein integriertes Zeiterfassungssystem. Agenten können Zeit pro Ticket erfassen — entweder mit einem laufenden Timer oder manuell.

## Zeiterfassung über Timer

Im Ticket-Detail → Zeiterfassung:

1. **Timer starten**: Klick auf „Timer starten" — die Uhr läuft im Hintergrund
2. **Pausieren**: Klick auf „Pausieren" (z.B. bei Unterbrechungen)
3. **Fortsetzen**: Klick auf „Fortsetzen"
4. **Stoppen**: Klick auf „Stoppen" — ein Zeiteintrag wird angelegt

Der aktive Timer bleibt sichtbar, auch wenn Sie zu anderen Tickets navigieren. In der Navigation oben rechts zeigt eine Anzeige laufende Timer an.

## Manueller Zeiteintrag

Für bereits geleistete Arbeit ohne Timer:

1. Im Ticket-Detail → Zeiterfassung → **Zeit hinzufügen**
2. Dauer in Stunden und Minuten eingeben
3. Beschreibung der Tätigkeit (optional)
4. Datum der Leistung

## Zeiterfassungs-Übersicht

**Navigation:** Zeiterfassung

Die Übersicht zeigt alle Zeiteinträge des Mandanten:

| Filter | Optionen |
|--------|---------|
| Agent | Alle oder bestimmter Benutzer |
| Ticket | Alle oder bestimmtes Ticket |
| Zeitraum | Datumsbereich |

### Spalten

| Spalte | Beschreibung |
|--------|-------------|
| Datum | Datum des Eintrags |
| Agent | Bearbeitender Benutzer |
| Ticket | Verknüpftes Ticket (mit Link) |
| Dauer | Erfasste Zeit |
| Beschreibung | Tätigkeitsbeschreibung |
| Abrechenbar | Ob die Zeit abrechenbar ist |

## Berichte

Detaillierte Auswertungen sind unter **Berichte → Zeiterfassung** verfügbar:

- Gesamte erfasste Zeit pro Agent
- Aufschlüsselung nach Ticket und Zeitraum
- Abrechenbare vs. nicht abrechenbare Zeit
- Export als CSV, XLSX, PDF oder HTML

## Zeiteintrag bearbeiten / löschen

Eigene Zeiteinträge können nachträglich bearbeitet oder gelöscht werden. Admins können alle Einträge bearbeiten.
