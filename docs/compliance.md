# Datenschutz & Compliance

Dieses Dokument beschreibt den Datenschutz- und Sicherheitsstatus von Support-Engine gegenüber der **DSGVO (EU) 2016/679** und dem **BSI IT-Grundschutz-Kompendium**. Es basiert auf einer vollständigen Analyse des Quellcodes (Stand: v0.1.4).

:::{warning}
Support-Engine ist eine **selbst gehostete** Anwendung. Der jeweilige **Betreiber (Mandant)** ist datenschutzrechtlich der **Verantwortliche** gemäß DSGVO Art. 4 Nr. 7. Dieses Dokument beschreibt die technischen Maßnahmen, die die Software bereitstellt. Die Erstellung einer Datenschutzerklärung, eines Verarbeitungsverzeichnisses und organisatorischer Schutzmaßnahmen liegt beim Betreiber.
:::

---

## Übersicht: Verarbeitete personenbezogene Daten

Support-Engine verarbeitet folgende Kategorien personenbezogener Daten:

| Kategorie | Daten | Betroffene Personen | Zweck |
|-----------|-------|---------------------|-------|
| **Benutzerkonto** | Vorname, Nachname, E-Mail, Rolle, letzter Login | Agenten, Admins, Kunden | Authentifizierung, Rollenverwaltung |
| **Tickets** | Betreff, Beschreibung (HTML), Status, Priorität, Kommentare | Agenten, Kunden | Aufgabenverfolgung, Support |
| **Zeiterfassung** | Datum, Dauer, Beschreibung, Agent-ID, Ticket-ID | Agenten | Leistungserfassung |
| **CRM — Kunden** | Name, E-Mail, Telefon, Adresse, Typ | Kunden (externe Personen) | Kundenverwaltung |
| **CRM — Kontakte** | Vorname, Nachname, E-Mail, Telefon, Position | Ansprechpartner | Kontaktverwaltung |
| **E-Mail-Integration** | E-Mail-Adresse, Betreff, Body (temporär) | E-Mail-Absender | Automatische Ticketerstellung |
| **Systemlogs** | Benutzer-ID, Mandanten-ID, Zeitstempel, Aktionen | Alle Benutzer | Betrieb, Sicherheit |

### Keine verarbeiteten Sonderkategorien

Support-Engine ist nicht konzipiert für die Verarbeitung von besonderen Kategorien personenbezogener Daten (Art. 9 DSGVO) wie Gesundheitsdaten, biometrische Daten oder politische Überzeugungen.

---

## DSGVO-Compliance-Status

### Art. 5 — Grundsätze der Verarbeitung

| Grundsatz | Status | Implementierung |
|-----------|--------|----------------|
| Rechtmäßigkeit | ✅ Erfüllt | Verarbeitung nur für angemeldete, authentifizierte Benutzer |
| Zweckbindung | ✅ Erfüllt | Daten werden nur für den jeweiligen Verarbeitungszweck genutzt |
| Datenminimierung | ⚠️ Teilweise | Systemlogs enthalten derzeit unnötige API-Response-Daten (→ C-01) |
| Richtigkeit | ✅ Erfüllt | Alle Daten sind durch Benutzer editierbar |
| Speicherbegrenzung | ⚠️ Teilweise | Log-Dateien: 7 Tage. Geschäftsdaten: kein automatisches Löschkonzept (→ M-03) |
| Integrität & Vertraulichkeit | ⚠️ Teilweise | Verschlüsselung von Secrets vorhanden; HTTP-Security-Header fehlen (→ C-02) |

### Art. 6 — Rechtsgrundlage

Support-Engine ist ein B2B-Werkzeug. Die Rechtsgrundlage für die Verarbeitung liegt üblicherweise bei:

- **Art. 6 Abs. 1 lit. b**: Vertragserfüllung (Support-Leistungen)
- **Art. 6 Abs. 1 lit. c**: Rechtliche Verpflichtung (Dokumentationspflicht)
- **Art. 6 Abs. 1 lit. f**: Berechtigte Interessen (internes Ticketing, Zeiterfassung)

Der Betreiber ist verpflichtet, die Rechtsgrundlage in seiner Datenschutzerklärung zu dokumentieren.

### Art. 17 — Recht auf Löschung

| Maßnahme | Status | Details |
|----------|--------|---------|
| Soft-Delete Tickets | ✅ Implementiert | `deletedAt`-Timestamp, Daten bleiben für Revisionsschutz |
| Hard-Delete Tickets | ✅ Implementiert | Admin-Funktion: vollständige Löschung |
| Soft-Delete KB-Artikel | ✅ Implementiert | Gleiche Logik wie Tickets |
| Benutzerkonto-Löschung | ❌ Fehlt | Nur Deaktivierung möglich, kein Löschen (→ H-01) |
| Anonymisierung | ❌ Fehlt | Keine automatische Anonymisierung gelöschter Benutzer (→ H-01) |

### Art. 20 — Recht auf Datenübertragbarkeit

| Maßnahme | Status | Details |
|----------|--------|---------|
| Persönlicher Datenexport | ❌ Fehlt | Kein Endpunkt für individuellen Datenauszug (→ H-02) |
| Berichtsexport | ✅ Vorhanden | Aggregatberichte als CSV, XLSX, PDF, HTML |

### Art. 25 — Datenschutz durch Technikgestaltung

| Maßnahme | Status | Details |
|----------|--------|---------|
| Mandantenisolierung | ✅ Implementiert | Alle DB-Queries filtern per `tenantId` |
| Authentifizierung | ✅ Implementiert | JWT in httpOnly-Cookie, bcrypt-Passwort-Hashing |
| Minimale Datenerfassung | ⚠️ Teilweise | Unnötige PII in Systemlogs (→ C-01) |
| Zugriffskontrolle | ✅ Implementiert | Rollenbasiert: admin / agent / customer |
| Einwilligungsfeld | ✅ Implementiert | `emailConsent` für Kontakte |

### Art. 32 — Sicherheit der Verarbeitung

| Maßnahme | Status | Details |
|----------|--------|---------|
| Verschlüsselung (Transport) | ⚠️ Bedingt | TLS-Verwaltung vorhanden; HTTPS-Erzwingung liegt beim Betreiber |
| Verschlüsselung (Ruhezustand) | ✅ Implementiert | AES-256-GCM für Exchange-Client-Secrets |
| Passwort-Hashing | ✅ Implementiert | bcrypt 10 Runden |
| Security-Header | ❌ Fehlt | kein Helmet / CSP / HSTS (→ C-02) |
| Protokollierung | ✅ Implementiert | Sicherheitsereignisse werden protokolliert |
| Rate-Limiting | ✅ Implementiert | 20 req/15 min auf Auth-Endpunkten |
| SQL-Injection-Schutz | ✅ Implementiert | Drizzle ORM (parametrisierte Queries) |
| XSS-Schutz | ✅ Implementiert | DOMPurify in allen HTML-Ausgaben |
| Kontosperrung | ❌ Fehlt | Keine kontobezogene Sperrung nach Fehlversuchen (→ H-05) |

---

## BSI IT-Grundschutz-Status

### ORP.4 — Identitäts- und Berechtigungsmanagement

| Anforderung | Status | Details |
|------------|--------|---------|
| ORP.4.A1 — Regelung für Benutzerzugang | ✅ Erfüllt | Admins können Benutzer anlegen und deaktivieren |
| ORP.4.A3 — Benutzerregistrierung | ⚠️ Lücke | Offene Selbstregistrierung ohne Einladung (→ H-04) |
| ORP.4.A22 — Passwortrichtlinie | ❌ Nicht erfüllt | Nur 6 Zeichen Minimum (→ H-03) |
| ORP.4.A23 — Schutz vor Kontoübernahme | ⚠️ Teilweise | Rate-Limiting vorhanden, kein kontobezogenes Lockout (→ H-05) |
| Rollentrennung | ✅ Erfüllt | `admin` / `agent` / `customer` mit klar getrennten Rechten |
| Session-Sicherheit | ✅ Erfüllt | httpOnly-Cookie, sameSite=strict, secure in Produktion |

### OPS.1.1.5 — Protokollierung

| Anforderung | Status | Details |
|------------|--------|---------|
| Sicherheitsereignisse protokollieren | ✅ Erfüllt | Fehlgeschlagene Anmeldungen, Security-Events |
| Protokolldaten schützen | ✅ Erfüllt | Logs nur für Admins einsehbar |
| Protokollierung minimal halten | ❌ Nicht erfüllt | Vollständige API-Response-Bodies werden protokolliert (→ C-01) |
| Log-Rotation | ✅ Erfüllt | 7-Tage-Rotation, 2 GB max, gzip-Komprimierung |
| PII in Logs minimieren | ❌ Nicht erfüllt | E-Mail-Adressen in Security-Logs (→ M-01) |

### APP.3.1 — Webanwendungen

| Anforderung | Status | Details |
|------------|--------|---------|
| APP.3.1.A2 — Zugriffskontrolle | ✅ Erfüllt | JWT-Middleware auf allen geschützten Endpunkten |
| APP.3.1.A11 — Schutz vor Cross-Site Scripting | ✅ Erfüllt | DOMPurify, keine unsicheren innerHTML-Operationen ohne Sanitisierung |
| APP.3.1.A12 — Schutz vor CSRF | ✅ Erfüllt | httpOnly + sameSite=strict Cookie verhindert CSRF |
| APP.3.1.A14 — Schutz vor schädlichen Dateien | ⚠️ Lücke | Keine MIME-Typ-Validierung bei Dateiuploads (→ M-02) |
| APP.3.1.A16 — Sichere HTTP-Header | ❌ Nicht erfüllt | Kein Helmet / CSP / HSTS / X-Frame-Options (→ C-02) |
| APP.3.1.A3 — SQL-Injection | ✅ Erfüllt | Drizzle ORM, keine Raw-SQL mit Benutzereingaben |
| APP.3.1.A9 — Schutz vor Denial of Service | ✅ Erfüllt | Rate-Limiting auf Auth- und Sync-Endpunkten |

### CON.2 — Datenschutz

| Anforderung | Status | Details |
|------------|--------|---------|
| CON.2.A1 — Umsetzung datenschutzrechtlicher Anforderungen | ⚠️ Teilweise | Technische Maßnahmen vorhanden; Löschkonzept fehlt |
| CON.2.A3 — Verfahrensverzeichnis | ❌ Nicht erfüllt | Keine integrierte Verwaltung (→ M-05) |
| CON.2.A7 — Löschkonzept | ❌ Nicht erfüllt | Keine konfigurierbaren Aufbewahrungsfristen (→ M-03) |

---

## Technische Sicherheitsmaßnahmen (Art. 32 DSGVO)

Die folgende Tabelle listet die technisch-organisatorischen Maßnahmen (TOMs) die in Support-Engine implementiert sind:

### Implementierte TOMs

**Zugriffskontrolle:**
- JWT-basierte Authentifizierung (7-Tage-Gültigkeit, httpOnly-Cookie)
- Rollenbasierte Autorisierung (admin / agent / customer)
- Mandantenisolierung auf Datenbankebene (tenantId-Filter in allen Queries)
- Rate-Limiting auf Authentifizierungsendpunkten

**Verschlüsselung:**
- Passwörter: bcrypt mit 10 Runden
- Exchange-Client-Secrets: AES-256-GCM mit PBKDF2-Schlüsselableitung (100.000 Iterationen)
- Session-Token: httpOnly-Cookie mit `secure: true` in Produktion
- TLS-Zertifikatsverwaltung: Let's Encrypt / ACME integriert

**Integrität:**
- Parameterisierte Datenbankabfragen (kein SQL-Injection-Risiko)
- XSS-Sanitisierung: DOMPurify in allen HTML-Rendering-Pfaden
- CSRF-Schutz: `sameSite=strict` Cookie-Attribut
- Zod-Schema-Validierung an allen API-Eingabepunkten

**Verfügbarkeit:**
- Soft-Delete-Mechanismus für Tickets und KB-Artikel
- Log-Rotation mit 7-Tagen-Aufbewahrung und gzip-Komprimierung
- Automatische TLS-Verlängerung (30 Tage vor Ablauf)

**Transparenz:**
- Vollständiges Security-Event-Logging
- Asset-Änderungshistorie
- KB-Artikel-Versionshistorie
- AGPL-3.0: Quellcode öffentlich verfügbar (`/api/source`)

---

## Offene Compliance-Lücken (Zusammenfassung)

Die folgende Tabelle listet alle identifizierten Lücken mit Priorität. Details, betroffene Dateien und Lösungsempfehlungen sind in `COMPLIANCE_ISSUES.md` dokumentiert.

| ID | Beschreibung | Priorität | DSGVO | BSI |
|----|-------------|-----------|-------|-----|
| C-01 | PII in Systemlogs (vollständige Response-Bodies) | 🔴 Kritisch | Art. 5, 25, 32 | OPS.1.1.5 |
| C-02 | Fehlende HTTP-Sicherheitsheader (kein Helmet) | 🔴 Kritisch | Art. 32 | APP.3.1.A16 |
| H-01 | Kein Recht auf Löschung von Benutzerkonten | 🟠 Hoch | Art. 17 | CON.2 |
| H-02 | Keine Datenportabilität (persönlicher Export) | 🟠 Hoch | Art. 20 | — |
| H-03 | Passwortmindestlänge 6 Zeichen (BSI: 12) | 🟠 Hoch | Art. 32 | ORP.4.A22 |
| H-04 | Offene Selbstregistrierung ohne Einladung | 🟠 Hoch | Art. 5 | ORP.4.A3 |
| H-05 | Keine kontobezogene Brute-Force-Sperre | 🟠 Hoch | Art. 32 | ORP.4.A23 |
| H-06 | KeyVault-Fallback auf SESSION_SECRET | 🟠 Hoch | Art. 32 | APP.3.1 |
| M-01 | E-Mail-Adresse in Security-Logs | 🟡 Mittel | Art. 25 | OPS.1.1.5 |
| M-02 | Keine MIME-Typ-Validierung bei Dateiuploads | 🟡 Mittel | Art. 32 | APP.3.1.A14 |
| M-03 | Keine automatischen Aufbewahrungsfristen | 🟡 Mittel | Art. 5 lit. e | CON.2.A7 |
| M-04 | Exchange-E-Mails dauerhaft gespeichert | 🟡 Mittel | Art. 5 lit. c, e | CON.2 |
| M-05 | Kein Verarbeitungsverzeichnis | 🟡 Mittel | Art. 30 | CON.2.A3 |
| L-01 | Kein Datenschutzhinweis in der UI | 🟢 Niedrig | Art. 13 | — |
| L-02 | Kein Datenpannen-Meldeverfahren | 🟢 Niedrig | Art. 33/34 | — |
| L-03 | CLAUDE.md-Dokumentation veraltet | 🟢 Niedrig | — | — |
| L-04 | Einwilligung ohne Audit-Trail | 🟢 Niedrig | Art. 7 | — |

---

## Hinweise für Betreiber

### Datenschutzerklärung

Als Betreiber (Verantwortlicher) müssen Sie eine Datenschutzerklärung gemäß DSGVO Art. 13 bereitstellen, die mindestens enthält:

- Name und Kontaktdaten des Verantwortlichen
- Zwecke und Rechtsgrundlagen der Verarbeitung
- Aufbewahrungsfristen
- Rechte der Betroffenen (Auskunft, Berichtigung, Löschung, Datenübertragbarkeit)
- Kontakt des Datenschutzbeauftragten (falls vorhanden)

### Auftragsverarbeitungsvertrag (AVV)

Wenn Sie Support-Engine als Dienstleistung für Dritte betreiben oder als SaaS anbieten, müssen Sie einen AVV gemäß DSGVO Art. 28 mit Ihren Mandanten abschließen.

### Verzeichnis von Verarbeitungstätigkeiten (Art. 30)

Als Verantwortlicher müssen Sie ein Verarbeitungsverzeichnis führen. Folgende Verarbeitungstätigkeiten sind zu dokumentieren:

1. Ticket-Management und Support-Kommunikation
2. Benutzerverwaltung und Authentifizierung
3. Zeiterfassung und Leistungsabrechnung
4. CRM / Kundenverwaltung
5. E-Mail-Integration (Microsoft Exchange)
6. System-Logging und Sicherheitsprotokollierung

### Technische und organisatorische Maßnahmen (TOMs)

Ergänzend zur Software-seitigen TOM-Dokumentation oben sind folgende organisatorische Maßnahmen vom Betreiber umzusetzen:

- HTTPS erzwingen (TLS-Termination am Load-Balancer oder über die integrierte TLS-Verwaltung)
- Datenbankzugriff auf Datenbankserver beschränken (kein direkter externer Zugang)
- Regelmäßige Datenbank-Backups mit Verschlüsselung
- `SESSION_SECRET` und `TLS_MASTER_KEY` als kryptografisch starke, eindeutige Zufallswerte setzen (mindestens 32 Byte, base64-encodiert)
- Regelmäßige Sicherheitsupdates von Node.js und npm-Abhängigkeiten

---

*Dieses Dokument wurde auf Basis einer vollständigen Quellcodeanalyse erstellt. Änderungen am Quellcode können den Compliance-Status beeinflussen. Letzte Überprüfung: März 2026 — Support-Engine v0.1.4*
