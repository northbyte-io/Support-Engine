# German Ticket System - Helpdesk Management

Eine vollständige deutsche SaaS-Webanwendung für professionelles Ticket- und Helpdesk-Management mit Multi-Tenant-Architektur, REST-API für Web und iOS, sowie umfangreichen Enterprise-Features.

---

## Inhaltsverzeichnis

- [Über das Projekt](#über-das-projekt)
- [Funktionen](#funktionen)
  - [Implementierte Features](#implementierte-features)
  - [Roadmap](#roadmap)
- [Tech Stack](#tech-stack)
- [Architektur](#architektur)
- [Datenbank-Schema](#datenbank-schema)
- [API-Design](#api-design)
- [Installation & Setup](#installation--setup)
- [Benutzerrollen & Berechtigungen](#benutzerrollen--berechtigungen)
- [Sicherheit](#sicherheit)
- [Lizenz](#lizenz)

---

## Über das Projekt

Das **German Ticket System** ist eine moderne Helpdesk-Lösung, die speziell für deutschsprachige Unternehmen entwickelt wurde.

### Kernfunktionen auf einen Blick:

| Feature | Beschreibung |
|---------|--------------|
| Multi-Tenant | Vollständige Datenisolierung zwischen Mandanten |
| Rollenbasiert | Admin, Agent und Kunden-Rollen mit feingranularen Berechtigungen |
| API-First | REST-API für Web- und Mobile-Anwendungen (iOS) |
| Modernes Design | Linear-inspiriertes UI mit Dark/Light Mode |
| Deutschsprachig | Alle UI-Texte und Systemmeldungen auf Deutsch |

---

## Funktionen

### Implementierte Features

#### Authentifizierung & Benutzerverwaltung

- JWT-basierte Authentifizierung
- Sichere Passwortspeicherung mit bcrypt
- Session-Management mit automatischer Verlängerung
- Multi-Tenancy mit isolierten Mandanten
- Drei Benutzerrollen: Admin, Agent, Kunde

#### Ticket-Management

- Ticket-Erstellung mit Titel, Beschreibung, Priorität
- Status-Workflow: `Offen` -> `In Bearbeitung` -> `Wartend` -> `Gelöst` -> `Geschlossen`
- Prioritätsstufen: Niedrig, Mittel, Hoch, Dringend
- Konfigurierbare Tickettypen mit benutzerdefinierten Feldern
- Mehrfachzuweisung an Bearbeiter
- Automatische Ticket-Nummern (TKT-XXXXX)
- Interne & öffentliche Kommentare
- Dateianhänge

#### SLA-Management

- SLA-Definitionen pro Priorität
- Automatisches Tracking von Reaktions- & Lösungszeiten
- Eskalationsregeln bei SLA-Verletzung
- Visueller SLA-Status auf Ticket-Details

#### Wissensmanagement (Knowledge Base)

- Artikel-Verwaltung mit CRUD-Operationen
- Vollständige Versionierung
- Kategorisierung
- Volltextsuche
- Ticket-Artikel-Verknüpfung
- Rich-Text-Editor

#### Zeiterfassung

- Zeiteinträge pro Ticket
- Abrechenbar/Nicht abrechenbar Status
- Detaillierte Tätigkeitsbeschreibungen
- Berichte nach Projekt/Kunde
- Konfigurierbare Stundensätze

#### Erweiterte Collaboration

- @Mention-System in Kommentaren
- Automatische Benachrichtigungen
- Beobachter-Funktion für Tickets
- Vollständiges Aktivitätsprotokoll

#### Umfragen (Surveys)

- Verschiedene Fragetypen:
  - Bewertungsskala (1-5 oder 1-10)
  - Ja/Nein-Fragen
  - Freitext
  - NPS (Net Promoter Score)
- Automatischer Versand nach Ticket-Schließung
- Einladungs-Management
- Ergebnis-Dashboard mit Statistiken

#### Asset-Management

- Asset-Kategorien: Hardware, Software, Lizenzen, Verträge
- Detaillierte Asset-Informationen:
  - Hardware: Seriennummer, Kaufdatum, Garantie
  - Software: Lizenzinfos, Ablaufdatum
  - Lizenzen: Schlüssel, Typ, Ablauf
  - Verträge: Laufzeit, Kündigungsfrist
- Asset-Ticket-Verknüpfung
- Vollständige Änderungshistorie
- Sichere Mandantentrennung

#### Dashboard & Analytics

- Statistik-Karten:
  - Offene Tickets
  - In Bearbeitung
  - Heute gelöst
  - Durchschnittliche Reaktionszeit
- Workload-Übersicht pro Agent
- Echtzeit-Updates
- Trend-Analyse

#### Benachrichtigungssystem

- In-App-Benachrichtigungen
- Ungelesene-Zähler Badge
- Benachrichtigungstypen:
  - Ticket-Zuweisung
  - Neue Kommentare
  - @Mentions
  - SLA-Warnungen
  - Umfrage-Einladungen

#### Projektmanagement & Kanban

- Projekte erstellen und verwalten
- Kanban-Board mit Drag-and-Drop
- Spalten pro Status: Offen, In Bearbeitung, Gelöst, Geschlossen
- WIP-Limits (Work in Progress)
- Tickets per Drag-and-Drop zwischen Spalten verschieben
- Mehrfache Projektzuordnung pro Ticket
- Automatische Board-Synchronisation bei Statusänderungen

#### CRM-Modul (Customer Relationship Management)

- **Organisationen**: Unternehmensgruppen und Konzerne verwalten
  - Rechtlicher Name, Branche, Kontaktdaten
  - Standortinformationen
  - Aktiv/Inaktiv-Status
- **Kunden**: Vollständige Kundenverwaltung
  - Automatische Kundennummern (KD-XXXXX)
  - Organisationszuordnung
  - Account-Manager-Zuweisung
  - Prioritätsstufen
- **Standorte**: Mehrere Standorte pro Kunde
  - Hauptstandort-Kennzeichnung
  - Vollständige Adressdaten
- **Kontakte**: Ansprechpartner verwalten
  - Position, Abteilung
  - Mehrere Kommunikationskanäle
  - Primärkontakt-Kennzeichnung
  - Ticket-Kontakt-Verknüpfung
- **Aktivitätsverfolgung**: Kundeninteraktionen protokollieren
  - Anrufe, E-Mails, Meetings, Notizen
  - Automatische Zeitstempel

#### System-Logging & Monitoring

- Umfassendes Logging-System mit Winston
- **Log-Level**:
  - Debug: Entwicklungsdetails
  - Info: Allgemeine Systeminformationen
  - Warn: Warnungen und potenzielle Probleme
  - Error: Fehler mit Ursache und Lösungsvorschlag
  - Security: Sicherheitsrelevante Ereignisse
  - Performance: Leistungsmetriken
- **Log-Quellen**: API, Auth, Ticket, SLA, CRM, E-Mail, Integration, Datenbank, System
- **Features**:
  - Farbkodierte Konsolenausgabe
  - Tägliche Logrotation (max. 2GB pro Datei)
  - 7-Tage-Aufbewahrung
  - Automatische Maskierung sensibler Daten (Passwörter, API-Keys, E-Mails)
  - In-Memory-Buffer für schnelle UI-Abfragen
- **Admin-UI**:
  - Filterung nach Level und Quelle
  - Volltextsuche
  - Paginierung
  - Export (TXT, CSV, JSON)
  - Test-Log-Generator für alle Level

#### Design & UX

- Dark/Light Mode
- Responsive Design
- Shadcn UI Sidebar
- Inter Font
- Linear-inspiriertes Design
- Skeleton-Loader
- Toast-Benachrichtigungen
- Einheitliches MainLayout für alle Seiten

---

### Roadmap

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Projektmanagement | Fertig | Kanban-Board, Projekt-Tracking |
| CRM-Modul | Fertig | Organisationen, Kunden, Kontakte, Standorte |
| System-Logging | Fertig | Umfassendes Logging mit Admin-UI |
| Erweiterte Berichte | Geplant | Report Builder, CSV/PDF Export |
| Genehmigungsworkflows | Geplant | Multi-Step-Approval |
| Mandanten-Branding | Geplant | Logo, Farben, E-Mail-Templates |
| Microsoft-Integration | Geplant | Azure AD, Teams, Outlook |
| AI-Funktionen | Geplant | Auto-Kategorisierung, Vorschläge |

---

## Tech Stack

### Frontend

| Technologie | Beschreibung |
|-------------|--------------|
| React 18 | UI-Framework mit TypeScript |
| Vite 6 | Build-Tool mit HMR |
| TailwindCSS 4 | Utility-First CSS |
| Shadcn UI | Komponenten (Radix UI) |
| React Hook Form | Formular-Verwaltung |
| Zod | Schema-Validierung |
| TanStack Query 5 | Server State |
| Wouter | Routing |
| Lucide React | Icons |
| Framer Motion | Animationen |
| dnd-kit | Drag-and-Drop |

### Backend

| Technologie | Beschreibung |
|-------------|--------------|
| Node.js 20 | JavaScript Runtime |
| Express 4 | HTTP-Server |
| TypeScript 5 | Type Safety |
| bcryptjs | Passwort-Hashing |
| jsonwebtoken | JWT-Auth |
| Winston | Logging-Framework |
| Zod | API-Validierung |

### Datenbank

| Technologie | Beschreibung |
|-------------|--------------|
| PostgreSQL 16 | Relationale DB |
| Drizzle ORM | Type-safe ORM |
| Drizzle Kit | Schema-Management |

---

## Architektur

### Projektstruktur

```
german-ticket-system
├── client/                 # Frontend
│   ├── src/
│   │   ├── components/     # UI-Komponenten
│   │   │   └── ui/         # Shadcn UI
│   │   ├── hooks/          # Custom Hooks
│   │   ├── lib/            # Utilities
│   │   ├── pages/          # Seiten
│   │   └── App.tsx         # Haupt-App
│   └── index.html
├── server/                 # Backend
│   ├── auth.ts             # Authentifizierung
│   ├── logger.ts           # Logging-System
│   ├── routes.ts           # API-Routen
│   ├── storage.ts          # Datenbankzugriff
│   └── index.ts            # Server-Start
├── shared/                 # Geteilter Code
│   └── schema.ts           # Drizzle-Schema
├── logs/                   # Log-Dateien (automatisch erstellt)
└── design_guidelines.md    # Design-System
```

---

## Datenbank-Schema

### Kern-Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| `tenants` | Mandanten/Unternehmen |
| `users` | Benutzerkonten |
| `tickets` | Tickets/Anfragen |
| `ticketTypes` | Tickettypen |
| `ticketAssignees` | Zuweisungen |
| `ticketComments` | Kommentare |
| `ticketAttachments` | Anhänge |

### SLA & Eskalation

| Tabelle | Beschreibung |
|---------|--------------|
| `slaDefinitions` | SLA-Definitionen |
| `slaEscalations` | Eskalationsregeln |

### Wissensmanagement

| Tabelle | Beschreibung |
|---------|--------------|
| `kbArticles` | Artikel |
| `kbArticleVersions` | Versionen |
| `kbCategories` | Kategorien |
| `ticketArticleLinks` | Verknüpfungen |

### Zeiterfassung

| Tabelle | Beschreibung |
|---------|--------------|
| `timeEntries` | Zeiteinträge |

### Umfragen

| Tabelle | Beschreibung |
|---------|--------------|
| `surveys` | Umfragen |
| `surveyQuestions` | Fragen |
| `surveyInvitations` | Einladungen |
| `surveyResponses` | Antworten |

### Asset-Management

| Tabelle | Beschreibung |
|---------|--------------|
| `assetCategories` | Kategorien |
| `assets` | Assets |
| `assetLicenses` | Lizenzen |
| `assetContracts` | Verträge |
| `ticketAssets` | Verknüpfungen |
| `assetHistory` | Historie |

### Projektmanagement

| Tabelle | Beschreibung |
|---------|--------------|
| `projects` | Projekte |
| `projectMembers` | Projektmitglieder |
| `boardColumns` | Kanban-Spalten |
| `ticketProjects` | Ticket-Projekt-Zuordnungen |

### CRM-Modul

| Tabelle | Beschreibung |
|---------|--------------|
| `organizations` | Organisationen/Unternehmensgruppen |
| `customers` | Kunden mit Auto-Nummern (KD-XXXXX) |
| `customerLocations` | Kundenstandorte |
| `contacts` | Ansprechpartner |
| `ticketContacts` | Ticket-Kontakt-Verknüpfungen |
| `customerActivities` | Kundenaktivitäten |

---

## API-Design

### REST-Endpunkte

```http
GET    /api/[resource]          # Liste abrufen
GET    /api/[resource]/:id      # Einzelnes Element
POST   /api/[resource]          # Erstellen
PATCH  /api/[resource]/:id      # Aktualisieren
DELETE /api/[resource]/:id      # Löschen
```

### Hauptressourcen

- `/api/auth` - Authentifizierung (Login, Register, Me)
- `/api/tickets` - Ticket-Management
- `/api/users` - Benutzerverwaltung
- `/api/organizations` - Organisationen
- `/api/customers` - Kunden
- `/api/contacts` - Kontakte
- `/api/projects` - Projekte
- `/api/assets` - Asset-Management
- `/api/kb` - Wissensdatenbank
- `/api/surveys` - Umfragen
- `/api/logs` - System-Logs (Admin)

### Authentifizierung

```http
Authorization: Bearer <jwt-token>
```

### Mandantentrennung

Alle API-Abfragen werden automatisch nach `tenantId` gefiltert:

1. **Route-Layer**: Extrahiert `tenantId` aus JWT
2. **Storage-Layer**: Validiert und filtert alle Queries

---

## Installation & Setup

### Voraussetzungen

- Node.js 20.x oder höher
- PostgreSQL 16.x
- npm oder yarn

### Umgebungsvariablen

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secure-session-secret
```

### Schnellstart

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Datenbank-Schema synchronisieren
npm run db:push

# 3. Entwicklungsserver starten
npm run dev
```

Die Anwendung ist dann unter `http://localhost:5000` verfügbar.

### Demo-Zugangsdaten

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@demo.de | admin123 |
| Agent | agent@demo.de | agent123 |
| Kunde | kunde@demo.de | kunde123 |

---

## Benutzerrollen & Berechtigungen

### Admin

| Berechtigung | Status |
|--------------|--------|
| Alle Funktionen | Ja |
| Benutzerverwaltung | Ja |
| Mandanten-Einstellungen | Ja |
| Asset-Management | Ja |
| Umfragen verwalten | Ja |
| SLA-Definitionen | Ja |
| System-Logs einsehen | Ja |
| CRM-Vollzugriff | Ja |

### Agent

| Berechtigung | Status |
|--------------|--------|
| Tickets bearbeiten | Ja |
| Tickets zuweisen | Ja |
| KB-Artikel erstellen | Ja |
| Zeiteinträge erfassen | Ja |
| Assets verwalten | Ja |
| Interne Kommentare | Ja |
| CRM-Lesezugriff | Ja |

### Kunde

| Berechtigung | Status |
|--------------|--------|
| Eigene Tickets erstellen | Ja |
| Ticket-Status einsehen | Ja |
| Öffentliche Kommentare | Ja |
| Wissensbasis durchsuchen | Ja |
| Umfragen beantworten | Ja |

---

## Sicherheit

### Implementierte Maßnahmen

| Maßnahme | Beschreibung |
|----------|--------------|
| JWT-Auth | Token-basierte Authentifizierung |
| bcrypt | Passwort-Hashing mit Salt |
| Tenant-Isolation | Vollständige Datentrennung |
| Zod-Validierung | Input-Prüfung Frontend & Backend |
| SQL-Injection-Schutz | Drizzle ORM |
| XSS-Schutz | React's automatisches Escaping |
| CORS | Restriktive Origin-Policies |
| Log-Maskierung | Automatische Maskierung sensibler Daten |
| Security-Logging | Protokollierung sicherheitsrelevanter Ereignisse |

### Defense-in-Depth Tenant-Isolation

```
┌─────────────────────────────────────────────┐
│  1. JWT-Authentifizierung                   │
│     └─ Verifiziert User-Identität           │
├─────────────────────────────────────────────┤
│  2. Route-Layer                             │
│     └─ Extrahiert tenantId aus JWT          │
├─────────────────────────────────────────────┤
│  3. Storage-Layer                           │
│     └─ Validiert Tenant & filtert Queries   │
└─────────────────────────────────────────────┘
```

---

## Lizenz

Dieses Projekt ist urheberrechtlich geschützt. Alle Rechte vorbehalten.

---

**Entwickelt für professionelles Helpdesk-Management**

Version: 1.0.0 | Stand: Dezember 2024
