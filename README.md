<div align="center">

# Support-Engine

**Enterprise-grade Helpdesk & Ticket Management Platform**

[![Release](https://img.shields.io/badge/release-v0.1.4-blue?style=flat-square)](https://github.com/northbyte-io/Support-Engine/releases)
[![License](https://img.shields.io/badge/license-AGPL--3.0-purple?style=flat-square)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square)](https://nodejs.org/)
[![Build](https://img.shields.io/badge/build-passing-success?style=flat-square)]()
[![API](https://img.shields.io/badge/api-stable-blue?style=flat-square)]()
[![Docker](https://img.shields.io/badge/docker-supported-2496ED?style=flat-square)]()
[![Maintenance](https://img.shields.io/badge/maintenance-active-brightgreen?style=flat-square)]()

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)]()
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)]()
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)]()

[![SonarQube Cloud](https://sonarcloud.io/images/project_badges/sonarcloud-dark.svg)](https://sonarcloud.io/summary/new_code?id=northbyte-io_Support-Engine)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=northbyte-io_Support-Engine&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=northbyte-io_Support-Engine)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=northbyte-io_Support-Engine&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=northbyte-io_Support-Engine)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=northbyte-io_Support-Engine&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=northbyte-io_Support-Engine)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=northbyte-io_Support-Engine&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=northbyte-io_Support-Engine)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=northbyte-io_Support-Engine&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=northbyte-io_Support-Engine)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=northbyte-io_Support-Engine&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=northbyte-io_Support-Engine)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=northbyte-io_Support-Engine&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=northbyte-io_Support-Engine)

Multi-Tenant | REST API | SLA Management | CRM | Knowledge Base | Asset Management | Exchange Online | Erweiterte Berichte | Globale Suche

</div>

---

# 🎫 Support-Engine – Helpdesk Management

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
- [📘 Administrationsanleitung](#-administrationsanleitung)

---

## 🎯 Über das Projekt

**Support-Engine** ist eine moderne Helpdesk-Lösung, die speziell für deutschsprachige Unternehmen entwickelt wurde.

### Kernfunktionen auf einen Blick:

| Feature                    | Beschreibung                                                       |
| -------------------------- | ------------------------------------------------------------------ |
| 🏢 **Multi-Tenant**        | Vollständige Datenisolierung zwischen Mandanten                    |
| 🔐 **Rollenbasiert**       | Admin, Agent und Kunden-Rollen mit feingranularen Berechtigungen   |
| 📱 **API-First**           | REST-API für Web- und Mobile-Anwendungen (iOS)                     |
| 🎨 **Modernes Design**     | Amber/Navy Design-System mit Dark/Light Mode                       |
| 🇩🇪 **Deutschsprachig**    | Alle UI-Texte und Systemmeldungen auf Deutsch                      |
| 🔍 **Globale Suche**       | Mandantenübergreifende Suche in Tickets, KB, Kunden und Kontakten  |
| 📊 **Erweiterte Berichte** | Ticket-, SLA- und Zeitanalysen mit Export als CSV, XLSX, PDF, HTML |

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
- ✅ Status-Workflow: `Offen` → `In Bearbeitung` → `Wartend` → `Gelöst` → `Geschlossen`
- ✅ Prioritätsstufen: Niedrig, Mittel, Hoch, Dringend
- ✅ Konfigurierbare Tickettypen mit benutzerdefinierten Feldern
- ✅ Mehrfachzuweisung an Bearbeiter
- ✅ Automatische Ticket-Nummern (TKT-XXXXX)
- ✅ Interne & öffentliche Kommentare
- ✅ Dateianhänge

```
┌──────────┐    ┌───────────────┐    ┌──────────┐    ┌──────────┐    ┌────────────┐
│  Offen   │ →  │ In Bearbeitung│ →  │ Wartend  │ →  │  Gelöst  │ →  │ Geschlossen│
└──────────┘    └───────────────┘    └──────────┘    └──────────┘    └────────────┘
```

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

- ✅ Statistik-Karten: Offene Tickets, SLA-Verletzungen, Heute gelöst, Ø Reaktionszeit
- ✅ Ticket-Tabelle mit Filter-Tabs (Alle / Offen / Meine) und SLA-Fortschrittsbalken
- ✅ SLA-Übersicht mit 4 Radialdiagrammen (Reaktionszeit, Lösungszeit, Compliance, Verletzungen)
- ✅ Aktivitätsfeed mit Echtzeit-Updates
- ✅ Balkendiagramm „Tickets pro Tag" (heute = Amber hervorgehoben)
- ✅ Agent-Performance-Tabelle mit Lösungsrate und Workload

#### 📊 Erweiterte Berichte & Analysen

- ✅ **Ticket-Analyse**:
  - 📅 Tickets pro Tag (Balkendiagramm)
  - 🥧 Verteilung nach Status und Priorität (Tortendiagramme)
  - 👥 Agenten-Performance-Tabelle mit Lösungsrate
- ✅ **SLA-Performance**:
  - 📈 Compliance-Rate mit Farbkodierung (grün/gelb/rot)
  - ⏱️ Durchschnittliche Reaktions- und Lösungszeit
  - 📉 SLA-Verlauf als Liniendiagramm
- ✅ **Zeiterfassung-Auswertung**:
  - 🕐 Gesamtstunden und abrechenbare Zeit pro Agent
  - 💰 Berechneter Gesamtbetrag aus abrechenbaren Einträgen
  - 📊 Tägliche Zeitaufschlüsselung
- ✅ **Zeitraumfilter**: 7 Tage / 30 Tage / 90 Tage / Benutzerdefiniert
- ✅ **Export in 4 Formaten**:
  - 📄 CSV (Excel-kompatibel, UTF-8 BOM, semikolongetrennt)
  - 📊 XLSX (natives Excel-Format via SheetJS)
  - 📕 PDF (serverseitig generiert via PDFKit)
  - 🌐 HTML (druckfertig, gestyltes Dokument)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   📊 Berichte & Analysen                             │
├──────────────────┬──────────────────┬──────────────────────────────┤
│   🎫 Tickets     │   🛡️ SLA         │   ⏱️ Zeiterfassung           │
├──────────────────┼──────────────────┼──────────────────────────────┤
│  Tägl. Verlauf   │ Compliance-Rate  │  Stunden pro Agent            │
│  Nach Status     │ Ø Antwortzeit    │  Abrechenbar / Nicht          │
│  Nach Priorität  │ Ø Lösungszeit    │  Gesamtbetrag                 │
│  Top-Agents      │ Tages-Trend      │  Tages-Verlauf                │
└──────────────────┴──────────────────┴──────────────────────────────┘
           ↓ Export: CSV · XLSX · PDF · HTML
```

#### 🔍 Globale Suche

- ✅ Mandantenweite Suche über alle Inhaltstypen
- ✅ Ergebnisse gruppiert nach: Tickets, Wissensdatenbank, Kunden, Unternehmen, Kontakte
- ✅ Debounced-Eingabe (300 ms) für performantes Suchen
- ✅ Suchleiste in der globalen Navigation – von jeder Seite erreichbar
- ✅ Enter-Taste navigiert direkt zur Suchergebnisseite

#### 🔔 Benachrichtigungssystem

- ✅ In-App-Benachrichtigungen
- ✅ Ungelesene-Zähler Badge
- ✅ Benachrichtigungstypen:
  - 👤 Ticket-Zuweisung
  - 💬 Neue Kommentare
  - 📢 @Mentions
  - ⚠️ SLA-Warnungen
  - 📋 Umfrage-Einladungen

#### 📋 Projektmanagement & Kanban

- ✅ Projekte erstellen und verwalten
- ✅ Kanban-Board mit Drag-and-Drop
- ✅ Spalten pro Status: Offen, In Bearbeitung, Gelöst, Geschlossen
- ✅ WIP-Limits (Work in Progress)
- ✅ Tickets per Drag-and-Drop zwischen Spalten verschieben
- ✅ Mehrfache Projektzuordnung pro Ticket
- ✅ Automatische Board-Synchronisation bei Statusänderungen

```
┌─────────────────────────────────────────────────────────────────────┐
│                        📋 Kanban Board                              │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────┤
│   📥 Offen  │ 🔄 In Bearb.│  ⏳ Wartend │  ✅ Gelöst  │ 🔒 Geschl. │
├─────────────┼─────────────┼─────────────┼─────────────┼────────────┤
│  ┌───────┐  │  ┌───────┐  │  ┌───────┐  │  ┌───────┐  │ ┌───────┐  │
│  │TKT-001│  │  │TKT-003│  │  │TKT-005│  │  │TKT-007│  │ │TKT-009│  │
│  └───────┘  │  └───────┘  │  └───────┘  │  └───────┘  │ └───────┘  │
│  ┌───────┐  │  ┌───────┐  │             │  ┌───────┐  │ ┌───────┐  │
│  │TKT-002│  │  │TKT-004│  │             │  │TKT-008│  │ │TKT-010│  │
│  └───────┘  │  └───────┘  │             │  └───────┘  │ └───────┘  │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────┘
```

#### 🏢 CRM-Modul (Customer Relationship Management)

- ✅ **Organisationen**: Unternehmensgruppen und Konzerne verwalten
  - 🏛️ Rechtlicher Name, Branche, Kontaktdaten
  - 📍 Standortinformationen
  - ✅ Aktiv/Inaktiv-Status
- ✅ **Kunden**: Vollständige Kundenverwaltung
  - 🔢 Automatische Kundennummern (KD-XXXXX)
  - 🏢 Organisationszuordnung
  - 👤 Account-Manager-Zuweisung
  - ⭐ Prioritätsstufen
- ✅ **Standorte**: Mehrere Standorte pro Kunde
  - 📍 Hauptstandort-Kennzeichnung
  - 🏠 Vollständige Adressdaten
- ✅ **Kontakte**: Ansprechpartner verwalten
  - 💼 Position, Abteilung
  - 📞 Mehrere Kommunikationskanäle
  - ⭐ Primärkontakt-Kennzeichnung
  - 🔗 Ticket-Kontakt-Verknüpfung
- ✅ **Aktivitätsverfolgung**: Kundeninteraktionen protokollieren
  - 📞 Anrufe, 📧 E-Mails, 🤝 Meetings, 📝 Notizen
  - ⏰ Automatische Zeitstempel

```
┌─────────────────────────────────────────────────────────────────────┐
│                        🏢 CRM-Struktur                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────┐                                              │
│   │  🏛️ Organisation │                                              │
│   │   (Konzern AG)   │                                              │
│   └────────┬─────────┘                                              │
│            │                                                        │
│   ┌────────┴────────────────────┐                                   │
│   │                             │                                   │
│   ▼                             ▼                                   │
│ ┌─────────────────┐   ┌─────────────────┐                          │
│ │  👥 Kunde       │   │  👥 Kunde       │                          │
│ │  (KD-00001)     │   │  (KD-00002)     │                          │
│ └────────┬────────┘   └─────────────────┘                          │
│          │                                                          │
│   ┌──────┴──────┐                                                   │
│   │             │                                                   │
│   ▼             ▼                                                   │
│ ┌──────────┐ ┌──────────┐                                          │
│ │📍Standort│ │📍Standort│                                          │
│ │ (Berlin) │ │ (München)│                                          │
│ └────┬─────┘ └──────────┘                                          │
│      │                                                              │
│      ▼                                                              │
│ ┌─────────────────┐                                                │
│ │  👤 Kontakt     │                                                │
│ │  (Hr. Schmidt)  │                                                │
│ └─────────────────┘                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 📊 System-Logging & Monitoring

- ✅ Umfassendes Logging-System mit Winston
- ✅ **Log-Level**:
  - 🐛 Debug: Entwicklungsdetails
  - ℹ️ Info: Allgemeine Systeminformationen
  - ⚠️ Warn: Warnungen und potenzielle Probleme
  - ❌ Error: Fehler mit Ursache und Lösungsvorschlag
  - 🛡️ Security: Sicherheitsrelevante Ereignisse
  - ⚡ Performance: Leistungsmetriken
- ✅ **Log-Quellen**: API, Auth, Ticket, SLA, CRM, E-Mail, Integration, Datenbank, System, Exchange
- ✅ **Features**:
  - 🎨 Farbkodierte Konsolenausgabe
  - 🔄 Tägliche Logrotation (max. 2 GB pro Datei)
  - 📅 7-Tage-Aufbewahrung
  - 🔒 Automatische Maskierung sensibler Daten
  - 💾 In-Memory-Buffer für schnelle UI-Abfragen
- ✅ **Admin-UI**:
  - 🔍 Filterung nach Level und Quelle
  - 🔎 Volltextsuche
  - 📄 Paginierung
  - 📤 Export (TXT, CSV, JSON)
  - 🧪 Test-Log-Generator für alle Level

#### 🎨 Mandanten-Branding

- ✅ **Logos**: Separate Logos für Light/Dark Mode + Favicon
- ✅ **Farben**: Primär-, Sekundär- und Akzentfarben anpassbar
- ✅ **Schriftarten**: 10 Schriftarten-Optionen (Inter, Roboto, Open Sans, etc.)
- ✅ **E-Mail-Templates**: Header/Footer-HTML, Absender-Name und Adresse
- ✅ **Custom CSS**: Erweiterte Styling-Anpassungen möglich
- ✅ **Kontaktdaten**: Website, Support-E-Mail, Telefon
- ✅ **Dynamische Anwendung**: CSS-Variablen werden in Echtzeit aktualisiert
- ✅ **Live-Vorschau**: Vorschau der Branding-Änderungen im Admin-Bereich

#### 🔐 TLS-Zertifikatsverwaltung

- ✅ **Let's Encrypt Integration**: ACME-Protokoll-Unterstützung
- ✅ **Challenge-Typen**: HTTP-01 Challenge für Domain-Validierung
- ✅ **Umgebungen**: Staging und Production CA
- ✅ **Zertifikats-Lifecycle**:
  - 📥 Anfordern neuer Zertifikate
  - 🔄 Automatische Erneuerung vor Ablauf
  - 🗑️ Widerrufen bei Bedarf
- ✅ **Sicherheit**:
  - 🔒 AES-256-GCM verschlüsselte Private Keys
  - 🗄️ Persistente Challenge-Speicherung in der Datenbank
  - 🏢 Mandanten-spezifische Zertifikate
- ✅ **Admin-UI**:
  - ⚙️ Einstellungen (E-Mail, CA-Typ, Auto-Erneuerung)
  - 📋 Zertifikatsliste mit Status
  - 📜 Aktionshistorie

> **Hinweis:** Die TLS-Zertifikatsverwaltung erfordert einen eigenen Server mit öffentlich erreichbarer Domain. In Hosting-Umgebungen wie Replit kann die HTTP-01 Challenge aufgrund von Proxy-Konfigurationen nicht validiert werden.

#### 📧 Exchange Online Integration

- ✅ **Microsoft Graph API**: Vollständige Integration für Exchange Online
- ✅ **Authentifizierung**: Client Secret oder Zertifikat (Azure Entra ID)
- ✅ **Postfach-Typen**:
  - 📥 Eingehend: E-Mails werden als Tickets importiert
  - 📤 Ausgehend: Für Ticket-Benachrichtigungen
  - 📧 Geteilt: Kombinierte Funktionalität
- ✅ **Post-Import-Aktionen**: Als gelesen markieren, in Ordner verschieben, archivieren, löschen
- ✅ **Zuweisungsregeln**: Automatische Ticket-Erstellung basierend auf Betreff-Schlüsselwörtern, Absender-E-Mail/Domain und E-Mail-Text
- ✅ **Synchronisation**: Konfigurierbare Intervalle (5/15/30/60 Min.), manuelle Synchronisation, Sync-Protokoll
- ✅ **Admin-UI**: 6-Schritte-Einrichtungsassistent
- ✅ **Sicherheit**: AES-256-GCM verschlüsselte Client-Secrets

> **Erforderliche Azure AD Berechtigungen**: Mail.Read, Mail.ReadWrite, Mail.Send
>
> **Siehe auch**: [EXCHANGE_EINRICHTUNG.md](./EXCHANGE_EINRICHTUNG.md) für eine vollständige Einrichtungsanleitung

#### 🎨 Design & UX

- ✅ Dark/Light Mode
- ✅ Responsive Design
- ✅ Shadcn UI Sidebar
- ✅ Amber/Navy Design-System (Syne · DM Sans · JetBrains Mono)
- ✅ Redesigned Dashboard mit Radialdiagrammen und Aktivitätsfeed
- ✅ Globale Suchleiste in der Navigation (alle Seiten)
- ✅ Skeleton-Loader und leere Zustände
- ✅ Toast-Benachrichtigungen
- ✅ Einheitliches MainLayout für alle Seiten
- ✅ Lizenz-Footer mit Links zu `/api/license` und `/api/source`

---

### 🚀 Roadmap

| Feature                          | Status       | Beschreibung                                                |
| -------------------------------- | ------------ | ----------------------------------------------------------- |
| 📋 Projektmanagement             | ✅ Fertig    | Kanban-Board, Projekt-Tracking                              |
| 🏢 CRM-Modul                     | ✅ Fertig    | Organisationen, Kunden, Kontakte, Standorte                 |
| 📊 System-Logging                | ✅ Fertig    | Umfassendes Logging mit Admin-UI                            |
| 🎨 Mandanten-Branding            | ✅ Fertig    | Logos, Farben, Schriftarten, E-Mail-Templates, Custom CSS   |
| 🔐 TLS-Zertifikatsverwaltung     | ✅ Fertig    | Let's Encrypt Integration, ACME-Protokoll, Auto-Erneuerung  |
| 📧 Exchange Online Integration   | ✅ Fertig    | Microsoft Graph API, E-Mail-Import, Zuweisungsregeln        |
| 📈 Erweiterte Berichte           | ✅ Fertig    | Ticket-, SLA- und Zeitanalyse; Export CSV/XLSX/PDF/HTML     |
| 🔍 Globale Suche                 | ✅ Fertig    | Tickets, KB, Kunden, Kontakte – von jeder Seite erreichbar  |
| 🖥️ Dashboard-Redesign            | ✅ Fertig    | Radialdiagramme, Aktivitätsfeed, Agent-Performance          |
| ✅ Genehmigungsworkflows         | 🔜 Geplant   | Multi-Step-Approval für Tickets                             |
| 🔗 Azure AD / SSO                | 🔜 Geplant   | Single Sign-On via Azure Entra ID                           |
| 💬 Teams-Integration             | 🔜 Geplant   | Benachrichtigungen und Ticket-Updates via Microsoft Teams   |
| 🤖 AI-Funktionen                 | 📅 Später    | Auto-Kategorisierung, KB-Vorschläge, intelligente Zuweisung |

---

## 🛠️ Tech Stack

### Frontend

| Technologie         | Beschreibung                |
| ------------------- | --------------------------- |
| ⚛️ React 18         | UI-Framework mit TypeScript |
| ⚡ Vite 6           | Build-Tool mit HMR          |
| 🎨 TailwindCSS 4    | Utility-First CSS           |
| 🧩 Shadcn UI        | Komponenten (Radix UI)      |
| 📝 React Hook Form  | Formular-Verwaltung         |
| ✅ Zod              | Schema-Validierung          |
| 🔄 TanStack Query 5 | Server State                |
| 🛤️ Wouter           | Routing                     |
| 🎯 Lucide React     | Icons                       |
| 📊 Recharts         | Diagramme & Analysen        |
| 🖱️ dnd-kit          | Drag-and-Drop               |

### Backend

| Technologie     | Beschreibung              |
| --------------- | ------------------------- |
| 🟢 Node.js 20   | JavaScript Runtime        |
| 🚂 Express 4    | HTTP-Server               |
| 📘 TypeScript 5 | Type Safety               |
| 🔐 bcryptjs     | Passwort-Hashing          |
| 🎫 jsonwebtoken | JWT-Auth                  |
| 📊 Winston      | Logging-Framework         |
| 📕 PDFKit       | PDF-Generierung           |
| 📊 SheetJS      | XLSX-Export               |
| ✅ Zod          | API-Validierung           |

### Datenbank

| Technologie      | Beschreibung      |
| ---------------- | ----------------- |
| 🐘 PostgreSQL 16 | Relationale DB    |
| 🌿 Drizzle ORM   | Type-safe ORM     |
| 🔧 Drizzle Kit   | Schema-Management |

---

## 🏗️ Architektur

### 📁 Projektstruktur

```
📦 support-engine
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
│   ├── 📄 exchange-service.ts # Exchange Online Integration
│   ├── 📄 logger.ts           # Logging-System
│   ├── 📄 routes.ts           # API-Routen
│   ├── 📄 storage.ts          # Datenbankzugriff
│   ├── 📄 tls-service.ts      # TLS-Zertifikatsverwaltung
│   └── 📄 index.ts            # Server-Start
├── 📂 shared/                 # Geteilter Code
│   └── 📄 schema.ts           # Drizzle-Schema
├── 📂 logs/                   # Log-Dateien
├── 📄 EXCHANGE_EINRICHTUNG.md # Exchange Setup-Anleitung
└── 📄 design_guidelines.md    # Design-System
```

### 🔄 Systemarchitektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                           🌐 Client                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   React     │  │  TanStack   │  │   Shadcn    │                 │
│  │   + Vite    │  │   Query     │  │     UI      │                 │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                 │
│         │                │                                          │
│         └────────┬───────┘                                          │
│                  │                                                  │
│                  ▼                                                  │
│         ┌───────────────┐                                          │
│         │  REST API     │                                          │
│         │  (JSON)       │                                          │
│         └───────┬───────┘                                          │
└─────────────────┼───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           🖥️ Server                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │   Express   │  │    Auth     │  │   Winston   │  │ Exchange  │  │
│  │   Router    │──│  Middleware │──│   Logger    │──│  Service  │  │
│  └──────┬──────┘  └─────────────┘  └─────────────┘  └─────┬─────┘  │
│         │                                                  │        │
│         ▼                                                  ▼        │
│  ┌─────────────┐                                   ┌────────────┐  │
│  │   Storage   │                                   │ Graph API  │  │
│  │   Layer     │                                   │ (M365)     │  │
│  └──────┬──────┘                                   └────────────┘  │
└─────────┼───────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        🗄️ PostgreSQL                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │  Tenants   │ │   Users    │ │  Tickets   │ │    CRM     │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                      │
│  │  Exchange  │ │    TLS     │ │  Branding  │                      │
│  └────────────┘ └────────────┘ └────────────┘                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💾 Datenbank-Schema

### 🗄️ Kern-Tabellen

| Tabelle                | Beschreibung          |
| ---------------------- | --------------------- |
| 🏢 `tenants`           | Mandanten/Unternehmen |
| 👤 `users`             | Benutzerkonten        |
| 🎫 `tickets`           | Tickets/Anfragen      |
| 📋 `ticketTypes`       | Tickettypen           |
| 👥 `ticketAssignees`   | Zuweisungen           |
| 💬 `ticketComments`    | Kommentare            |
| 📎 `ticketAttachments` | Anhänge               |

### ⏱️ SLA & Eskalation

| Tabelle             | Beschreibung      |
| ------------------- | ----------------- |
| ⏰ `slaDefinitions` | SLA-Definitionen  |
| 🚨 `slaEscalations` | Eskalationsregeln |

### 📚 Wissensmanagement

| Tabelle                 | Beschreibung  |
| ----------------------- | ------------- |
| 📄 `kbArticles`         | Artikel       |
| 📝 `kbArticleVersions`  | Versionen     |
| 📁 `kbCategories`       | Kategorien    |
| 🔗 `ticketArticleLinks` | Verknüpfungen |

### ⏰ Zeiterfassung

| Tabelle          | Beschreibung |
| ---------------- | ------------ |
| ⏱️ `timeEntries` | Zeiteinträge |

### 📊 Umfragen

| Tabelle                | Beschreibung |
| ---------------------- | ------------ |
| 📋 `surveys`           | Umfragen     |
| ❓ `surveyQuestions`   | Fragen       |
| 📧 `surveyInvitations` | Einladungen  |
| ✅ `surveyResponses`   | Antworten    |

### 🖥️ Asset-Management

| Tabelle              | Beschreibung  |
| -------------------- | ------------- |
| 📁 `assetCategories` | Kategorien    |
| 💻 `assets`          | Assets        |
| 🔑 `assetLicenses`   | Lizenzen      |
| 📋 `assetContracts`  | Verträge      |
| 🔗 `ticketAssets`    | Verknüpfungen |
| 📜 `assetHistory`    | Historie      |

### 📋 Projektmanagement

| Tabelle             | Beschreibung               |
| ------------------- | -------------------------- |
| 📁 `projects`       | Projekte                   |
| 👥 `projectMembers` | Projektmitglieder          |
| 📊 `boardColumns`   | Kanban-Spalten             |
| 🔗 `ticketProjects` | Ticket-Projekt-Zuordnungen |

### 🏢 CRM-Modul

| Tabelle                 | Beschreibung                       |
| ----------------------- | ---------------------------------- |
| 🏛️ `organizations`      | Organisationen/Unternehmensgruppen |
| 👥 `customers`          | Kunden mit Auto-Nummern (KD-XXXXX) |
| 📍 `customerLocations`  | Kundenstandorte                    |
| 👤 `contacts`           | Ansprechpartner                    |
| 🔗 `ticketContacts`     | Ticket-Kontakt-Verknüpfungen       |
| 📊 `customerActivities` | Kundenaktivitäten                  |

### 📧 Exchange Online

| Tabelle                      | Beschreibung                       |
| ---------------------------- | ---------------------------------- |
| ⚙️ `exchangeConfigurations`  | Azure AD/Graph API Konfigurationen |
| 📬 `exchangeMailboxes`       | Verknüpfte Exchange-Postfächer     |
| 📋 `exchangeAssignmentRules` | Automatische Zuweisungsregeln      |
| 📧 `exchangeEmails`          | Importierte E-Mails                |
| 📊 `exchangeSyncLogs`        | Synchronisationsprotokolle         |

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

### 📚 Hauptressourcen

| Endpunkt              | Beschreibung                                |
| --------------------- | ------------------------------------------- |
| `/api/auth`           | 🔐 Authentifizierung (Login, Register, Me)  |
| `/api/tickets`        | 🎫 Ticket-Management                        |
| `/api/users`          | 👥 Benutzerverwaltung                       |
| `/api/organizations`  | 🏢 Organisationen                           |
| `/api/customers`      | 👥 Kunden                                   |
| `/api/contacts`       | 👤 Kontakte                                 |
| `/api/projects`       | 📋 Projekte                                 |
| `/api/assets`         | 💻 Asset-Management                         |
| `/api/kb`             | 📚 Wissensdatenbank                         |
| `/api/surveys`        | 📊 Umfragen                                 |
| `/api/search`         | 🔍 Globale Suche (`?q=term`)                |
| `/api/reports`        | 📈 Berichte (tickets, sla, time, export)    |
| `/api/logs`           | 📊 System-Logs (Admin)                      |
| `/api/exchange`       | 📧 Exchange Online Integration (Admin)      |

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

| Rolle    | E-Mail        | Passwort |
| -------- | ------------- | -------- |
| 👑 Admin | admin@demo.de | admin123 |
| 👷 Agent | agent@demo.de | agent123 |
| 👤 Kunde | kunde@demo.de | kunde123 |

---

## 👥 Benutzerrollen & Berechtigungen

### 👑 Admin

| Berechtigung            | Status |
| ----------------------- | ------ |
| Alle Funktionen         | ✅     |
| Benutzerverwaltung      | ✅     |
| Mandanten-Einstellungen | ✅     |
| Asset-Management        | ✅     |
| Umfragen verwalten      | ✅     |
| SLA-Definitionen        | ✅     |
| System-Logs einsehen    | ✅     |
| CRM-Vollzugriff         | ✅     |
| Berichte & Export       | ✅     |

### 👷 Agent

| Berechtigung          | Status |
| --------------------- | ------ |
| Tickets bearbeiten    | ✅     |
| Tickets zuweisen      | ✅     |
| KB-Artikel erstellen  | ✅     |
| Zeiteinträge erfassen | ✅     |
| Assets verwalten      | ✅     |
| Interne Kommentare    | ✅     |
| CRM-Lesezugriff       | ✅     |
| Berichte lesen        | ✅     |

### 👤 Kunde

| Berechtigung             | Status |
| ------------------------ | ------ |
| Eigene Tickets erstellen | ✅     |
| Ticket-Status einsehen   | ✅     |
| Öffentliche Kommentare   | ✅     |
| Wissensbasis durchsuchen | ✅     |
| Umfragen beantworten     | ✅     |

---

## 🔒 Sicherheit

### ✅ Implementierte Maßnahmen

| Maßnahme                 | Beschreibung                                     |
| ------------------------ | ------------------------------------------------ |
| 🔐 JWT-Auth              | Token-basierte Authentifizierung                 |
| 🔑 bcrypt                | Passwort-Hashing mit Salt                        |
| 🏢 Tenant-Isolation      | Vollständige Datentrennung                       |
| ✅ Zod-Validierung       | Input-Prüfung Frontend & Backend                 |
| 🛡️ SQL-Injection         | Schutz durch Drizzle ORM                         |
| 🔒 XSS-Schutz            | React's automatisches Escaping                   |
| 🌐 CORS                  | Restriktive Origin-Policies                      |
| 🔒 Log-Maskierung        | Automatische Maskierung sensibler Daten          |
| 📊 Security-Logging      | Protokollierung sicherheitsrelevanter Ereignisse |
| 🔐 AES-256-GCM           | Verschlüsselte Speicherung von Client-Secrets    |

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

Dieses Projekt steht unter der **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### Was bedeutet das?

| Erlaubt                 | Bedingung                        |
| ----------------------- | -------------------------------- |
| ✅ Kommerzielle Nutzung | Quellcode muss verfügbar sein    |
| ✅ Modifikation         | Änderungen unter gleicher Lizenz |
| ✅ Verteilung           | Copyright-Hinweis beibehalten    |
| ✅ Private Nutzung      | Netzwerk-Nutzung = Verteilung    |

### AGPL-Pflichten für Webdienste

Da dies eine Webanwendung ist, gilt die **Network Copyleft**-Klausel:

- Jeder, der diese Software als Webdienst betreibt, muss den Quellcode verfügbar machen
- Links zu Quellcode und Lizenz sind in der Anwendung integriert

### Lizenz-Endpunkte

| Endpunkt       | Beschreibung       |
| -------------- | ------------------ |
| `/api/license` | Lizenztext abrufen |
| `/api/source`  | Link zum Quellcode |

Siehe [LICENSE](./LICENSE) für den vollständigen Lizenztext.
Siehe [CONTRIBUTING.md](./CONTRIBUTING.md) für Beitragsrichtlinien.

---

## 📘 Administrationsanleitung

Für Administratoren, Betreiber und technische Ansprechpartner steht eine ausführliche Betriebs- und Administrationsanleitung zur Verfügung:

**[📘 ANLEITUNG.md](./ANLEITUNG.md)**

Die Anleitung enthält:

- ⚙️ Betrieb und Administration (Mandanten, Benutzer, SLA)
- 📧 E-Mail- und Integrationen (Exchange, Mailabruf)
- 🏢 CRM-Nutzung im Ticketsystem
- 📊 Berichte & Analysen (Ticket-, SLA- und Zeitauswertung, Exportformate)
- 📊 Logging und Monitoring
- 🔐 TLS und Sicherheit
- 🎨 Branding und Mandantenanpassung
- 🔧 Betriebshinweise (Backup, Updates, Wartung)

---

<div align="center">

**Entwickelt mit ❤️ für professionelles Helpdesk-Management**

📦 Version: 0.1.4 | 📅 Stand: März 2026 | 📜 AGPL-3.0

</div>
