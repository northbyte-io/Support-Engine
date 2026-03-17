# Datenbank

Support-Engine verwendet PostgreSQL 16 mit Drizzle ORM. Das Schema ist vollständig in `shared/schema.ts` definiert — diese Datei ist die einzige Quelle für alle Tabellenstrukturen und Zod-Validierungsschemas.

## Schema-Workflow

```bash
# 1. Spalte/Tabelle in shared/schema.ts hinzufügen
# 2. Schema anwenden
npm run db:push

# 3. Zod-Schema wird automatisch abgeleitet
# (drizzle-zod generiert Insert/Select-Typen)
```

:::{warning}
`npm run db:push` wendet Änderungen direkt an. Für Produktionsmigrationen sollten die generierten Migrationsdateien in `migrations/` verwendet werden.
:::

## Tabellen-Übersicht

### Mandanten & Benutzer

| Tabelle | Beschreibung |
|---------|-------------|
| `tenants` | Mandanten: Slug, Name, Branding (Logo, Farben, Custom CSS) |
| `users` | Benutzer mit Rolle (`admin`, `agent`, `customer`), bcrypt-Passwort |

### Tickets & Kommentare

| Tabelle | Beschreibung |
|---------|-------------|
| `tickets` | Kern-Tickettabelle: Titel, Beschreibung (HTML), Status, Priorität, SLA-Felder, Soft-Delete |
| `ticket_types` | Anpassbare Tickettypen pro Mandant |
| `custom_fields` | Benutzerdefinierte Felder für Tickets |
| `ticket_assignees` | n:m-Relation Ticket ↔ Agent |
| `ticket_watchers` | n:m-Relation Ticket ↔ Beobachter |
| `comments` | Kommentare (intern/öffentlich), HTML-Inhalt, Soft-Delete |
| `attachments` | Dateianhänge mit MIME-Typ, Dateipfad, Ticketreferenz |
| `mentions` | @-Erwähnungen in Kommentaren |

### SLA

| Tabelle | Beschreibung |
|---------|-------------|
| `sla_definitions` | SLA-Regeln: Reaktionszeit, Lösungszeit, Priorität, Arbeitszeiten |
| `sla_escalations` | Eskalationsstufen mit Schwellenwerten und Aktionen |

### Wissensdatenbank

| Tabelle | Beschreibung |
|---------|-------------|
| `kb_categories` | Kategorien (hierarchisch, optional) |
| `kb_articles` | Artikel mit HTML-Inhalt, Tags, Veröffentlichungsstatus, Soft-Delete |
| `kb_article_versions` | Versionsverlauf für Artikel |
| `ticket_kb_links` | Verknüpfung Ticket ↔ KB-Artikel |

### Zeiterfassung

| Tabelle | Beschreibung |
|---------|-------------|
| `time_entries` | Gebuchte Zeiteinträge (Ticket, Agent, Dauer, Beschreibung) |
| `active_timers` | Laufende Timer pro Ticket und Benutzer |
| `work_entries` | Detaillierte Arbeitsprotokoll-Einträge |

### CRM

| Tabelle | Beschreibung |
|---------|-------------|
| `organizations` | Organisationen/Firmen |
| `customers` | Kunden mit Kontaktdaten, verknüpft mit Organisation |
| `customer_locations` | Standorte pro Kunde |
| `contacts` | Ansprechpartner für Kunden/Organisationen |
| `ticket_contacts` | n:m-Relation Ticket ↔ Kontakt |
| `customer_activities` | Aktivitätsprotokoll pro Kunde |

### Assets

| Tabelle | Beschreibung |
|---------|-------------|
| `asset_categories` | Kategorien für Assets |
| `assets` | Geräte/Assets: Typ, Seriennummer, Status, Standort, Besitzer |
| `asset_licenses` | Softwarelizenzen, die Assets zugeordnet sind |
| `asset_contracts` | Wartungsverträge pro Asset |
| `ticket_assets` | n:m-Relation Ticket ↔ Asset |
| `asset_history` | Änderungsverlauf pro Asset |

### Projekte & Kanban

| Tabelle | Beschreibung |
|---------|-------------|
| `projects` | Projekte mit Farbe, Kürzel, Status |
| `project_members` | Projektmitglieder |
| `board_columns` | Kanban-Spalten pro Projekt |
| `ticket_projects` | n:m-Relation Ticket ↔ Projekt (mit Board-Position) |

### Bereiche

| Tabelle | Beschreibung |
|---------|-------------|
| `areas` | Organisationseinheiten/Abteilungen pro Mandant |
| `ticket_areas` | n:m-Relation Ticket ↔ Bereich |

### Benachrichtigungen & Umfragen

| Tabelle | Beschreibung |
|---------|-------------|
| `notifications` | In-App-Benachrichtigungen pro Benutzer |
| `surveys` | Kundenzufriedenheitsumfragen |
| `survey_questions` | Fragen pro Umfrage |
| `survey_invitations` | Einladungen an Kunden |
| `survey_responses` | Antworten der Kunden |

### TLS-Zertifikate

| Tabelle | Beschreibung |
|---------|-------------|
| `tls_settings` | ACME-Konfiguration (E-Mail, Staging-Flag) |
| `tls_certificates` | Ausgestellte Zertifikate mit Ablaufdatum |
| `tls_certificate_actions` | Aktionsprotokoll pro Zertifikat |
| `tls_challenges` | ACME HTTP-01 Challenge-Token |

### Exchange Online

| Tabelle | Beschreibung |
|---------|-------------|
| `exchange_configurations` | OAuth2-Konfiguration (TenantId, ClientId, verschlüsseltes Secret) |
| `exchange_mailboxes` | Konfigurierte Postfächer mit Sync-Status |
| `exchange_assignment_rules` | Regeln: Bedingung → Aktion (Priorität, Agent, Ticket) |
| `exchange_emails` | Abgerufene E-Mails mit Verarbeitungsstatus |
| `email_processing_rules` | Erweiterte Verarbeitungsregeln (Absender, Betreff, Inhalt) |
| `exchange_sync_logs` | Sync-Protokoll pro Postfach |

## Multi-Tenancy

Jede Tabelle hat ein `tenantId`-Feld (Ausnahmen: reine Join-Tabellen). Alle Abfragen in `server/storage.ts` filtern **immer** nach `tenantId`:

```typescript
// Richtig — tenantId immer filtern
const result = await db
  .select()
  .from(tickets)
  .where(and(eq(tickets.tenantId, tenantId), eq(tickets.id, ticketId)));
```

## Soft-Delete

Tickets, Kommentare und KB-Artikel unterstützen Soft-Delete (DSGVO):

```typescript
// Felder in der Tabelle
deletedAt: timestamp("deleted_at")  // null = aktiv
deletedBy: text("deleted_by")       // userId
```

Alle Abfragen für aktive Einträge schließen `deletedAt IS NULL` ein.

## Verbindungskonfiguration

```ini
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Für Neon-Serverless wird `@neondatabase/serverless` als Drizzle-Adapter verwendet, was WebSocket-basierte Verbindungen ermöglicht.
