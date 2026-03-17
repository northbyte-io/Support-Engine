# Einführung

## Was ist Support-Engine?

**Support-Engine** ist eine mandantenfähige Helpdesk- und Ticketverwaltungsplattform, die speziell für deutschsprachige Unternehmen und Teams entwickelt wurde. Sie bietet alle Werkzeuge, die ein professionelles Support-Team benötigt: von der Ticketverwaltung mit SLA-Tracking über CRM und Asset-Management bis hin zu Berichten und Microsoft Exchange Online Integration.

Die Anwendung ist als vollständige SaaS-Lösung konzipiert und kann für mehrere Mandanten (Unternehmen oder Abteilungen) gleichzeitig betrieben werden – mit vollständiger Datenisolierung zwischen den Mandanten.

## Kernfunktionen

| Funktion | Beschreibung |
|----------|--------------|
| **Ticketverwaltung** | Vollständiger Lebenszyklus mit SLA-Tracking, Eskalation und Mehrfachzuweisung |
| **CRM** | Kunden, Organisationen, Kontakte und Aktivitätsverfolgung |
| **Wissensdatenbank** | Versionierte Artikel mit Rich-Text-Editor und Ticket-Verknüpfung |
| **Zeiterfassung** | Timer, manuelle Buchung, abrechenbare und nicht abrechenbare Einträge |
| **Asset-Management** | Hardware, Software, Lizenzen und Verträge mit Ticket-Verknüpfung |
| **Projektmanagement** | Kanban-Board mit Drag-and-Drop und WIP-Limits |
| **Berichte & Analysen** | Ticket-, SLA- und Zeitauswertung mit Export (CSV, XLSX, PDF, HTML) |
| **Globale Suche** | Mandantenweite Volltextsuche über alle Inhaltstypen |
| **Exchange Online** | Automatischer E-Mail-Import über Microsoft Graph API |
| **Multi-Tenant** | Vollständige Datenisolierung zwischen Mandanten |

## Architektur

Support-Engine basiert auf einer modernen, dreischichtigen Webanwendungsarchitektur:

```
┌────────────────────────────────────────────┐
│            Browser / Mobile                │
│         React 18 + TypeScript              │
│   TanStack Query · Wouter · shadcn/ui      │
└──────────────────┬─────────────────────────┘
                   │ REST API (JSON)
                   │ Authorization: Bearer <JWT>
┌──────────────────▼─────────────────────────┐
│             Express.js Server              │
│   JWT Auth · Winston Logging · Drizzle ORM │
│   Exchange Service · TLS Service · KeyVault│
└──────────────────┬─────────────────────────┘
                   │
┌──────────────────▼─────────────────────────┐
│              PostgreSQL                    │
│   50+ Tabellen · Multi-Tenant Isolation    │
└────────────────────────────────────────────┘
```

## Tech Stack

| Schicht | Technologien |
|---------|-------------|
| **Frontend** | React 18, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui, TanStack Query 5 |
| **Backend** | Node.js 20, Express 4, TypeScript, JWT, bcryptjs, Winston |
| **Datenbank** | PostgreSQL 16, Drizzle ORM, Drizzle Kit |
| **Integrationen** | Microsoft Graph API, Let's Encrypt (ACME), PDFKit, SheetJS |
| **Tests** | Playwright (E2E), Vitest (Unit), ESLint |

## Benutzerrollen

Support-Engine kennt drei Rollen:

| Rolle | Zugriff |
|-------|---------|
| **Admin** | Vollzugriff auf alle Funktionen, Systemkonfiguration, Benutzerverwaltung |
| **Agent** | Ticketbearbeitung, Zeiterfassung, CRM-Lesezugriff, Wissensdatenbank |
| **Kunde** | Eigene Tickets über das Kundenportal erstellen und verfolgen |

## Zielgruppe

Support-Engine richtet sich an:

- **IT-Abteilungen**, die ein professionelles internes Ticketsystem benötigen
- **Helpdesk-Teams**, die Kundenanfragen strukturiert bearbeiten
- **MSPs (Managed Service Provider)** mit Anforderungen an Multi-Mandanten-Betrieb
- **Unternehmen**, die eine vollständig deutschsprachige Lösung bevorzugen

## Versionsinformationen

Diese Dokumentation beschreibt **Support-Engine v0.1.4**.

| Version | Thema | Datum |
|---------|-------|-------|
| v0.1.4 | Erweiterte Berichte & Analysen | März 2026 |
| v0.1.3 | Big Redesign – neues Design-System | März 2026 |
| v0.1.2 | Sicherheit, Tests & Code-Qualität | März 2026 |
| v0.1.1 | Exchange Online, Zeiterfassung, TipTap | Januar 2026 |
| v0.1.0 | Erstveröffentlichung | Dezember 2025 |

Eine vollständige Versionshistorie finden Sie im [Changelog](changelog.md).
