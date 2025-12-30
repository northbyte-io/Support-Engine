# German Ticket System – Helpdesk Management

Eine vollständige deutsche SaaS-Webanwendung für professionelles Ticket- und Helpdesk-Management mit Multi-Tenant-Architektur, REST-API für Web und iOS, sowie umfangreichen Enterprise-Features.

## Über das Projekt

Das German Ticket System ist eine moderne Helpdesk-Lösung, die speziell für deutschsprachige Unternehmen entwickelt wurde. Die Anwendung bietet:

- **Multi-Tenant-Architektur**: Vollständige Datenisolierung zwischen Mandanten
- **Rollenbasierte Zugriffskontrolle**: Admin, Agent und Kunden-Rollen
- **API-First-Design**: REST-API für Web- und Mobile-Anwendungen (iOS)
- **Moderne UI**: Linear-inspiriertes Design mit Dark/Light Mode
- **Vollständig deutschsprachig**: Alle UI-Texte und Systemmeldungen auf Deutsch

## Funktionen

### Implementiert (Aktueller Stand)

#### Authentifizierung & Benutzerverwaltung
- **JWT-basierte Authentifizierung**: Sichere Token-basierte Anmeldung
- **Passwort-Hashing**: bcrypt für sichere Passwortspeicherung
- **Session-Management**: Persistente Sessions mit automatischer Verlängerung
- **Multi-Tenancy**: Jeder Mandant hat isolierte Daten
- **Benutzerrollen**: 
  - **Admin**: Voller Zugriff auf alle Funktionen
  - **Agent**: Ticket-Bearbeitung und Wissensdatenbank
  - **Kunde**: Ticket-Erstellung und eigene Tickets einsehen

#### Ticket-Management
- **Ticket-Erstellung**: Titel, Beschreibung, Priorität, Typ
- **Status-Workflow**: Offen → In Bearbeitung → Gelöst → Geschlossen
- **Prioritätsstufen**: Niedrig, Mittel, Hoch, Dringend
- **Ticket-Typen**: Konfigurierbare Tickettypen mit benutzerdefinierten Feldern
- **Zuweisung**: Mehrere Bearbeiter pro Ticket möglich
- **Ticket-Nummern**: Automatische Generierung (TKT-XXXXX)
- **Kommentarsystem**: Interne und öffentliche Kommentare
- **Dateianhänge**: Upload und Verwaltung von Anhängen

#### SLA-Management
- **SLA-Definitionen**: Reaktions- und Lösungszeiten je Priorität
- **SLA-Tracking**: Automatische Überwachung der Einhaltung
- **Eskalationen**: Automatische Eskalation bei SLA-Verletzung
- **SLA-Anzeige**: Visueller Status auf Ticket-Details

#### Wissensmanagement (Knowledge Base)
- **Artikel-Verwaltung**: CRUD für Wissensbasis-Artikel
- **Versionierung**: Vollständige Versionshistorie
- **Kategorien**: Strukturierte Organisation
- **Suche**: Volltextsuche in Artikeln
- **Ticket-Verknüpfung**: Artikel mit Tickets verlinken
- **Rich-Text-Editor**: Formatierte Artikelinhalte

#### Zeiterfassung
- **Zeiteinträge**: Erfassung pro Ticket
- **Abrechnungsstatus**: Abrechenbar/Nicht abrechenbar
- **Beschreibungen**: Detaillierte Tätigkeitsbeschreibungen
- **Berichte**: Auswertungen nach Projekt/Kunde
- **Stundensätze**: Konfigurierbare Stundensätze

#### Erweiterte Collaboration
- **@Mention-System**: Benutzer in Kommentaren erwähnen
- **Benachrichtigungen**: Automatische Alerts bei Erwähnungen
- **Beobachter**: Tickets folgen ohne Zuweisung
- **Aktivitätsprotokoll**: Vollständige Änderungshistorie

#### Umfragen (Surveys)
- **Umfrage-Erstellung**: Verschiedene Fragetypen
  - Bewertungsskala (1-5 oder 1-10)
  - Ja/Nein-Fragen
  - Freitext
  - NPS (Net Promoter Score)
- **Automatischer Versand**: Nach Ticket-Schließung
- **Einladungs-Management**: Tracking von Einladungen
- **Ergebnis-Dashboard**: 
  - Antwortrate
  - Durchschnittsbewertung
  - NPS-Score
  - Detaillierte Statistiken pro Frage

#### Asset-Management
- **Asset-Kategorien**: Hardware, Software, Lizenzen, Verträge
- **Asset-Typen**:
  - **Hardware**: Seriennummer, Kaufdatum, Garantie
  - **Software**: Lizenzinformationen, Ablaufdatum
  - **Lizenzen**: Lizenzschlüssel, Typ, Ablauf
  - **Verträge**: Vertragsnummer, Laufzeit, Kündigungsfrist
- **Asset-Verknüpfung**: Assets mit Tickets verbinden
- **Änderungshistorie**: Vollständiges Audit-Log pro Asset
- **Mandantentrennung**: Sichere Isolierung aller Asset-Daten

#### Dashboard & Analytics
- **Statistik-Karten**:
  - Offene Tickets
  - In Bearbeitung
  - Heute gelöst
  - Durchschnittliche Reaktionszeit
- **Workload-Übersicht**: Ticket-Verteilung pro Agent
- **Echtzeit-Updates**: Automatische Aktualisierung
- **Trend-Analyse**: Ticket-Entwicklung über Zeit

#### Benachrichtigungssystem
- **In-App-Benachrichtigungen**: Echtzeit-Alerts
- **Ungelesene Zähler**: Badge mit Anzahl ungelesener Nachrichten
- **Benachrichtigungstypen**:
  - Ticket-Zuweisung
  - Neue Kommentare
  - @Mentions
  - SLA-Warnungen
  - Umfrage-Einladungen

#### Design & UX
- **Dark/Light Mode**: Vollständige Theme-Unterstützung
- **Responsive Design**: Optimiert für alle Bildschirmgrößen
- **Sidebar-Navigation**: Shadcn UI Sidebar-Komponente
- **Inter Font**: Moderne, gut lesbare Typografie
- **Linear-Design**: Utility-fokussiertes, modernes Design
- **Loading States**: Skeleton-Loader für bessere UX
- **Toast-Benachrichtigungen**: Feedback für Benutzeraktionen

### Roadmap (Geplante Features)

#### Projektmanagement
- Projekt-Tabellen mit Kanban-Ansicht
- Konfigurierbare Spalten
- Ticket-zu-Projekt-Verknüpfung
- Projektfortschritt-Tracking

#### Erweiterte Berichte
- Custom Report Builder
- Export zu CSV/PDF
- Erweiterte Dashboard-Charts
- Zeitraum-Filter

#### Genehmigungsworkflows
- Approval-Workflow-Schema
- Multi-Step-Genehmigung pro Tickettyp
- Eskalationspfade

#### Mandantenspezifisches Branding
- Logo-Upload
- Farbschema-Anpassung
- E-Mail-Templates
- Benutzerdefinierte Benachrichtigungen

#### Microsoft-Integrationen
- Azure AD / SSO
- Microsoft Teams-Integration
- Outlook-Kalender-Sync

#### AI-Funktionen
- Automatische Ticket-Kategorisierung
- Antwortvorschläge
- Sentiment-Analyse
- Wissensbasis-Empfehlungen

#### CRM-Features
- Erweiterte Kundenverwaltung
- Kontakthistorie
- Account-Management

## Tech Stack

### Frontend

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| React | 18.x | UI-Framework mit TypeScript |
| Vite | 6.x | Build-Tool mit HMR |
| TailwindCSS | 4.x | Utility-First CSS Framework |
| Shadcn UI | Latest | Komponenten-Bibliothek (Radix UI) |
| React Hook Form | 7.x | Formular-Verwaltung |
| Zod | 3.x | Schema-Validierung |
| TanStack Query | 5.x | Server State Management |
| Wouter | 3.x | Leichtgewichtiges Routing |
| Lucide React | Latest | Icon-Bibliothek |
| Framer Motion | 11.x | Animationen |
| date-fns | 4.x | Datums-Formatierung (DE Locale) |

### Backend

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| Node.js | 20.x | JavaScript Runtime |
| Express | 4.x | HTTP-Server Framework |
| TypeScript | 5.x | Type Safety |
| bcryptjs | 2.x | Passwort-Hashing |
| jsonwebtoken | 9.x | JWT-Authentifizierung |
| express-session | 1.x | Session-Management |
| Zod | 3.x | API-Validierung |

### Datenbank

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| PostgreSQL | 16.x | Relationale Datenbank |
| Drizzle ORM | 0.38.x | Type-safe ORM |
| Drizzle Kit | 0.30.x | Schema-Management |
| connect-pg-simple | 10.x | Session Store |

### Entwicklungswerkzeuge

| Tool | Beschreibung |
|------|--------------|
| TSX | TypeScript-Ausführung |
| esbuild | Production Build |
| Replit Plugins | Dev Banner, Error Modal, Cartographer |

## Architektur

### Projektstruktur

```
├── client/                 # Frontend-Anwendung
│   ├── src/
│   │   ├── components/     # Wiederverwendbare UI-Komponenten
│   │   │   └── ui/         # Shadcn UI Komponenten
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── lib/            # Utility-Funktionen
│   │   ├── pages/          # Seiten-Komponenten
│   │   └── App.tsx         # Haupt-App mit Routing
│   └── index.html
├── server/                 # Backend-Anwendung
│   ├── auth.ts             # Authentifizierung & Middleware
│   ├── routes.ts           # API-Routen
│   ├── storage.ts          # Datenbank-Zugriff (Storage Interface)
│   ├── vite.ts             # Vite-Integration
│   └── index.ts            # Server-Einstiegspunkt
├── shared/                 # Geteilter Code
│   └── schema.ts           # Drizzle-Schema & Zod-Typen
└── design_guidelines.md    # Design-Richtlinien
```

### Datenbank-Schema

#### Kern-Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| `tenants` | Mandanten/Unternehmen |
| `users` | Benutzerkonten |
| `tickets` | Tickets/Anfragen |
| `ticketTypes` | Tickettypen mit benutzerdefinierten Feldern |
| `ticketAssignees` | Ticket-Zuweisungen |
| `ticketComments` | Kommentare |
| `ticketAttachments` | Dateianhänge |

#### SLA & Eskalation

| Tabelle | Beschreibung |
|---------|--------------|
| `slaDefinitions` | SLA-Definitionen |
| `slaEscalations` | Eskalationsregeln |

#### Wissensmanagement

| Tabelle | Beschreibung |
|---------|--------------|
| `kbArticles` | Wissensbasis-Artikel |
| `kbArticleVersions` | Artikel-Versionen |
| `kbCategories` | Kategorien |
| `ticketArticleLinks` | Ticket-Artikel-Verknüpfungen |

#### Zeiterfassung

| Tabelle | Beschreibung |
|---------|--------------|
| `timeEntries` | Zeiteinträge |

#### Umfragen

| Tabelle | Beschreibung |
|---------|--------------|
| `surveys` | Umfragen |
| `surveyQuestions` | Umfrage-Fragen |
| `surveyInvitations` | Einladungen |
| `surveyResponses` | Antworten |

#### Asset-Management

| Tabelle | Beschreibung |
|---------|--------------|
| `assetCategories` | Asset-Kategorien |
| `assets` | Assets (Hardware, Software, etc.) |
| `assetLicenses` | Lizenzinformationen |
| `assetContracts` | Vertragsinformationen |
| `ticketAssets` | Ticket-Asset-Verknüpfungen |
| `assetHistory` | Änderungshistorie |

#### Benachrichtigungen

| Tabelle | Beschreibung |
|---------|--------------|
| `notifications` | Benutzerbenachrichtigungen |

### API-Design

Die REST-API folgt einem konsistenten Design-Pattern:

```
GET    /api/[resource]          # Liste abrufen
GET    /api/[resource]/:id      # Einzelnes Element
POST   /api/[resource]          # Erstellen
PATCH  /api/[resource]/:id      # Aktualisieren
DELETE /api/[resource]/:id      # Löschen
```

#### Authentifizierung

Alle API-Endpunkte (außer `/api/auth/*`) erfordern einen gültigen JWT-Token:

```
Authorization: Bearer <token>
```

#### Mandantentrennung

Alle Datenbankabfragen werden automatisch nach `tenantId` gefiltert. Die Storage-Schicht erzwingt Tenant-Isolation mit Defense-in-Depth:

1. **Route-Layer**: Extrahiert `tenantId` aus JWT
2. **Storage-Layer**: Validiert Tenant-Existenz und filtert alle Queries

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

### Entwicklungsserver starten

```bash
# Abhängigkeiten installieren
npm install

# Datenbank-Schema synchronisieren
npm run db:push

# Entwicklungsserver starten
npm run dev
```

Die Anwendung ist dann unter `http://localhost:5000` verfügbar.

### Demo-Zugangsdaten

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@demo.de | admin123 |
| Agent | agent@demo.de | agent123 |
| Kunde | kunde@demo.de | kunde123 |

## Benutzerrollen & Berechtigungen

### Admin
- Vollzugriff auf alle Funktionen
- Benutzerverwaltung
- Mandanten-Einstellungen
- Asset-Management
- Umfragen erstellen und verwalten
- SLA-Definitionen

### Agent
- Tickets bearbeiten und zuweisen
- Wissensbasis-Artikel erstellen
- Zeiteinträge erfassen
- Assets einsehen und verwalten
- Interne Kommentare

### Kunde
- Eigene Tickets erstellen
- Ticket-Status einsehen
- Öffentliche Kommentare
- Wissensbasis durchsuchen
- Umfragen beantworten

## Sicherheit

### Implementierte Sicherheitsmaßnahmen

- **JWT-Authentifizierung**: Sichere Token-basierte Auth
- **Passwort-Hashing**: bcrypt mit Salt
- **Mandantentrennung**: Vollständige Datenisolierung
- **Input-Validierung**: Zod-Schemas auf Frontend und Backend
- **SQL-Injection-Schutz**: Drizzle ORM mit Prepared Statements
- **XSS-Schutz**: React's automatisches Escaping
- **CORS-Konfiguration**: Restriktive Origin-Policies

### Tenant-Isolation

Die Storage-Schicht implementiert Defense-in-Depth für Mandantentrennung:

1. **Create-Operationen**: Validieren Tenant-Existenz, strippen tenantId aus Payload
2. **Update-Operationen**: Strippen tenantId und id aus Updates
3. **Query-Filter**: Alle Abfragen filtern nach tenantId
4. **Fremdschlüssel-Schutz**: Lizenz/Vertrag-Updates verhindern Asset-Neuzuweisung

## Lizenz

Dieses Projekt ist urheberrechtlich geschützt. Alle Rechte vorbehalten.

---

Entwickelt mit modernen Web-Technologien für professionelles Helpdesk-Management.
