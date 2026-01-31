# SLA-Management

Service Level Agreements (SLAs) definieren Reaktions- und Lösungszeiten für Tickets.

## Konzept

SLAs werden pro **Prioritätsstufe** definiert und regeln:

- **Reaktionszeit**: Maximale Zeit bis zur ersten Antwort
- **Lösungszeit**: Maximale Zeit bis zur Problemlösung

## SLA-Definitionen

### Standard-SLAs

| Priorität | Reaktionszeit | Lösungszeit |
|-----------|---------------|-------------|
| **Dringend** | 1 Stunde | 4 Stunden |
| **Hoch** | 4 Stunden | 8 Stunden |
| **Mittel** | 8 Stunden | 24 Stunden |
| **Niedrig** | 24 Stunden | 72 Stunden |

### SLA konfigurieren

1. Navigieren Sie zu **Einstellungen > SLA**
2. Wählen Sie die Prioritätsstufe
3. Definieren Sie:
   - Reaktionszeit (Stunden)
   - Lösungszeit (Stunden)
4. Speichern Sie die Einstellungen

## SLA-Status

Der SLA-Status wird visuell angezeigt:

| Status | Farbe | Bedeutung |
|--------|-------|-----------|
| **OK** | Grün | Innerhalb der Zeit |
| **Warnung** | Gelb | 75% der Zeit verbraucht |
| **Verletzt** | Rot | SLA überschritten |

## Eskalationsregeln

Bei SLA-Verletzung können automatische Aktionen ausgelöst werden:

1. **Benachrichtigung**: E-Mail an Vorgesetzten
2. **Priorität erhöhen**: Automatische Hochstufung
3. **Neuzuweisung**: Ticket an anderen Agent

### Eskalation einrichten

1. Gehen Sie zu **Einstellungen > Eskalation**
2. Erstellen Sie eine neue Regel:
   - **Auslöser**: Reaktion/Lösung überschritten
   - **Aktion**: Benachrichtigen/Eskalieren
   - **Empfänger**: Agent/Gruppe/Admin

## Berichte

SLA-Berichte zeigen:

- Einhaltungsquote pro Priorität
- Durchschnittliche Reaktions-/Lösungszeiten
- Trends über Zeit
- Verletzungen pro Agent/Kunde
