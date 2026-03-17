# 🔒 v0.1.2 - Sicherheit, Tests & Code-Qualität

Diese Version konzentriert sich auf kritische Sicherheitsverbesserungen, umfassende Codequalitätsmaßnahmen sowie den Aufbau einer stabilen Testinfrastruktur und Performance-Optimierungen.

---

## 📋 Übersicht

Support-Engine v0.1.2 behebt mehrere sicherheitsrelevante Schwachstellen und schließt über 30 SonarQube-Qualitätsprobleme. Darüber hinaus wurden automatisierte Tests (E2E und Unit), ein ESLint-Regelwerk sowie deutliche Performance-Verbesserungen durch Batch-Loading und Paginierung eingeführt.

---

## ✨ Neue Funktionen

### 🧪 Testinfrastruktur
- Playwright E2E-Testsuite für Authentifizierungsflows und Login-Szenarien
- Vitest-Unit-Tests für Auth, Verschlüsselung (KeyVault) und Logger
- Vitest-Konfiguration abgegrenzt von Playwright, um Konflikte zu vermeiden

### 🔍 Code-Analyse & Linting
- ESLint mit TypeScript-, React-Hooks- und no-console-Regeln integriert
- SonarQube Cloud-Analyse etabliert; alle initialen Issues behoben

### 🌐 Internationalisierung
- `i18n.ts` vollständig in die Anwendung eingebunden
- Fest kodierte Lade- und Fehlertexte auf i18n-Schlüssel migriert

### 🗂️ Soft-Delete für Tickets und Wissensdatenbank-Artikel
- Gelöschte Tickets und KB-Artikel werden nicht mehr physisch entfernt
- DSGVO-konforme Datenaufbewahrung mit Wiederherstellungsmöglichkeit

### ⚡ Optimistische UI-Updates
- Statusänderungen an Tickets werden sofort im UI reflektiert (ohne Wartezeit)
- Kommentare erscheinen unmittelbar nach dem Absenden
- Kanban-Board-Drag-Drop reagiert ohne Netzwerklatenz

---

## 🔧 Verbesserungen

### ⚡ Performance
- Ticket-Relationen werden gebündelt geladen statt als einzelne Abfragen (`getTickets()`)
- Asset-Relationen per Batch-Loading optimiert (`getAssets()`)
- CRM-Relationen werden zusammengefasst geladen
- Paginierung zu allen Listen-Endpunkten hinzugefügt (reduziert Datenbankbelastung)

### ♿ Barrierefreiheit
- `aria-label` zu allen Schaltflächen ohne sichtbarem Text hinzugefügt
- `aria-pressed` und `role="group"` für Toggle-Elemente im Ticket-Formular ergänzt
- Fieldset/Legend statt `div[role="group"]` für Formulargruppen verwendet

### 🏗️ Code-Struktur
- `requireOwnedResource`-Helfer extrahiert: 36 wiederholte Fetch-+404-+403-Muster entfernt
- `assertTenantAccess()`-Helfer für konsistente Mandantenzugriffsprüfung eingeführt
- `handleApiError`-Helfer in `server/routes.ts` eingeführt: über 150 duplizierte Catch-Blöcke konsolidiert
- Gemeinsame Konstanten (`statusOptions`, `priorityOptions`) in eigene Datei extrahiert
- Wiederverwendbares `AuthPageShell`-Komponente für Login- und Registrierungsseite
- Hilfsmethoden in `server/storage.ts` für Relationsauflösung extrahiert

---

## 🔒 Sicherheitsverbesserungen

### Kritische Fixes
- **Exchange-Zugriffstoken**: Tokens werden nicht mehr in der Datenbank gespeichert, sondern ausschließlich im Arbeitsspeicher gehalten — verhindert Tokenleaks bei Datenbankzugriffen
- **localStorage-Bereinigung**: Token-Nutzung aus Zeiterfassungs- und Log-Seiten entfernt (Risiko: XSS-Zugriff auf gespeicherte Tokens)

### SonarQube Security Hotspots (alle behoben)
- **S2068 (BLOCKER)**: Hart kodierter Passwort-Hash in Testdatei durch Umgebungsvariable ersetzt
- **S5852 (ReDoS)**: Zwei reguläre Ausdrücke mit exponentieller Backtracking-Anfälligkeit entschärft — in `server/logger.ts` (E-Mail-Maskierung) und `playwright.config.ts` durch O(n)-Algorithmus ersetzt
- **S2245 (Schwacher Zufallsgenerator)**: `Math.random()` in `sidebar.tsx` und `tests/logger.test.ts` durch `crypto`-basierte Alternativen ersetzt
- **S7637 (GitHub Actions)**: GitHub Actions auf Commit-SHA statt Tag-Referenz fixiert — verhindert Supply-Chain-Angriffe

---

## 🐛 Fehlerbehebungen

- Überflüssige Non-Null-Assertions (`!`) in mehreren Dateien entfernt (korrekte Laufzeitprüfungen stattdessen)
- `parseInt()` durch `Number.parseInt()` ersetzt (konsistentes Parsing-Verhalten)
- `import path from "path"` auf `"node:path"` korrigiert (explizite Node.js-Module)
- Doppelter `@shared/schema`-Import in `server/tls-service.ts` zusammengeführt
- Unsichere `String()`-Konvertierung auf unbekannte Typen in `queryClient.ts` behoben
- Verschachtelter Ternary-Ausdruck in `server/logger.ts` in separaten `if/else`-Block extrahiert
- `String.match()` durch `RegExp.exec()` ersetzt (konsistente Regex-API)
- Props der `AuthPageShell`-Komponente als `Readonly<>` markiert

---

## 🛠️ Technische Änderungen

| Bereich | Änderung |
|---------|----------|
| Sicherheit | Exchange-Token nur noch In-Memory |
| Sicherheit | localStorage-Token-Nutzung entfernt |
| Tests | Playwright E2E-Testsuite hinzugefügt |
| Tests | Vitest Unit-Tests für Auth/KeyVault/Logger |
| Linting | ESLint mit TypeScript + React-Hooks-Regeln |
| Performance | Batch-Loading für Tickets, Assets, CRM |
| Performance | Paginierung für alle Listen-Endpunkte |
| Code-Qualität | 30+ SonarQube-Issues behoben |
| DSGVO | Soft-Delete für Tickets und KB-Artikel |

---

## 📝 Änderungsprotokoll

### ➕ Hinzugefügt
- Playwright E2E-Testsuite
- Vitest Unit-Tests (Auth, KeyVault, Logger)
- ESLint mit TypeScript-, React-Hooks- und no-console-Regeln
- i18n vollständig eingebunden
- Soft-Delete für Tickets und KB-Artikel
- Optimistische UI-Updates (Status, Kommentare, Kanban-Board)
- `requireOwnedResource`- und `assertTenantAccess`-Helfer
- `handleApiError`-Helfer in API-Routes

### 🔧 Verbessert
- Performance durch Batch-Loading und Paginierung
- Barrierefreiheit (aria-label, aria-pressed, fieldset)
- Code-Struktur durch Extraktion gemeinsamer Hilfsfunktionen
- Testabdeckung und statische Codeanalyse

### 🔒 Sicherheit
- Exchange-Zugriffstoken aus Datenbank entfernt (nur In-Memory)
- localStorage-Token-Bereinigung auf Zeiterfassungs- und Log-Seiten
- S2068: Hart kodiertes Passwort in Tests behoben
- S5852: ReDoS-Anfälligkeit in Regex-Ausdrücken behoben
- S2245: Schwacher Zufallsgenerator (`Math.random()`) ersetzt
- S7637: GitHub Actions auf Commit-SHA fixiert

### 🐛 Behoben
- Überflüssige Non-Null-Assertions entfernt
- `parseInt` → `Number.parseInt` in API-Routes
- Doppelter Import in TLS-Service
- Unsichere String-Konvertierung in QueryClient
- Verschachtelter Ternary in Logger
- Props-Readonly-Markierung in AuthPageShell

---

## 📦 Upgrade-Anleitung

Von v0.1.1 auf v0.1.2:

1. Repository aktualisieren:
   ```bash
   git pull origin main
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Datenbankmigrationen ausführen (Soft-Delete-Felder):
   ```bash
   npm run db:push
   ```

4. Anwendung neu starten

> **Hinweis**: Die Exchange-Integration speichert Zugriffstoken ab dieser Version ausschließlich im Arbeitsspeicher. Bei einem Neustart der Anwendung wird eine erneute Authentifizierung gegenüber Microsoft 365 erforderlich.

---

🔗 **Repository**: https://github.com/northbyte-io/Support-Engine
🏷️ **Version**: 0.1.2
📅 **Veröffentlichungsdatum**: März 2026
