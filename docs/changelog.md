# Changelog

Alle wichtigen Änderungen an Support-Engine werden hier dokumentiert.

## [0.1.1] - Januar 2025

### Hinzugefügt

- **Microsoft Exchange Online Integration**
  - Automatisches Abrufen von E-Mails aus konfigurierten Postfächern
  - Automatische Ticketerstellung aus eingehenden E-Mails
  - Unterstützung für Shared Mailboxes
  - E-Mail-Anhänge werden automatisch an Tickets angehängt

- **E-Mail-Verarbeitungsregeln**
  - Flexible Regeln mit mehreren Bedingungen (UND/ODER)
  - Bedingungs-Typen: Absender, Betreff, Inhalt
  - Aktionen: Ticket erstellen, Priorität setzen, Agent zuweisen

- **Zeiterfassungssystem**
  - Timer-Funktion zum Starten/Stoppen der Arbeitszeit
  - Manuelle Zeitbuchungen mit Beschreibung
  - Filterung nach Datum, Agent und Ticket

- **TipTap Rich-Text-Editor**
  - Verwendung in Ticketerstellung und Wissensdatenbank
  - Formatierungsoptionen inkl. Bilder und Links
  - XSS-Schutz durch DOMPurify

- **Erweiterte Ticketverknüpfungen**
  - Kunden, Kontakte und Assets bei Ticketerstellung zuweisbar

### Verbessert

- E-Mail-Anhangverwaltung und -speicherung
- Verschlüsselungssicherheit
- Benutzeroberfläche und Navigation

### Sicherheit

- `fast-xml-parser` von v4.5.3 auf v5.3.4 aktualisiert
- Verbesserte Authentifizierung für Datei-Downloads

### Behoben

- E-Mail-Anhang-Speicherung und -Download
- Ticket-Löschung mit E-Mail-Verknüpfungen
- Artikelerstellung ohne Kategorieauswahl

---

## [0.1.0] - Dezember 2024

### Hinzugefügt

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
- Deutsche Benutzeroberfläche
