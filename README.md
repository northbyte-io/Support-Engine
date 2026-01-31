<div align="center">

# Support-Engine

**Enterprise-grade Helpdesk & Ticket Management Platform**

[![Release](https://img.shields.io/badge/release-v0.2.0-blue?style=flat-square)](https://github.com/northbyte-io/Support-Engine/releases)
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

Multi-Tenant | REST API | SLA Management | CRM | Knowledge Base | Asset Management | Exchange Online

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
  - 🔄 Tägliche Logrotation (max. 2GB pro Datei)
  - 📅 7-Tage-Aufbewahrung
  - 🔒 Automatische Maskierung sensibler Daten
  - 💾 In-Memory-Buffer für schnelle UI-Abfragen
- ✅ **Admin-UI**:
  - 🔍 Filterung nach Level und Quelle
  - 🔎 Volltextsuche
  - 📄 Paginierung
  - 📤 Export (TXT, CSV, JSON)
  - 🧪 Test-Log-Generator für alle Level

```
┌─────────────────────────────────────────────────────────────────────┐
│                     📊 Log-Übersicht (Admin)                        │
├─────────────────────────────────────────────────────────────────────┤
│  🔍 Filter: [Alle Level ▼] [Alle Quellen ▼]     🔎 Suchen: [____]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │🐛 5 │ │ℹ️ 42│ │⚠️ 12│ │❌ 3 │ │🛡️ 8 │ │⚡ 15│                   │
│  │Debug│ │Info │ │Warn │ │Error│ │Secur│ │Perf │                   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ℹ️ [15:18:33] [auth] Erfolgreiche Anmeldung                 │   │
│  │    Benutzer Admin Benutzer hat sich erfolgreich angemeldet  │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ ✅ [15:18:34] [ticket] Ticket erstellt                      │   │
│  │    Neues Ticket "Test" wurde erfolgreich erstellt           │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ 🛡️ [15:17:55] [auth] Fehlgeschlagener Anmeldeversuch       │   │
│  │    Falsches Passwort für Benutzer eingegeben                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                    [← Zurück] Seite 1 von 5 [Weiter →]             │
└─────────────────────────────────────────────────────────────────────┘
```

#### 🎨 Mandanten-Branding

- ✅ **Logos**: Separate Logos für Light/Dark Mode + Favicon
- ✅ **Farben**: Primär-, Sekundär- und Akzentfarben anpassbar
- ✅ **Schriftarten**: 10 Schriftarten-Optionen (Inter, Roboto, Open Sans, etc.)
- ✅ **E-Mail-Templates**: Header/Footer-HTML, Absender-Name und Adresse
- ✅ **Custom CSS**: Erweiterte Styling-Anpassungen möglich
- ✅ **Kontaktdaten**: Website, Support-E-Mail, Telefon
- ✅ **Dynamische Anwendung**: CSS-Variablen werden in Echtzeit aktualisiert
- ✅ **Live-Vorschau**: Vorschau der Branding-Änderungen im Admin-Bereich

```
┌─────────────────────────────────────────────────────────────────────┐
│                     🎨 Branding-Einstellungen                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Farben  │ │  Logos   │ │ Schrift  │ │  E-Mail  │ │ Kontakt  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Primärfarbe      [#3B82F6] ████████                        │   │
│  │  Sekundärfarbe    [#6366F1] ████████                        │   │
│  │  Akzentfarbe      [#10B981] ████████                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Schriftart       [Inter ▼]                                 │   │
│  │  Custom CSS       [________________________]                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                         [💾 Speichern]                              │
└─────────────────────────────────────────────────────────────────────┘
```

#### 🔐 TLS-Zertifikatsverwaltung

- ✅ **Let's Encrypt Integration**: ACME-Protokoll-Unterstützung
- ✅ **Challenge-Typen**: HTTP-01 Challenge für Domain-Validierung
- ✅ **Umgebungen**: Staging und Production CA
- ✅ **Zertifikats-Lifecycle**:
  - 📥 Anfordern neuer Zertifikate
  - 🔄 Automatische Erneuerung vor Ablauf
  - ❌ Widerrufen bei Bedarf
- ✅ **Sicherheit**:
  - 🔒 AES-256-GCM verschlüsselte Private Keys
  - 🗄️ Persistente Challenge-Speicherung in der Datenbank
  - 🏢 Mandanten-spezifische Zertifikate
- ✅ **Admin-UI**:
  - ⚙️ Einstellungen (E-Mail, CA-Typ, Auto-Erneuerung)
  - 📋 Zertifikatsliste mit Status
  - 📜 Aktionshistorie

> **Hinweis:** Die TLS-Zertifikatsverwaltung erfordert einen eigenen Server mit öffentlich erreichbarer Domain. In Hosting-Umgebungen wie Replit kann die HTTP-01 Challenge aufgrund von Proxy-Konfigurationen nicht validiert werden.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     🔐 TLS-Zertifikatsverwaltung                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Einstellungen│ │ Zertifikate  │ │  Historie    │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Domain         │ Status    │ Ablauf      │ Aktionen        │   │
│  ├─────────────────┼───────────┼─────────────┼─────────────────┤   │
│  │  example.com    │ ✅ Aktiv  │ 2025-03-30  │ [🔄] [❌]       │   │
│  │  api.example.de │ ⏳ Pending│ -           │ [🔄]            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                    [➕ Neues Zertifikat anfordern]                   │
└─────────────────────────────────────────────────────────────────────┘
```

#### 📧 Exchange Online Integration

- ✅ **Microsoft Graph API**: Vollständige Integration für Exchange Online
- ✅ **Authentifizierung**: Client Secret oder Zertifikat (Azure Entra ID)
- ✅ **Postfach-Typen**:
  - 📥 Eingehend: E-Mails werden als Tickets importiert
  - 📤 Ausgehend: Für Ticket-Benachrichtigungen
  - 📧 Geteilt: Kombinierte Funktionalität
- ✅ **Post-Import-Aktionen**:
  - Als gelesen markieren
  - In Ordner verschieben
  - Archivieren
  - Löschen
  - Unverändert lassen
- ✅ **Zuweisungsregeln**: Automatische Ticket-Erstellung basierend auf:
  - 📋 Betreff-Schlüsselwörter
  - 👤 Absender-E-Mail/Domain
  - 📝 E-Mail-Text-Schlüsselwörter
- ✅ **Synchronisation**:
  - Konfigurierbare Intervalle (5/15/30/60 Minuten)
  - Manuelle Synchronisation
  - Detailliertes Sync-Protokoll
- ✅ **Admin-UI**: 6-Schritte-Einrichtungsassistent
- ✅ **Sicherheit**: AES-256-GCM verschlüsselte Client-Secrets

> **Erforderliche Azure AD Berechtigungen**: Mail.Read, Mail.ReadWrite, Mail.Send
> 
> **Siehe auch**: [EXCHANGE_EINRICHTUNG.md](./EXCHANGE_EINRICHTUNG.md) für eine vollständige Einrichtungsanleitung

```
┌─────────────────────────────────────────────────────────────────────┐
│                     📧 Exchange Online Integration                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │1. Azure  │→│2. Post-  │→│3. Import │→│4. Regeln │→│5. Sync   │ │
│  │  Config  │ │  fächer  │ │ Aktionen │ │          │ │          │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Azure AD Konfiguration                                     │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Tenant-ID:    [xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]       │   │
│  │  Client-ID:    [xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]       │   │
│  │  Auth-Typ:     [Client Secret ▼]                            │   │
│  │  Client-Secret:[********************************]            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Status: ✅ Verbunden     [🔄 Verbindung testen] [💾 Speichern]    │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                     📬 E-Mail → Ticket Workflow                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   📧 Eingehende E-Mail                                              │
│          │                                                          │
│          ▼                                                          │
│   ┌──────────────┐                                                  │
│   │ Graph API    │  ← Microsoft 365                                 │
│   │ Abruf        │                                                  │
│   └──────┬───────┘                                                  │
│          │                                                          │
│          ▼                                                          │
│   ┌──────────────┐                                                  │
│   │ Zuweisungs-  │  ← Betreff, Absender, Schlüsselwörter prüfen    │
│   │ regeln       │                                                  │
│   └──────┬───────┘                                                  │
│          │                                                          │
│    ┌─────┴─────┐                                                    │
│    │           │                                                    │
│    ▼           ▼                                                    │
│ ┌──────┐  ┌──────────┐                                             │
│ │ 🎫   │  │ Standard │  ← Keine Regel matched                      │
│ │Ticket│  │ Zuweisung│                                              │
│ └──┬───┘  └────┬─────┘                                             │
│    │           │                                                    │
│    └─────┬─────┘                                                    │
│          │                                                          │
│          ▼                                                          │
│   ┌──────────────┐                                                  │
│   │ Post-Import  │  ← Als gelesen/Verschieben/Archivieren/Löschen  │
│   │ Aktion       │                                                  │
│   └──────────────┘                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 🎨 Design & UX

- ✅ Dark/Light Mode
- ✅ Responsive Design
- ✅ Shadcn UI Sidebar
- ✅ Inter Font
- ✅ Linear-inspiriertes Design
- ✅ Skeleton-Loader
- ✅ Toast-Benachrichtigungen
- ✅ Einheitliches MainLayout für alle Seiten
- ✅ Lizenz-Footer mit Links zu `/api/license` und `/api/source`

---

### 🚀 Roadmap

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| 📋 Projektmanagement | ✅ Fertig | Kanban-Board, Projekt-Tracking |
| 🏢 CRM-Modul | ✅ Fertig | Organisationen, Kunden, Kontakte, Standorte |
| 📊 System-Logging | ✅ Fertig | Umfassendes Logging mit Admin-UI |
| 🎨 Mandanten-Branding | ✅ Fertig | Logos, Farben, Schriftarten, E-Mail-Templates, Custom CSS |
| 🔐 TLS-Zertifikatsverwaltung | ✅ Fertig | Let's Encrypt Integration, ACME-Protokoll, Auto-Erneuerung |
| 📧 Exchange Online Integration | ✅ Fertig | Microsoft Graph API, E-Mail-Import, Zuweisungsregeln |
| 📈 Erweiterte Berichte | 🔜 Geplant | Report Builder, CSV/PDF Export |
| ✅ Genehmigungsworkflows | 🔜 Geplant | Multi-Step-Approval |
| 🔗 Microsoft-Integration | 🔄 Teilweise | Exchange Online fertig, Azure AD/Teams geplant |
| 🤖 AI-Funktionen | 📅 Später | Auto-Kategorisierung, Vorschläge |

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
| 🖱️ dnd-kit | Drag-and-Drop |

### Backend

| Technologie | Beschreibung |
|-------------|--------------|
| 🟢 Node.js 20 | JavaScript Runtime |
| 🚂 Express 4 | HTTP-Server |
| 📘 TypeScript 5 | Type Safety |
| 🔐 bcryptjs | Passwort-Hashing |
| 🎫 jsonwebtoken | JWT-Auth |
| 📊 Winston | Logging-Framework |
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

### 📋 Projektmanagement

| Tabelle | Beschreibung |
|---------|--------------|
| 📁 `projects` | Projekte |
| 👥 `projectMembers` | Projektmitglieder |
| 📊 `boardColumns` | Kanban-Spalten |
| 🔗 `ticketProjects` | Ticket-Projekt-Zuordnungen |

### 🏢 CRM-Modul

| Tabelle | Beschreibung |
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Einstellungen│ │ Zertifikate  │ │  Historie    │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Domain         │ Status    │ Ablauf      │ Aktionen        │   │
│  ├─────────────────┼───────────┼─────────────┼─────────────────┤   │
│  │  example.com    │ ✅ Aktiv  │ 2025-03-30  │ [🔄] [❌]       │   │
│  │  api.example.de │ ⏳ Pending│ -           │ [🔄]            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                    [➕ Neues Zertifikat anfordern]                   │
└─────────────────────────────────────────────────────────────────────┘
```

#### 🎨 Design & UX

- ✅ Dark/Light Mode
- ✅ Responsive Design
- ✅ Shadcn UI Sidebar
- ✅ Inter Font
- ✅ Linear-inspiriertes Design
- ✅ Skeleton-Loader
- ✅ Toast-Benachrichtigungen
- ✅ Einheitliches MainLayout für alle Seiten
- ✅ Lizenz-Footer mit Links zu `/api/license` und `/api/source`

---

### 🚀 Roadmap

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| 📋 Projektmanagement | ✅ Fertig | Kanban-Board, Projekt-Tracking |
| 🏢 CRM-Modul | ✅ Fertig | Organisationen, Kunden, Kontakte, Standorte |
| 📊 System-Logging | ✅ Fertig | Umfassendes Logging mit Admin-UI |
| 🎨 Mandanten-Branding | ✅ Fertig | Logos, Farben, Schriftarten, E-Mail-Templates, Custom CSS |
| 🔐 TLS-Zertifikatsverwaltung | ✅ Fertig | Let's Encrypt Integration, ACME-Protokoll, Auto-Erneuerung |
| 📧 Exchange Online Integration | ✅ Fertig | Microsoft Graph API, E-Mail-Import, Zuweisungsregeln |
| 📈 Erweiterte Berichte | 🔜 Geplant | Report Builder, CSV/PDF Export |
| ✅ Genehmigungsworkflows | 🔜 Geplant | Multi-Step-Approval |
| 🔗 Microsoft-Integration | 🔄 Teilweise | Exchange Online fertig, Azure AD/Teams geplant |
| 🤖 AI-Funktionen | 📅 Später | Auto-Kategorisierung, Vorschläge |

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
| 🖱️ dnd-kit | Drag-and-Drop |

### Backend

| Technologie | Beschreibung |
|-------------|--------------|
| 🟢 Node.js 20 | JavaScript Runtime |
| 🚂 Express 4 | HTTP-Server |
| 📘 TypeScript 5 | Type Safety |
| 🔐 bcryptjs | Passwort-Hashing |
| 🎫 jsonwebtoken | JWT-Auth |
| 📊 Winston | Logging-Framework |
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
│   ├── 📄 logger.ts           # Logging-System
│   ├── 📄 routes.ts           # API-Routen
│   ├── 📄 storage.ts          # Datenbankzugriff
│   └── 📄 index.ts            # Server-Start
├── 📂 shared/                 # Geteilter Code
│   └── 📄 schema.ts           # Drizzle-Schema
├── 📂 logs/                   # Log-Dateien
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
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Express   │  │    Auth     │  │   Winston   │                 │
│  │   Router    │──│  Middleware │──│   Logger    │                 │
│  └──────┬──────┘  └─────────────┘  └─────────────┘                 │
│         │                                                          │
│         ▼                                                          │
│  ┌─────────────┐                                                   │
│  │   Storage   │                                                   │
│  │   Layer     │                                                   │
│  └──────┬──────┘                                                   │
└─────────┼───────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        🗄️ PostgreSQL                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │  Tenants   │ │   Users    │ │  Tickets   │ │    CRM     │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
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

### 📋 Projektmanagement

| Tabelle | Beschreibung |
|---------|--------------|
| 📁 `projects` | Projekte |
| 👥 `projectMembers` | Projektmitglieder |
| 📊 `boardColumns` | Kanban-Spalten |
| 🔗 `ticketProjects` | Ticket-Projekt-Zuordnungen |

### 🏢 CRM-Modul

| Tabelle | Beschreibung |
|---------|--------------|
| 🏛️ `organizations` | Organisationen/Unternehmensgruppen |
| 👥 `customers` | Kunden mit Auto-Nummern (KD-XXXXX) |
| 📍 `customerLocations` | Kundenstandorte |
| 👤 `contacts` | Ansprechpartner |
| 🔗 `ticketContacts` | Ticket-Kontakt-Verknüpfungen |
| 📊 `customerActivities` | Kundenaktivitäten |

### 📧 Exchange Online

| Tabelle | Beschreibung |
|---------|--------------|
| ⚙️ `exchangeConfigurations` | Azure AD/Graph API Konfigurationen |
| 📬 `exchangeMailboxes` | Verknüpfte Exchange-Postfächer |
| 📋 `exchangeAssignmentRules` | Automatische Zuweisungsregeln |
| 📧 `exchangeEmails` | Importierte E-Mails |
| 📊 `exchangeSyncLogs` | Synchronisationsprotokolle |

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

| Endpunkt | Beschreibung |
|----------|--------------|
| `/api/auth` | 🔐 Authentifizierung (Login, Register, Me) |
| `/api/tickets` | 🎫 Ticket-Management |
| `/api/users` | 👥 Benutzerverwaltung |
| `/api/organizations` | 🏢 Organisationen |
| `/api/customers` | 👥 Kunden |
| `/api/contacts` | 👤 Kontakte |
| `/api/projects` | 📋 Projekte |
| `/api/assets` | 💻 Asset-Management |
| `/api/kb` | 📚 Wissensdatenbank |
| `/api/surveys` | 📊 Umfragen |
| `/api/logs` | 📊 System-Logs (Admin) |
| `/api/exchange` | 📧 Exchange Online Integration (Admin) |

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
| System-Logs einsehen | ✅ |
| CRM-Vollzugriff | ✅ |

### 👷 Agent

| Berechtigung | Status |
|--------------|--------|
| Tickets bearbeiten | ✅ |
| Tickets zuweisen | ✅ |
| KB-Artikel erstellen | ✅ |
| Zeiteinträge erfassen | ✅ |
| Assets verwalten | ✅ |
| Interne Kommentare | ✅ |
| CRM-Lesezugriff | ✅ |

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
| 🔒 Log-Maskierung | Automatische Maskierung sensibler Daten |
| 📊 Security-Logging | Protokollierung sicherheitsrelevanter Ereignisse |

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

| Erlaubt | Bedingung |
|---------|-----------|
| ✅ Kommerzielle Nutzung | Quellcode muss verfügbar sein |
| ✅ Modifikation | Änderungen unter gleicher Lizenz |
| ✅ Verteilung | Copyright-Hinweis beibehalten |
| ✅ Private Nutzung | Netzwerk-Nutzung = Verteilung |

### AGPL-Pflichten für Webdienste

Da dies eine Webanwendung ist, gilt die **Network Copyleft**-Klausel:
- Jeder, der diese Software als Webdienst betreibt, muss den Quellcode verfügbar machen
- Links zu Quellcode und Lizenz sind in der Anwendung integriert

### Lizenz-Endpunkte

| Endpunkt | Beschreibung |
|----------|--------------|
| `/api/license` | Lizenztext abrufen |
| `/api/source` | Link zum Quellcode |

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
- 📊 Logging und Monitoring
- 🔐 TLS und Sicherheit
- 🎨 Branding und Mandantenanpassung
- 🔧 Betriebshinweise (Backup, Updates, Wartung)

---

<div align="center">

**Entwickelt mit ❤️ für professionelles Helpdesk-Management**

📦 Version: 0.1.1 | 📅 Stand: Januar 2026 | 📜 AGPL-3.0

</div>
