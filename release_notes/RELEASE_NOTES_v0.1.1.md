# 🚀 v0.1.1 - E-Mail-Integration & Zeiterfassung

Diese Version bringt umfassende E-Mail-Integration mit Microsoft Exchange Online sowie ein neues Zeiterfassungssystem für die Arbeitszeitverfolgung an Tickets.

---

## 📋 Übersicht

Support-Engine v0.1.1 erweitert die Plattform um produktive Funktionen für den täglichen Einsatz: Automatische Ticketerstellung aus E-Mails, flexible Verarbeitungsregeln und detaillierte Zeiterfassung für Abrechnungen und Analysen.

---

## ✨ Neue Funktionen

### 📧 Microsoft Exchange Online Integration
- Vollständige Integration mit Microsoft Exchange Online / Microsoft 365
- Automatisches Abrufen von E-Mails aus konfigurierten Postfächern
- Automatische Ticketerstellung aus eingehenden E-Mails
- Unterstützung für Shared Mailboxes
- Ordnerauswahl inkl. Unterordner für E-Mail-Synchronisation
- E-Mail-Anhänge werden automatisch an Tickets angehängt
- Test-E-Mail-Versand zur Überprüfung der Konfiguration
- Detaillierte Anleitung zur Einrichtung (EXCHANGE_EINRICHTUNG.md)

### 📨 E-Mail-Verarbeitungsregeln
- Flexible Regeln für die automatische E-Mail-Verarbeitung
- Mehrere Bedingungen pro Regel mit UND/ODER-Verknüpfung
- Bedingungs-Typen: Absender, Betreff, Inhalt, importierte E-Mails
- Mehrere Aktionen pro Regel auswählbar
- Aktionen: Ticket erstellen, Priorität setzen, Agent zuweisen, etc.
- Nachbearbeitungsoptionen für verarbeitete E-Mails

### ⏱️ Zeiterfassungssystem
- Umfassendes Zeiterfassungsmodul für Tickets
- Timer-Funktion zum Starten/Stoppen der Arbeitszeit
- Manuelle Zeitbuchungen mit Beschreibung
- Arbeitszeiteinträge pro Ticket und Agent
- Filterung nach Datum, Agent und Ticket
- Übersichtliche Zeiterfassungsseite mit Statistiken

### ✏️ Rich-Text-Editor (TipTap)
- Neuer TipTap-basierter Rich-Text-Editor
- Verwendung in Ticketerstellung und Wissensdatenbank
- Formatierungsoptionen: Fett, Kursiv, Unterstrichen, Überschriften
- Links und Bilder einfügen
- Textausrichtung und Listen
- XSS-Schutz durch DOMPurify-Sanitisierung

### 🔗 Erweiterte Ticketverknüpfungen
- Kunden, Kontakte und Assets bei Ticketerstellung zuweisbar
- Verbesserte Ticket-Erstellungsoberfläche
- Direkte Verknüpfung von CRM-Daten mit Tickets

---

## 🔧 Verbesserungen

### 📨 E-Mail-Funktionen
- Verbesserte E-Mail-Anhangverwaltung und -speicherung
- Base64-kodierte Anhänge werden korrekt verarbeitet
- Download von E-Mail-Anhängen aus Tickets
- Sanitisierung von importierten E-Mail-Inhalten
- Verbesserte Token-Authentifizierung für Datei-Downloads

### 🔐 Sicherheit
- **Sicherheitsupdate**: fast-xml-parser auf v5.3.4 aktualisiert
- Verbesserte Verschlüsselungssicherheit durch Enforcing der Auth-Tag-Länge
- Abhängigkeiten für erhöhte Stabilität aktualisiert

### 🎨 Benutzeroberfläche
- Anwendungsname auf "Support-Engine" vereinheitlicht
- Drei Seiten in das Hauptlayout für konsistente Navigation integriert
- Verbesserte Zeiterfassungsseite mit Filteroptionen
- Korrektur der Artikelerstellung bei fehlender Kategorieauswahl

### 🐛 Fehlerbehebungen
- E-Mail-Upload-Probleme in Object Storage behoben
- Ticket-Löschung und E-Mail-Import-Ordnerregeln korrigiert
- Logging-Fehler bei fehlenden Daten behoben
- Regelerststellung-Fehler korrigiert
- Download-Fehler durch korrekte Token-Übermittlung behoben

---

## 🛠️ Technische Änderungen

| Bereich | Änderung |
|---------|----------|
| Editor | TipTap Rich-Text-Editor integriert |
| Sicherheit | DOMPurify für XSS-Schutz |
| E-Mail | Microsoft Graph API Integration |
| Abhängigkeiten | fast-xml-parser v5.3.4 (Sicherheitsupdate) |
| Verschlüsselung | Auth-Tag-Längen-Enforcement |

---

## 📝 Änderungsprotokoll

### ➕ Hinzugefügt
- Microsoft Exchange Online Integration
- E-Mail-Verarbeitungsregeln mit Bedingungen und Aktionen
- Zeiterfassungssystem mit Timer und manuellen Einträgen
- TipTap Rich-Text-Editor für Tickets und Wissensdatenbank
- Kunden/Kontakt/Asset-Zuweisung bei Ticketerstellung
- E-Mail-Anhang-Download und -Verwaltung
- Shared Mailbox Unterstützung
- Ordner- und Unterordnerauswahl für E-Mails
- XSS-Schutz durch DOMPurify

### 🔧 Verbessert
- Sicherheit durch aktualisierte Abhängigkeiten
- E-Mail-Inhalts-Sanitisierung
- Verschlüsselungssicherheit
- Benutzeroberfläche und Navigation
- Fehlerbehandlung und Logging

### 🔒 Sicherheit
- fast-xml-parser von v4.5.3 auf v5.3.4 aktualisiert
- Verbesserte Authentifizierung für Datei-Downloads
- Enforcing der Auth-Tag-Länge bei Entschlüsselung

### 🐛 Behoben
- E-Mail-Anhang-Speicherung und -Download
- Ticket-Löschung mit E-Mail-Verknüpfungen
- Artikelerstellung ohne Kategorieauswahl
- Zeiterfassungs-Filterung
- Diverses Logging und Fehlerbehandlung

---

## 📦 Upgrade-Anleitung

Von v0.1.0 auf v0.1.1:

1. Repository aktualisieren:
   ```bash
   git pull origin main
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Datenbankmigrationen ausführen:
   ```bash
   npm run db:push
   ```

4. Anwendung neu starten

---

## 📖 Neue Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| 📧 [EXCHANGE_EINRICHTUNG.md](../EXCHANGE_EINRICHTUNG.md) | Anleitung zur Exchange Online Integration |

---

🔗 **Repository**: https://github.com/northbyte-io/Support-Engine  
🏷️ **Version**: 0.1.1  
📅 **Veröffentlichungsdatum**: Januar 2025
