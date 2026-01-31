# 🚀 v0.1.0 - Erste öffentliche Version

Dies ist die erste offizielle öffentliche Version von Support-Engine, einer professionellen Helpdesk- und Ticketverwaltungsplattform für deutschsprachige Organisationen.

---

## 📋 Übersicht

Support-Engine ist eine mandantenfähige SaaS-Webanwendung mit modernem Tech-Stack. Es bietet eine umfassende REST-API, die sowohl für Webanwendungen als auch für zukünftige iOS-Mobile-Clients konzipiert ist.

---

## ✨ Hauptfunktionen

### 🎫 Ticketverwaltung
- Vollständiges Ticket-Lifecycle-Management mit Statusworkflow
- Prioritätsstufen (niedrig, mittel, hoch, dringend)
- Tickettypen mit anpassbaren Feldern
- Mehrfachzuweisung pro Ticket
- Interne und öffentliche Kommentare
- Dateianhänge

### 🔐 Benutzerauthentifizierung und Rollen
- JWT-basierte Authentifizierung
- Sichere Passwort-Hashung mit bcrypt
- Drei Benutzerrollen: Admin, Agent, Kunde
- Rollenbasierte Zugriffskontrolle

### 🏢 Mandantenfähige Architektur
- Vollständige Datenisolierung zwischen Mandanten
- Mandantenspezifisches Branding und Anpassungen
- Isolierte Benutzerverwaltung pro Mandant

### ⏱️ SLA-Tracking und Eskalation
- SLA-Definitionen pro Prioritätsstufe
- Reaktions- und Lösungszeitverfolgung
- Automatische Eskalationsregeln
- Visuelle SLA-Statusindikatoren

### 📚 Wissensdatenbank
- Artikelverwaltung mit Versionierung
- Kategorien und Volltextsuche
- Artikel-Ticket-Verknüpfung

### 👥 CRM-Integration
- Organisationen und Kunden
- Kontaktverwaltung
- Standortverfolgung
- Aktivitätsprotokollierung (Anrufe, E-Mails, Meetings, Notizen)
- Kunden-Ticket-Zuordnungen

### 💼 Asset-Management
- Hardware, Software, Lizenzen, Verträge
- Asset-Ticket-Verknüpfung
- Änderungsverlauf

### 📊 Projekt- und Kanban-Boards
- Projektverwaltung mit Teammitgliedern
- Kanban-Board mit Drag-and-Drop
- WIP-Limits pro Spalte
- Ticket-Projekt-Zuordnungen

### ⚙️ Systemadministration
- Umfassendes Logging mit Admin-Oberfläche
- Log-Filterung, Suche und Export
- Let's Encrypt TLS-Zertifikatsverwaltung
- Mandanten-Branding-Anpassung

---

## 🛠️ Technischer Stack

| Komponente | Technologie |
|------------|-------------|
| Backend | Node.js mit Express.js |
| Frontend | React 18 mit TypeScript |
| Datenbank | PostgreSQL mit Drizzle ORM |
| Authentifizierung | JWT mit bcrypt |
| API | RESTful JSON API |
| UI-Framework | Tailwind CSS mit shadcn/ui |

---

## 📜 Lizenz

Dieses Projekt ist unter der **GNU Affero General Public License v3.0 (AGPL-3.0)** lizenziert.

Gemäß der AGPL-Lizenz ist der Quellcode öffentlich verfügbar. Beim Betrieb dieser Software als Netzwerkdienst muss der Quellcode den Nutzern dieses Dienstes zugänglich gemacht werden.

- 🔗 Lizenz-Endpunkte: `/api/license` und `/api/source`
- 📄 Vollständiger Lizenztext: [LICENSE](../LICENSE)

---

## 📝 Änderungsprotokoll

### ➕ Hinzugefügt
- Erstimplementierung des Kern-Ticketverwaltungssystems
- Benutzerauthentifizierungs- und Autorisierungssystem
- Mandantenfähige Architektur mit Datenisolierung
- SLA-Tracking- und Eskalations-Engine
- Wissensdatenbank mit Artikelverwaltung
- CRM-Modul mit Organisationen, Kunden, Kontakten
- Asset-Management-System
- Projektverwaltung mit Kanban-Boards
- System-Logging mit Admin-Oberfläche
- TLS-Zertifikatsverwaltung mit Let's Encrypt
- Mandanten-Branding-Anpassung
- Deutsche Benutzeroberfläche durchgehend

### 🔧 Technisch
- Grundlegende Anwendungsarchitektur etabliert
- REST-API-Design und Implementierung
- Datenbankschema mit Drizzle ORM
- Admin- und Benutzeroberflächen implementiert
- Dark/Light Mode Unterstützung

---

## 📦 Installation

Siehe [README.md](../README.md) für Installations- und Einrichtungsanweisungen.

---

## 📖 Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| 📘 [README.md](../README.md) | Technische Dokumentation |
| 📗 [ANLEITUNG.md](../ANLEITUNG.md) | Betriebs- und Administrationsanleitung |
| 📙 [CONTRIBUTING.md](../CONTRIBUTING.md) | Beitragsrichtlinien |

---

🔗 **Repository**: https://github.com/northbyte-io/Support-Engine  
🏷️ **Version**: 0.1.0  
📅 **Veröffentlichungsdatum**: Dezember 2024
