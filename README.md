# 🎫 German Ticket System – Helpdesk Management

Eine vollständige deutsche SaaS-Webanwendung für professionelles Ticket- und Helpdesk-Management mit Multi-Tenant-Architektur, REST-API für Web und iOS, sowie umfangreichen Enterprise-Features.

---

## 📑 Inhaltsverzeichnis

- [🎯 Über das Projekt](#-über-das-projekt)
- [✨ Funktionen](#-funktionen)
  - [✅ Implementierte Features](#-implementierte-features)
  - [🚀 Roadmap](#-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architektur](#️-architektur)
- [💾 Datenbank-Schema](#-datenbank-schema)
- [🔌 API-Design](#-api-design)
- [⚡ Installation & Setup](#-installation--setup)
- [👥 Benutzerrollen & Berechtigungen](#-benutzerrollen--berechtigungen)
- [🔒 Sicherheit](#-sicherheit)
- [📄 Lizenz](#-lizenz)

---

## 🎯 Über das Projekt

Das **German Ticket System** ist eine moderne Helpdesk-Lösung, die speziell für deutschsprachige Unternehmen entwickelt wurde.

### Kernfunktionen auf einen Blick:

| Feature | Beschreibung |
|---------|--------------|
| 🏢 **Multi-Tenant** | Vollständige Datenisolierung zwischen Mandanten |
| 🔐 **Rollenbasiert** | Admin, Agent und Kunden-Rollen mit feingranularen Berechtigungen |
| 📱 **API-First** | REST-API für Web- und Mobile-Anwendungen (iOS) |
| 🎨 **Modernes Design** | Linear-inspiriertes UI mit Dark/Light Mode |
| 🇩🇪 **Deutschsprachig** | Alle UI-Texte und Systemmeldungen auf Deutsch |

---

## ✨ Funktionen

### ✅ Implementierte Features

#### 🔑 Authentifizierung & Benutzerverwaltung

- ✅ JWT-basierte Authentifizierung
- ✅ Sichere Passwortspeicherung mit bcrypt
- ✅ Session-Management mit automatischer Verlängerung
- ✅ Multi-Tenancy mit isolierten Mandanten
- ✅ Drei Benutzerrollen: Admin, Agent, Kunde

#### 🎫 Ticket-Management

- ✅ Ticket-Erstellung mit Titel, Beschreibung, Priorität
- ✅ Status-Workflow: `Offen` → `In Bearbeitung` → `Gelöst` → `Geschlossen`
- ✅ Prioritätsstufen: Niedrig, Mittel, Hoch, Dringend
- ✅ Konfigurierbare Tickettypen mit benutzerdefinierten Feldern
- ✅ Mehrfachzuweisung an Bearbeiter
- ✅ Automatische Ticket-Nummern (TKT-XXXXX)
- ✅ Interne & öffentliche Kommentare
- ✅ Dateianhänge

#### ⏱️ SLA-Management

- ✅ SLA-Definitionen pro Priorität
- ✅ Automatisches Tracking von Reaktions- & Lösungszeiten
- ✅ Eskalationsregeln bei SLA-Verletzung
- ✅ Visueller SLA-Status auf Ticket-Details

#### 📚 Wissensmanagement (Knowledge Base)

- ✅ Artikel-Verwaltung mit CRUD-Operationen
- ✅ Vollständige Versionierung
- ✅ Kategorisierung
- ✅ Volltextsuche
- ✅ Ticket-Artikel-Verknüpfung
- ✅ Rich-Text-Editor

#### ⏰ Zeiterfassung

- ✅ Zeiteinträge pro Ticket
- ✅ Abrechenbar/Nicht abrechenbar Status
- ✅ Detaillierte Tätigkeitsbeschreibungen
- ✅ Berichte nach Projekt/Kunde
- ✅ Konfigurierbare Stundensätze

#### 💬 Erweiterte Collaboration

- ✅ @Mention-System in Kommentaren
- ✅ Automatische Benachrichtigungen
- ✅ Beobachter-Funktion für Tickets
- ✅ Vollständiges Aktivitätsprotokoll

#### 📊 Umfragen (Surveys)

- ✅ Verschiedene Fragetypen:
  - ⭐ Bewertungsskala (1-5 oder 1-10)
  - ✅ Ja/Nein-Fragen
  - 📝 Freitext
  - 📈 NPS (Net Promoter Score)
- ✅ Automatischer Versand nach Ticket-Schließung
- ✅ Einladungs-Management
- ✅ Ergebnis-Dashboard mit Statistiken

#### 🖥️ Asset-Management

- ✅ Asset-Kategorien: Hardware, Software, Lizenzen, Verträge
- ✅ Detaillierte Asset-Informationen:
  - 💻 Hardware: Seriennummer, Kaufdatum, Garantie
  - 📦 Software: Lizenzinfos, Ablaufdatum
  - 🔑 Lizenzen: Schlüssel, Typ, Ablauf
  - 📋 Verträge: Laufzeit, Kündigungsfrist
- ✅ Asset-Ticket-Verknüpfung
- ✅ Vollständige Änderungshistorie
- ✅ Sichere Mandantentrennung

#### 📈 Dashboard & Analytics

- ✅ Statistik-Karten:
  - 📊 Offene Tickets
  - 🔄 In Bearbeitung
  - ✅ Heute gelöst
  - ⏱️ Durchschnittliche Reaktionszeit
- ✅ Workload-Übersicht pro Agent
- ✅ Echtzeit-Updates
- ✅ Trend-Analyse

#### 🔔 Benachrichtigungssystem

- ✅ In-App-Benachrichtigungen
- ✅ Ungelesene-Zähler Badge
- ✅ Benachrichtigungstypen:
  - 👤 Ticket-Zuweisung
  - 💬 Neue Kommentare
  - 📢 @Mentions
  - ⚠️ SLA-Warnungen
  - 📋 Umfrage-Einladungen

#### 🎨 Design & UX

- ✅ Dark/Light Mode
- ✅ Responsive Design
- ✅ Shadcn UI Sidebar
- ✅ Inter Font
- ✅ Linear-inspiriertes Design
- ✅ Skeleton-Loader
- ✅ Toast-Benachrichtigungen

---

### 🚀 Roadmap

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| 📋 Projektmanagement | 🔜 Geplant | Kanban-Board, Projekt-Tracking |
| 📊 Erweiterte Berichte | 🔜 Geplant | Report Builder, CSV/PDF Export |
| ✅ Genehmigungsworkflows | 🔜 Geplant | Multi-Step-Approval |
| 🎨 Mandanten-Branding | 🔜 Geplant | Logo, Farben, E-Mail-Templates |
| 🔗 Microsoft-Integration | 📅 Später | Azure AD, Teams, Outlook |
| 🤖 AI-Funktionen | 📅 Später | Auto-Kategorisierung, Vorschläge |
| 👥 CRM-Features | 📅 Später | Erweiterte Kundenverwaltung |

---

## 🛠️ Tech Stack

### Frontend

| Technologie | Beschreibung |
|-------------|--------------|
| ⚛️ React 18 | UI-Framework mit TypeScript |
| ⚡ Vite 6 | Build-Tool mit HMR |
| 🎨 TailwindCSS 4 | Utility-First CSS |
| 🧩 Shadcn UI | Komponenten (Radix UI) |
| 📝 React Hook Form | Formular-Verwaltung |
| ✅ Zod | Schema-Validierung |
| 🔄 TanStack Query 5 | Server State |
| 🛤️ Wouter | Routing |
| 🎯 Lucide React | Icons |
| 🎬 Framer Motion | Animationen |

### Backend

| Technologie | Beschreibung |
|-------------|--------------|
| 🟢 Node.js 20 | JavaScript Runtime |
| 🚂 Express 4 | HTTP-Server |
| 📘 TypeScript 5 | Type Safety |
| 🔐 bcryptjs | Passwort-Hashing |
| 🎫 jsonwebtoken | JWT-Auth |
| 🗃️ express-session | Sessions |
| ✅ Zod | API-Validierung |

### Datenbank

| Technologie | Beschreibung |
|-------------|--------------|
| 🐘 PostgreSQL 16 | Relationale DB |
| 🌿 Drizzle ORM | Type-safe ORM |
| 🔧 Drizzle Kit | Schema-Management |

---

## 🏗️ Architektur

### 📁 Projektstruktur

```
📦 german-ticket-system
├── 📂 client/                 # Frontend
│   ├── 📂 src/
│   │   ├── 📂 components/     # UI-Komponenten
│   │   │   └── 📂 ui/         # Shadcn UI
│   │   ├── 📂 hooks/          # Custom Hooks
│   │   ├── 📂 lib/            # Utilities
│   │   ├── 📂 pages/          # Seiten
│   │   └── 📄 App.tsx         # Haupt-App
│   └── 📄 index.html
├── 📂 server/                 # Backend
│   ├── 📄 auth.ts             # Authentifizierung
│   ├── 📄 routes.ts           # API-Routen
│   ├── 📄 storage.ts          # Datenbankzugriff
│   └── 📄 index.ts            # Server-Start
├── 📂 shared/                 # Geteilter Code
│   └── 📄 schema.ts           # Drizzle-Schema
└── 📄 design_guidelines.md    # Design-System
```

---

## 💾 Datenbank-Schema

### 🗄️ Kern-Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| 🏢 `tenants` | Mandanten/Unternehmen |
| 👤 `users` | Benutzerkonten |
| 🎫 `tickets` | Tickets/Anfragen |
| 📋 `ticketTypes` | Tickettypen |
| 👥 `ticketAssignees` | Zuweisungen |
| 💬 `ticketComments` | Kommentare |
| 📎 `ticketAttachments` | Anhänge |

### ⏱️ SLA & Eskalation

| Tabelle | Beschreibung |
|---------|--------------|
| ⏰ `slaDefinitions` | SLA-Definitionen |
| 🚨 `slaEscalations` | Eskalationsregeln |

### 📚 Wissensmanagement

| Tabelle | Beschreibung |
|---------|--------------|
| 📄 `kbArticles` | Artikel |
| 📝 `kbArticleVersions` | Versionen |
| 📁 `kbCategories` | Kategorien |
| 🔗 `ticketArticleLinks` | Verknüpfungen |

### ⏰ Zeiterfassung

| Tabelle | Beschreibung |
|---------|--------------|
| ⏱️ `timeEntries` | Zeiteinträge |

### 📊 Umfragen

| Tabelle | Beschreibung |
|---------|--------------|
| 📋 `surveys` | Umfragen |
| ❓ `surveyQuestions` | Fragen |
| 📧 `surveyInvitations` | Einladungen |
| ✅ `surveyResponses` | Antworten |

### 🖥️ Asset-Management

| Tabelle | Beschreibung |
|---------|--------------|
| 📁 `assetCategories` | Kategorien |
| 💻 `assets` | Assets |
| 🔑 `assetLicenses` | Lizenzen |
| 📋 `assetContracts` | Verträge |
| 🔗 `ticketAssets` | Verknüpfungen |
| 📜 `assetHistory` | Historie |

---

## 🔌 API-Design

### REST-Endpunkte

```http
GET    /api/[resource]          # 📋 Liste abrufen
GET    /api/[resource]/:id      # 🔍 Einzelnes Element
POST   /api/[resource]          # ➕ Erstellen
PATCH  /api/[resource]/:id      # ✏️ Aktualisieren
DELETE /api/[resource]/:id      # 🗑️ Löschen
```

### 🔐 Authentifizierung

```http
Authorization: Bearer <jwt-token>
```

### 🏢 Mandantentrennung

Alle API-Abfragen werden automatisch nach `tenantId` gefiltert:

1. **Route-Layer**: Extrahiert `tenantId` aus JWT
2. **Storage-Layer**: Validiert und filtert alle Queries

---

## ⚡ Installation & Setup

### 📋 Voraussetzungen

- ✅ Node.js 20.x oder höher
- ✅ PostgreSQL 16.x
- ✅ npm oder yarn

### 🔧 Umgebungsvariablen

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secure-session-secret
```

### 🚀 Schnellstart

```bash
# 1️⃣ Abhängigkeiten installieren
npm install

# 2️⃣ Datenbank-Schema synchronisieren
npm run db:push

# 3️⃣ Entwicklungsserver starten
npm run dev
```

Die Anwendung ist dann unter `http://localhost:5000` verfügbar.

### 🔑 Demo-Zugangsdaten

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| 👑 Admin | admin@demo.de | admin123 |
| 👷 Agent | agent@demo.de | agent123 |
| 👤 Kunde | kunde@demo.de | kunde123 |

---

## 👥 Benutzerrollen & Berechtigungen

### 👑 Admin

| Berechtigung | Status |
|--------------|--------|
| Alle Funktionen | ✅ |
| Benutzerverwaltung | ✅ |
| Mandanten-Einstellungen | ✅ |
| Asset-Management | ✅ |
| Umfragen verwalten | ✅ |
| SLA-Definitionen | ✅ |

### 👷 Agent

| Berechtigung | Status |
|--------------|--------|
| Tickets bearbeiten | ✅ |
| Tickets zuweisen | ✅ |
| KB-Artikel erstellen | ✅ |
| Zeiteinträge erfassen | ✅ |
| Assets verwalten | ✅ |
| Interne Kommentare | ✅ |

### 👤 Kunde

| Berechtigung | Status |
|--------------|--------|
| Eigene Tickets erstellen | ✅ |
| Ticket-Status einsehen | ✅ |
| Öffentliche Kommentare | ✅ |
| Wissensbasis durchsuchen | ✅ |
| Umfragen beantworten | ✅ |

---

## 🔒 Sicherheit

### ✅ Implementierte Maßnahmen

| Maßnahme | Beschreibung |
|----------|--------------|
| 🔐 JWT-Auth | Token-basierte Authentifizierung |
| 🔑 bcrypt | Passwort-Hashing mit Salt |
| 🏢 Tenant-Isolation | Vollständige Datentrennung |
| ✅ Zod-Validierung | Input-Prüfung Frontend & Backend |
| 🛡️ SQL-Injection | Schutz durch Drizzle ORM |
| 🔒 XSS-Schutz | React's automatisches Escaping |
| 🌐 CORS | Restriktive Origin-Policies |

### 🏢 Defense-in-Depth Tenant-Isolation

```
┌─────────────────────────────────────────────┐
│  1️⃣  JWT-Authentifizierung                  │
│      └─ Verifiziert User-Identität          │
├─────────────────────────────────────────────┤
│  2️⃣  Route-Layer                            │
│      └─ Extrahiert tenantId aus JWT         │
├─────────────────────────────────────────────┤
│  3️⃣  Storage-Layer                          │
│      └─ Validiert Tenant & filtert Queries  │
└─────────────────────────────────────────────┘
```

---

## 📄 Lizenz

Dieses Projekt ist urheberrechtlich geschützt. Alle Rechte vorbehalten.

---

<div align="center">

**Entwickelt mit ❤️ für professionelles Helpdesk-Management**

⭐ [Demo ansehen](http://localhost:5000) | 📧 [Support](mailto:support@example.com)

</div>
