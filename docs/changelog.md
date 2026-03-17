# Changelog

Alle wichtigen Änderungen an Support-Engine werden hier dokumentiert.

## [0.1.4] - März 2026

### Hinzugefügt

- **Erweiterte Berichte & Analysen** (`/reports`)
  - Neue Berichtsseite mit drei Tabs: Ticket-Analyse, SLA-Performance, Zeiterfassung
  - Zeitraumfilter: Voreinstellungen 7 Tage / 30 Tage / 90 Tage sowie benutzerdefinierter Zeitraum
  - Interaktive Diagramme mit Recharts (Balken-, Linien-, Tortendiagramme)
  - Vier Exportformate pro Bericht: CSV (Excel-kompatibel), XLSX, PDF, HTML (druckfertig)
  - Neue API-Endpunkte: `GET /api/reports/tickets`, `GET /api/reports/sla`, `GET /api/reports/time`, `GET /api/reports/export`
  - Agenten-Performance-Tabelle mit Lösungsrate
  - SLA-Compliance-Rate mit farbkodiertem Tagesdiagramm
  - Zeiterfassungs-Aufschlüsselung pro Agent mit abrechenbarer Zeit
- Abhängigkeiten: `xlsx` (SheetJS) und `pdfkit` für serverseitige Exportgenerierung

### Verbessert

- Seitenleiste: Neuer Navigations-Eintrag „Berichte" mit BarChart-Icon zwischen Tickets und Zeiterfassung

---

## [0.1.3] - März 2026

### Hinzugefügt

- Neues Design-System: Amber als Primärfarbe, Navy Dunkel-Theme, warmes Off-White Hell-Theme
- Drei Schriftfamilien: Syne (Display), DM Sans (Fließtext), JetBrains Mono (Code/Zahlen)
- Neue AuthPageShell mit Split-Panel-Layout (Markenpanel links, Formular rechts)
- Neue StatusBadge- und PriorityBadge-Komponenten (eigene `<span>`-Elemente statt shadcn Badge)

### Verbessert

- Alle 26 Seiten auf semantische Design-Tokens migriert (keine hardcodierten Blau-/Grau-Klassen mehr)
- Seitenleiste mit drei Navigationsgruppen und integriertem AGPL-3.0-Footer
- Sticky Topbar mit Blur-Effekt in MainLayout
- Standard-Projektfarbe auf Amber (#F59E0B) geändert
- Branding-Provider vereinfacht: keine dynamischen Farb-Overrides mehr

### Behoben

- Hardcodierte Farbklassen in Dashboard, Logs, Benutzer, Kunden, Kontakte, Exchange-Integration
- Rate-Limiter-Warnung durch korrekte Proxy-Trust-Konfiguration behoben

---

## [0.1.2] - März 2026

### Hinzugefügt

- Playwright E2E-Testsuite für Authentifizierungsflows
- Vitest Unit-Tests für Auth, KeyVault und Logger
- ESLint mit TypeScript- und React-Hooks-Regeln
- Soft-Delete für Tickets und Wissensdatenbank-Artikel (DSGVO)
- Optimistische UI-Updates für Status, Kommentare und Kanban-Board
- i18n vollständig in die Anwendung eingebunden

### Verbessert

- Performance: Batch-Loading für Tickets, Assets und CRM-Relationen
- Paginierung für alle Listen-Endpunkte
- Barrierefreiheit (aria-label, aria-pressed, fieldset/legend)
- Code-Struktur durch Extraktion gemeinsamer Helfer und Komponenten
- Über 30 SonarQube-Qualitätsprobleme behoben

### Sicherheit

- Exchange-Zugriffstoken nicht mehr in Datenbank gespeichert (nur In-Memory)
- localStorage-Token-Nutzung auf Zeiterfassungs- und Log-Seiten entfernt
- S2068 (BLOCKER): Hart kodiertes Passwort in Testdatei behoben
- S5852: ReDoS-Anfälligkeit in zwei Regex-Ausdrücken behoben
- S2245: `Math.random()` durch kryptografisch sichere Alternativen ersetzt
- S7637: GitHub Actions auf Commit-SHA fixiert (Supply-Chain-Schutz)

### Behoben

- Überflüssige Non-Null-Assertions entfernt
- `parseInt` → `Number.parseInt` in API-Routes
- Doppelter Import in TLS-Service behoben
- Verschachtelter Ternary-Ausdruck in Logger bereinigt

---

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
