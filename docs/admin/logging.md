# Logging und Monitoring

Support-Engine bietet umfangreiche Logging-Funktionen für Überwachung und Fehleranalyse.

## Log-Level

| Level | Beschreibung | Beispiel |
|-------|--------------|----------|
| **ERROR** | Kritische Fehler | Datenbankverbindung fehlgeschlagen |
| **WARN** | Warnungen | SLA-Verletzung droht |
| **INFO** | Informationen | Benutzer angemeldet |
| **DEBUG** | Detaillierte Infos | API-Aufruf mit Parametern |

## Log-Oberfläche

### Logs anzeigen

1. Navigieren Sie zu **Einstellungen > Logs**
2. Standardmäßig werden die letzten 100 Einträge angezeigt

### Filter

| Filter | Beschreibung |
|--------|--------------|
| **Level** | ERROR, WARN, INFO, DEBUG |
| **Quelle** | System, API, Auth, Email |
| **Zeitraum** | Von-Bis Datumsauswahl |
| **Suche** | Volltextsuche in Meldungen |

## Log-Quellen

| Quelle | Beschreibung |
|--------|--------------|
| **system** | Systemereignisse |
| **auth** | Authentifizierung |
| **ticket** | Ticket-Operationen |
| **email** | E-Mail-Integration |
| **api** | API-Aufrufe |

## Log-Export

Logs können exportiert werden:

1. Wählen Sie den gewünschten Zeitraum
2. Setzen Sie gewünschte Filter
3. Klicken Sie auf **"Exportieren"**
4. Wählen Sie das Format (CSV, JSON)

## Fehleranalyse

### Typische Fehler

| Fehler | Mögliche Ursache | Lösung |
|--------|------------------|--------|
| `DB_CONNECTION_ERROR` | Datenbank nicht erreichbar | Verbindung prüfen |
| `AUTH_TOKEN_EXPIRED` | JWT abgelaufen | Neu anmelden |
| `MAIL_SYNC_FAILED` | E-Mail-Abruf fehlgeschlagen | Konfiguration prüfen |

### Fehler melden

Bei unbekannten Fehlern:

1. Notieren Sie den Zeitstempel
2. Kopieren Sie die Fehlermeldung
3. Prüfen Sie die Logs auf Details
4. Erstellen Sie ggf. ein GitHub Issue

## Log-Rotation

Logs werden automatisch rotiert:

- **Aufbewahrung**: 30 Tage
- **Maximale Größe**: 100 MB pro Datei
- **Archivierung**: Ältere Logs werden komprimiert
