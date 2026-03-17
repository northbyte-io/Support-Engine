# API-Referenz

Support-Engine stellt eine REST-API mit über 150 Endpunkten bereit. Alle Endpunkte beginnen mit `/api/` und geben JSON zurück.

## Authentifizierung

Alle geschützten Endpunkte erwarten einen JWT-Bearer-Token im `Authorization`-Header:

```text
Authorization: Bearer <token>
```

Token werden über `/api/auth/login` bezogen und haben eine Gültigkeit von 7 Tagen.

## Rollen

| Rolle | Beschreibung |
|-------|-------------|
| `admin` | Voller Zugriff auf alle Endpunkte |
| `agent` | Zugriff auf operative Endpunkte (Tickets, CRM, Assets, Projekte) |
| `customer` | Nur Portal-Endpunkte (`/api/portal/*`) |

## Öffentliche Endpunkte

```text
GET  /api/license               # AGPL-3.0-Lizenztext
GET  /api/source                # Quellcode-Download-Link (AGPL-Pflicht)
GET  /api/tenant/public/:slug   # Mandanten-Branding für Login-Seite
GET  /api/public/survey/:token  # Umfrageformular (öffentlicher Token)
POST /api/public/survey/:token/submit  # Umfrageantwort einreichen
GET  /.well-known/acme-challenge/:token  # ACME HTTP-01 Challenge
```

## Authentifizierungs-Endpunkte

```text
POST /api/auth/register    # Benutzer registrieren (erster = Admin)
POST /api/auth/login       # Anmelden → JWT-Token
GET  /api/auth/me          # Eigenes Benutzerprofil abrufen
POST /api/auth/logout      # Abmelden (clientseitig, Token ungültig)
```

## Dashboard

```text
GET /api/dashboard/stats     # Ticket-Statistiken (offen, in Bearbeitung etc.)
GET /api/dashboard/workload  # Agent-Auslastung
GET /api/search              # Globale Suche (Tickets, KB, Kunden)
```

## Berichte

```text
GET /api/reports/tickets   # Ticket-Analyse (Zeitraum, Status, Agent)
GET /api/reports/sla       # SLA-Compliance-Bericht
GET /api/reports/time      # Zeiterfassungs-Bericht
GET /api/reports/export    # Bericht exportieren (csv, xlsx, pdf, html)
```

**Gemeinsame Query-Parameter:** `startDate`, `endDate` (ISO 8601)

## Tickets

```text
GET    /api/tickets                       # Ticketliste (paginiert, filterbar)
GET    /api/tickets/:id                   # Einzelnes Ticket
POST   /api/tickets                       # Ticket erstellen
PATCH  /api/tickets/:id                   # Ticket aktualisieren
DELETE /api/tickets/:id                   # Soft-Delete (Agent)
DELETE /api/tickets/:id/hard              # Hard-Delete (Admin)

GET    /api/tickets/:id/attachments       # Anhänge eines Tickets
GET    /api/attachments/:id/download      # Anhang herunterladen
POST   /api/tickets/:id/comments          # Kommentar hinzufügen

GET    /api/ticket-types                  # Verfügbare Tickettypen
```

**Filter für `GET /api/tickets`:** `status`, `priority`, `assigneeId`, `customerId`, `projectId`, `areaId`, `search`, `page`, `limit`

## Zeiterfassung

```text
GET    /api/timers                          # Alle aktiven Timer
GET    /api/tickets/:id/timer               # Timer eines Tickets
POST   /api/tickets/:id/timer/start         # Timer starten
POST   /api/tickets/:id/timer/pause         # Timer pausieren
POST   /api/tickets/:id/timer/resume        # Timer fortsetzen
POST   /api/tickets/:id/timer/stop          # Timer stoppen → Zeiteintrag anlegen
DELETE /api/tickets/:id/timer               # Timer verwerfen

GET    /api/tickets/:id/work-entries        # Arbeitsprotokolle eines Tickets
POST   /api/tickets/:id/work-entries        # Manueller Zeiteintrag
PATCH  /api/work-entries/:id                # Zeiteintrag bearbeiten
DELETE /api/work-entries/:id                # Zeiteintrag löschen
```

## Mandanten-Branding

```text
GET   /api/tenant/branding          # Branding des eigenen Mandanten
PATCH /api/tenant/branding          # Branding aktualisieren (Admin)
```

## Benutzer & Bereiche

```text
GET  /api/users            # Benutzer des Mandanten
POST /api/users            # Benutzer anlegen (Admin)

GET    /api/areas          # Bereiche/Abteilungen
POST   /api/areas          # Bereich anlegen (Agent+)
PATCH  /api/areas/:id      # Bereich bearbeiten
DELETE /api/areas/:id      # Bereich löschen
```

## SLA-Definitionen

```text
GET    /api/sla-definitions                      # SLA-Regeln
GET    /api/sla-definitions/:id                  # Einzelne SLA-Regel
POST   /api/sla-definitions                      # Erstellen (Admin)
PATCH  /api/sla-definitions/:id                  # Bearbeiten (Admin)
DELETE /api/sla-definitions/:id                  # Löschen (Admin)
POST   /api/sla-definitions/:id/escalations      # Eskalation hinzufügen (Admin)
DELETE /api/sla-escalations/:id                  # Eskalation löschen (Admin)
```

## Wissensdatenbank

```text
GET    /api/kb/categories                # Kategorien
POST   /api/kb/categories                # Kategorie erstellen (Agent+)
PATCH  /api/kb/categories/:id            # Kategorie bearbeiten
DELETE /api/kb/categories/:id            # Kategorie löschen (Admin)

GET    /api/kb/articles                  # Artikel (filterbar, paginiert)
GET    /api/kb/articles/:id              # Einzelner Artikel
POST   /api/kb/articles                  # Artikel erstellen (Agent+)
PATCH  /api/kb/articles/:id              # Artikel bearbeiten
DELETE /api/kb/articles/:id              # Soft-Delete (Agent+)
DELETE /api/kb/articles/:id/hard         # Hard-Delete (Admin)
```

## CRM

```text
# Organisationen
GET    /api/organizations
GET    /api/organizations/:id
POST   /api/organizations
PATCH  /api/organizations/:id
DELETE /api/organizations/:id  # Admin

# Kunden
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PATCH  /api/customers/:id
DELETE /api/customers/:id      # Admin
GET    /api/customers/:id/locations
POST   /api/customers/:id/locations

# Kontakte
GET    /api/contacts
GET    /api/contacts/:id
POST   /api/contacts
PATCH  /api/contacts/:id
DELETE /api/contacts/:id       # Admin

# Aktivitäten
GET    /api/customer-activities
POST   /api/customer-activities
```

## Assets

```text
GET    /api/asset-categories           # Kategorien (Agent+)
POST   /api/asset-categories           # Erstellen (Admin)
PATCH  /api/asset-categories/:id       # Admin
DELETE /api/asset-categories/:id       # Admin

GET    /api/assets                     # Asset-Liste (filterbar)
GET    /api/assets/next-number         # Nächste Asset-Nummer
GET    /api/assets/:id                 # Einzelnes Asset
POST   /api/assets                     # Asset anlegen
PATCH  /api/assets/:id                 # Asset aktualisieren
DELETE /api/assets/:id                 # Admin

GET    /api/assets/:id/history         # Änderungsverlauf
GET    /api/assets/:id/tickets         # Verknüpfte Tickets
GET    /api/tickets/:id/assets         # Assets eines Tickets
POST   /api/tickets/:id/assets         # Asset mit Ticket verknüpfen
DELETE /api/ticket-assets/:id          # Verknüpfung entfernen
```

## Projekte & Kanban

```text
GET    /api/projects                              # Projektliste
GET    /api/projects/:id                          # Einzelnes Projekt
POST   /api/projects                              # Erstellen (Admin)
PATCH  /api/projects/:id                          # Admin
DELETE /api/projects/:id                          # Admin

GET    /api/projects/:id/members                  # Mitglieder
POST   /api/projects/:id/members                  # Hinzufügen (Admin)
DELETE /api/projects/:id/members/:userId          # Entfernen (Admin)

GET    /api/projects/:id/columns                  # Kanban-Spalten
POST   /api/projects/:id/columns                  # Spalte erstellen (Admin)
PATCH  /api/board-columns/:id                     # Spalte bearbeiten (Admin)
DELETE /api/board-columns/:id                     # Admin
POST   /api/projects/:id/columns/reorder          # Reihenfolge ändern (Admin)

GET    /api/projects/:id/board                    # Board-Daten abrufen
PATCH  /api/projects/:id/tickets/:ticketId/order  # Ticket-Position setzen
GET    /api/tickets/:id/projects                  # Projekte eines Tickets
POST   /api/tickets/:id/projects                  # Projekt zuweisen
DELETE /api/tickets/:id/projects/:projectId       # Projektzuweisung entfernen
```

## Portal (Kunden)

```text
GET  /api/portal/tickets        # Eigene Tickets (Kunden-Sicht)
GET  /api/portal/tickets/:id    # Einzelnes Ticket (Kunden-Sicht)
POST /api/portal/tickets        # Ticket erstellen (als Kunde)
```

## Logging (Admin)

```text
GET  /api/logs                 # Logs aus dem In-Memory-Puffer
GET  /api/logs/files           # Verfügbare Log-Dateien
POST /api/logs/test            # Test-Log-Eintrag erstellen
GET  /api/logs/export          # Logs exportieren
```

**Filter für `GET /api/logs`:** `level`, `source`, `tenantId`, `userId`, `entityType`, `entityId`, `search`, `startDate`, `endDate`, `limit`, `offset`

## TLS-Zertifikate (Admin)

```text
GET   /api/tls/settings                   # ACME-Einstellungen
PATCH /api/tls/settings                   # ACME-Einstellungen aktualisieren
GET   /api/tls/certificates               # Zertifikate
GET   /api/tls/certificates/:id           # Einzelnes Zertifikat
POST  /api/tls/certificates               # Zertifikat beantragen
POST  /api/tls/certificates/:id/renew     # Verlängern
POST  /api/tls/certificates/:id/revoke    # Widerrufen
POST  /api/tls/certificates/:id/activate  # Aktivieren
DELETE /api/tls/certificates/:id          # Löschen
GET   /api/tls/actions                    # Aktionsprotokoll
POST  /api/tls/check-renewal              # Verlängerungsprüfung anstoßen
```

## Exchange Online (Admin)

```text
GET  /api/exchange/configuration              # OAuth2-Konfiguration
POST /api/exchange/configuration              # Konfiguration speichern
POST /api/exchange/test-connection            # Verbindung testen

GET    /api/exchange/mailboxes                # Konfigurierte Postfächer
POST   /api/exchange/mailboxes                # Postfach hinzufügen
PATCH  /api/exchange/mailboxes/:id            # Bearbeiten
DELETE /api/exchange/mailboxes/:id            # Entfernen

GET    /api/exchange/mailboxes/:id/rules      # Zuweisungsregeln
POST   /api/exchange/mailboxes/:id/rules      # Regel erstellen
PATCH  /api/exchange/rules/:id                # Bearbeiten
DELETE /api/exchange/rules/:id                # Löschen

GET  /api/exchange/folders/:email             # Verfügbare Postfachordner
GET  /api/exchange/sync-logs                  # Sync-Protokoll
POST /api/exchange/sync                       # Sync manuell starten
POST /api/exchange/send-test                  # Test-E-Mail senden

GET    /api/exchange/processing-rules         # Verarbeitungsregeln
GET    /api/exchange/processing-rules/:id     # Einzelne Regel
POST   /api/exchange/processing-rules         # Erstellen
PATCH  /api/exchange/processing-rules/:id     # Bearbeiten
DELETE /api/exchange/processing-rules/:id     # Löschen
```

## Fehlerbehandlung

Alle Fehlerantworten folgen diesem Format:

```json
{
  "message": "Fehlerbeschreibung"
}
```

| HTTP-Code | Bedeutung |
|-----------|-----------|
| 200 | Erfolg |
| 201 | Erstellt |
| 400 | Ungültige Anfrage (Validierungsfehler) |
| 401 | Nicht authentifiziert |
| 403 | Keine Berechtigung |
| 404 | Nicht gefunden |
| 429 | Rate-Limit überschritten |
| 500 | Serverfehler |
