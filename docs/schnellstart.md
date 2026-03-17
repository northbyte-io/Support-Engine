# Schnellstart

Dieser Leitfaden führt Sie durch die erste Einrichtung nach einer erfolgreichen [Installation](installation.md).

## 1. Ersten Administrator anlegen

Beim allerersten Start ist die Benutzerdatenbank leer.

1. Öffnen Sie `http://localhost:5000/register`
2. Füllen Sie das Formular aus (Name, E-Mail, Passwort)
3. Der erste Benutzer erhält automatisch die Rolle **Admin**

Alle weiteren Benutzer können Sie danach in der Benutzerverwaltung anlegen.

## 2. Mandanten konfigurieren

Jede Support-Engine-Instanz arbeitet mit Mandanten. Der erste Administrator gehört automatisch einem Standard-Mandanten an.

1. Navigieren Sie zu **Einstellungen → Mandant**
2. Passen Sie Name und Branding an:
   - Logo (Light / Dark Mode)
   - Favicon
   - Kontaktdaten (Website, E-Mail, Telefon)
3. Speichern Sie die Änderungen

Weitere Informationen: [Mandantenverwaltung](admin/mandanten.md)

## 3. Benutzer anlegen

1. Navigieren Sie zu **Administration → Benutzer**
2. Klicken Sie auf **Neuer Benutzer**
3. Vergeben Sie E-Mail, Name, Passwort und Rolle:
   - **Admin** – Vollzugriff, Systemkonfiguration
   - **Agent** – Ticketbearbeitung und Zeiterfassung
   - **Kunde** – Zugriff nur auf eigene Tickets (Kundenportal)

## 4. SLA-Definitionen festlegen

SLAs definieren maximale Reaktions- und Lösungszeiten je Priorität.

1. Navigieren Sie zu **Administration → SLA**
2. Passen Sie die Werte je Prioritätsstufe an
3. Richten Sie bei Bedarf Eskalationsregeln ein

Weitere Informationen: [SLA-Management](admin/sla.md)

## 5. Erstes Ticket erstellen

1. Klicken Sie in der Seitenleiste auf **Neues Ticket**
2. Füllen Sie die Pflichtfelder aus:
   - **Titel** – kurze, prägnante Beschreibung
   - **Beschreibung** – Details zum Problem
   - **Priorität** – Niedrig / Mittel / Hoch / Dringend
3. Optional: Tickettyp, Kunde, Asset, Bearbeiter zuweisen
4. Klicken Sie auf **Erstellen**

## Navigationsübersicht

| Bereich | Funktion | Zugang |
|---------|----------|--------|
| **Dashboard** | Übersicht, Statistiken, SLA-Status | Admin, Agent |
| **Tickets** | Alle Tickets anzeigen und verwalten | Admin, Agent |
| **Zeiterfassung** | Arbeitszeit erfassen und auswerten | Admin, Agent |
| **Wissensdatenbank** | Artikel und Lösungen dokumentieren | Admin, Agent |
| **Kunden** | Kundenverwaltung | Admin, Agent |
| **Kontakte** | Ansprechpartner | Admin, Agent |
| **Organisationen** | Unternehmensgruppen | Admin, Agent |
| **Assets** | Hardware, Software, Lizenzen | Admin, Agent |
| **Projekte** | Kanban-Board, Projektplanung | Admin, Agent |
| **Berichte** | Analysen und Exportfunktionen | Admin, Agent |
| **Benutzer** | Benutzerverwaltung | Admin |
| **Exchange** | E-Mail-Integration | Admin |
| **TLS-Zertifikate** | HTTPS-Zertifikate | Admin |
| **Logs** | Systemprotokoll | Admin |
| **Einstellungen** | Systemkonfiguration | Admin |

## Demo-Zugangsdaten

Für Testzwecke können folgende Daten verwendet werden (nur in einer frischen Testinstanz anlegen):

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@demo.de | admin123 |
| Agent | agent@demo.de | agent123 |
| Kunde | kunde@demo.de | kunde123 |

:::{warning}
Ändern Sie diese Passwörter sofort, wenn Sie die Anwendung produktiv betreiben.
:::

## Nächste Schritte

- [Tickets verwalten lernen](benutzer/tickets.md)
- [E-Mail-Integration einrichten](admin/email-integration.md)
- [SLA-Regeln konfigurieren](admin/sla.md)
- [Berichte & Analysen nutzen](benutzer/berichte.md)
