# System-Logging

Support-Engine verwendet einen strukturierten Logger (Winston) mit automatischer Dateirotation. Logs sind über die Administrationsoberfläche und als Dateien zugänglich.

## Log-Ebenen

| Ebene | Priorität | Beschreibung |
|-------|-----------|-------------|
| `error` | 0 (höchste) | Fehler, die Aktionen verhindern |
| `security` | 1 | Sicherheitsrelevante Ereignisse |
| `performance` | 2 | Performance-Metriken |
| `warn` | 3 | Warnungen (keine Aktionsblockierung) |
| `info` | 4 | Normale Betriebsereignisse |
| `debug` | 5 (niedrigste) | Detaillierte Debugging-Infos |

Standard-Ebene in Produktion: `info` (konfigurierbar über `LOG_LEVEL`-Umgebungsvariable)

## Log-Quellen

Jeder Log-Eintrag enthält eine Quellenangabe:

| Quelle | Beschreibung |
|--------|-------------|
| `api` | HTTP-API-Anfragen |
| `auth` | Authentifizierung / Anmeldung |
| `authorization` | Berechtigungsprüfungen |
| `ticket` | Ticketoperationen |
| `sla` | SLA-Engine |
| `crm` | CRM-Operationen |
| `email` | E-Mail-Verarbeitung |
| `exchange` | Microsoft Exchange Sync |
| `database` | Datenbankoperationen |
| `background` | Hintergrundaufgaben |
| `system` | Systemereignisse |

## Log-Struktur

Jeder Eintrag enthält:

```json
{
  "timestamp": "2026-03-17T10:00:00.000Z",
  "level": "info",
  "source": "ticket",
  "entityType": "ticket",
  "entityId": "abc123",
  "tenantId": "tenant-id",
  "userId": "user-id",
  "title": "Ticket erstellt",
  "description": "Ticket #1042 wurde erfolgreich angelegt",
  "error": null,
  "metadata": {}
}
```

Fehler-Einträge enthalten zusätzlich:
- `error.description` — Was ist passiert
- `error.cause` — Warum ist es passiert
- `error.solution` — Vorgeschlagene Lösung

## Datenschutz

Der Logger maskiert automatisch sensible Daten:
- Passwörter → `[MASKIERT]`
- API-Keys → `[MASKIERT]`
- Bearer-Token → `[MASKIERT]`
- E-Mail-Adressen → teilweise maskiert (z.B. `jo***@example.com`)

## Administrationsoberfläche

**Navigation:** Administration → System-Logs

Die Log-Anzeige zeigt die letzten **1000 Einträge** aus dem In-Memory-Puffer. Filteroptionen:

- Ebene (level)
- Quelle (source)
- Entity-Typ / Entity-ID
- Benutzer-ID
- Zeitraum (Start- / Enddatum)
- Freitextsuche in Titel und Beschreibung

## Log-Dateien

Logs werden täglich rotiert und im Verzeichnis `logs/` gespeichert:

| Datei | Inhalt |
|-------|--------|
| `support-engine-YYYY-MM-DD.log` | Alle Logs |
| `security-YYYY-MM-DD.log` | Nur Security-Logs |
| `performance-YYYY-MM-DD.log` | Nur Performance-Logs |

### Aufbewahrung

| Parameter | Wert |
|-----------|------|
| Maximale Dateigröße | 2 GB pro Datei |
| Aufbewahrungsdauer | 7 Tage |
| Komprimierung | Ältere Dateien werden als `.log.gz` komprimiert |
| Security-/Performance-Dateien | 500 MB max, 7 Tage |

### Log-Dateien herunterladen

**Navigation:** Administration → System-Logs → Dateien

Verfügbare Dateien können direkt über die Oberfläche heruntergeladen werden.

## Log-Export

Gefilterte Logs können als Datei exportiert werden:

```text
GET /api/logs/export
```

Mit denselben Filterparametern wie die Log-Anzeige.

## Test-Log erstellen

Für Diagnosezwecke kann ein Test-Log-Eintrag erstellt werden:

**Navigation:** Administration → System-Logs → Test-Eintrag erstellen

Dieser Eintrag erscheint sofort in der Log-Anzeige und in der Log-Datei.
