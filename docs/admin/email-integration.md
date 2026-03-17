# Microsoft Exchange Integration

Support-Engine kann E-Mails aus Microsoft Exchange Online-Postfächern automatisch abrufen und daraus Tickets erstellen.

## Voraussetzungen

- Microsoft 365 / Exchange Online Tenant
- Azure Active Directory App-Registrierung mit folgenden Berechtigungen:
  - `Mail.Read` — E-Mails lesen
  - `Mail.ReadWrite` — E-Mails markieren/verschieben
  - `Mail.Send` — E-Mails versenden (optional)

## App-Registrierung in Azure

1. Im Azure Portal: **Azure Active Directory → App-Registrierungen → Neu**
2. App-Name und Unterstützte Kontotypen festlegen
3. Unter **API-Berechtigungen**: Microsoft Graph → Anwendungsberechtigungen → oben genannte Scopes hinzufügen
4. **Administratorzustimmung erteilen** (Admin Consent)
5. Unter **Zertifikate & Geheimnisse**: Neues Client-Secret erstellen

Notieren Sie:
- **Verzeichnis-ID (TenantId)**
- **Anwendungs-ID (ClientId)**
- **Client-Secret-Wert**

## Konfiguration in Support-Engine

**Navigation:** Administration → Exchange → Konfiguration

| Feld | Beschreibung |
|------|-------------|
| Azure Tenant-ID | Verzeichnis-ID aus dem Azure Portal |
| Client-ID | Anwendungs-ID der App-Registrierung |
| Client-Secret | Secret-Wert (wird verschlüsselt gespeichert) |

:::{note}
Das Client-Secret wird mit AES-256-GCM verschlüsselt in der Datenbank gespeichert und **niemals** im Klartext ausgegeben.
:::

Nach dem Speichern: **Verbindung testen** — bei Erfolg kann die Postfachkonfiguration beginnen.

## Postfächer konfigurieren

**Navigation:** Administration → Exchange → Postfächer → Postfach hinzufügen

| Feld | Beschreibung |
|------|-------------|
| E-Mail-Adresse | Adresse des Postfachs (z.B. `support@firma.de`) |
| Anzeigename | Bezeichnung für die Oberfläche |
| Ordner | Zu überwachender Ordner (Standard: Posteingang) |
| Aktiv | Sync ein-/ausschalten |

Shared Mailboxes werden vollständig unterstützt.

## Sync-Verhalten

Der Exchange-Sync läuft automatisch im Hintergrund. Intervall und Verhalten:

- Neue E-Mails werden abgerufen und als Tickets angelegt
- Bereits verarbeitete E-Mails werden markiert
- Anhänge werden automatisch an das Ticket angehängt
- Das Sync-Protokoll ist unter **Exchange → Sync-Protokoll** einsehbar

Manueller Sync: **Exchange → Postfächer → Jetzt synchronisieren**

## Zuweisungsregeln

Regeln erlauben die automatische Weiterleitung eingehender E-Mails:

**Bedingungen:**
- Absender enthält / ist genau
- Betreff enthält / beginnt mit
- Inhalt enthält

**Aktionen:**
- Ticket-Priorität setzen
- Agent zuweisen
- Bereich zuweisen

Regeln werden in der konfigurierten Reihenfolge ausgewertet. Die erste passende Regel wird angewendet.

## Verarbeitungsregeln

Zusätzliche Regeln für komplexere Logik:

- Kombination von UND/ODER-Bedingungen
- Aktionen: Ticket erstellen, Ticket ignorieren, Kategorie setzen
- Aktivierbar/deaktivierbar ohne Löschen

## Test-E-Mail senden

Unter **Exchange → Test-E-Mail** kann eine Test-Nachricht an eine Adresse gesendet werden, um die Verbindung und SMTP-Funktionalität zu prüfen.
