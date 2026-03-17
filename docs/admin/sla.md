# SLA-Management

SLA (Service Level Agreement) definiert verbindliche Reaktions- und Lösungszeiten für Tickets. Support-Engine überwacht SLAs automatisch und eskaliert bei Verstößen.

## SLA-Definitionen

**Navigation:** Administration → SLA → Neue SLA-Definition

Eine SLA-Definition legt fest, innerhalb welcher Zeit ein Ticket bearbeitet werden muss:

| Feld | Beschreibung |
|------|-------------|
| Name | Bezeichnung der SLA-Regel |
| Priorität | Für welche Ticket-Priorität gilt diese Regel |
| Reaktionszeit | Zeit bis zur ersten Antwort (in Stunden) |
| Lösungszeit | Zeit bis zur Schließung des Tickets (in Stunden) |
| Arbeitszeiten | Ob Zeiten nur innerhalb der Geschäftszeiten zählen |

## Eskalationsstufen

Jede SLA-Definition kann mehrere Eskalationsstufen haben. Eine Eskalation wird ausgelöst, wenn ein Schwellenwert überschritten wird:

| Feld | Beschreibung |
|------|-------------|
| Schwellenwert | Prozentsatz der SLA-Zeit (z.B. 80 = bei 80% der Zeit) |
| Aktion | `notify_agent`, `notify_admin`, `change_priority`, `reassign` |
| Ziel | Betroffen: Agent, Admin oder Gruppe |

**Beispiel:** SLA für "Hoch"-Tickets: Reaktionszeit 4h, Lösungszeit 24h
- Bei 75% (3h ohne Reaktion) → Agent benachrichtigen
- Bei 90% (21,6h ohne Lösung) → Admin benachrichtigen + Priorität erhöhen

## SLA-Tracking

Das SLA-Tracking wird automatisch gestartet, wenn ein Ticket erstellt wird. Die SLA-Engine prüft alle 5 Minuten im Hintergrund:

- Welche Tickets haben ihre SLA-Zeit überschritten?
- Welche Eskalationsschwellen wurden erreicht?
- Wurden Reaktionszeiten eingehalten?

### SLA-Status-Felder in Tickets

| Feld | Bedeutung |
|------|----------|
| `slaFirstResponseAt` | Zeitpunkt der ersten Reaktion |
| `slaResolvedAt` | Zeitpunkt der Lösung |
| `slaBreached` | `true` wenn SLA verletzt wurde |
| `slaBreachedAt` | Zeitpunkt der SLA-Verletzung |

## SLA-Compliance-Berichte

Unter **Berichte → SLA-Performance** sind folgende Metriken verfügbar:

- SLA-Compliance-Rate (in %)
- Durchschnittliche Reaktionszeit
- Durchschnittliche Lösungszeit
- Tagesgenaue Aufschlüsselung mit Farbkodierung (grün/gelb/rot)

## Best Practices

- Definieren Sie SLA-Regeln für jede Prioritätsstufe (kritisch, hoch, mittel, niedrig)
- Setzen Sie Eskalationsschwellen bei 75% und 90% der Lösungszeit
- Verwenden Sie Arbeitszeiten-Einschränkung für Teams ohne 24/7-Bereitschaft
- Prüfen Sie die SLA-Berichte wöchentlich, um Trends frühzeitig zu erkennen
