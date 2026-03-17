# Mitwirken

Wir freuen uns über Beiträge jeder Art – sei es durch Fehlerberichte, Verbesserungsvorschläge oder direkte Code-Beiträge.

## Fehler melden

1. Prüfen Sie zunächst, ob das Problem bereits als [Issue](https://github.com/northbyte-io/Support-Engine/issues) gemeldet wurde
2. Erstellen Sie ein neues Issue mit folgenden Angaben:
   - **Klare Beschreibung** des Problems
   - **Schritte zur Reproduktion**
   - **Erwartetes vs. tatsächliches Verhalten**
   - **Umgebung** (Node.js-Version, Browser, Betriebssystem)
   - **Screenshots oder Logausgaben**, sofern hilfreich

## Features vorschlagen

1. Erstellen Sie ein Issue mit dem Label `enhancement`
2. Beschreiben Sie das gewünschte Feature klar und präzise
3. Erläutern Sie den konkreten Anwendungsfall

## Code beitragen

### Voraussetzungen

- Fork des Repositories auf GitHub
- Lokale Entwicklungsumgebung eingerichtet (siehe [Entwicklungsumgebung](entwickler/entwicklungsumgebung.md))

### Ablauf

```bash
# 1. Fork klonen
git clone https://github.com/IHR-USERNAME/Support-Engine.git
cd Support-Engine

# 2. Feature-Branch erstellen
git checkout -b feature/kurze-beschreibung

# 3. Abhängigkeiten installieren
npm install

# 4. Entwicklungsserver starten
npm run dev

# 5. Änderungen vornehmen und testen
npm run check   # TypeScript-Prüfung
npm run lint    # ESLint
npm run e2e     # E2E-Tests (optional)

# 6. Commit erstellen
git commit -m "feat: kurze Beschreibung der Änderung"

# 7. Branch pushen
git push origin feature/kurze-beschreibung

# 8. Pull Request auf GitHub erstellen
```

## Commit-Konventionen

Verwenden Sie semantische Commit-Nachrichten:

| Präfix | Bedeutung | Beispiel |
|--------|-----------|---------|
| `feat:` | Neue Funktion | `feat: Zeiterfassung per Tastenkürzel starten` |
| `fix:` | Fehlerbehebung | `fix: SLA-Status bei Statuswechsel korrekt aktualisieren` |
| `docs:` | Dokumentation | `docs: Installationsanleitung erweitern` |
| `refactor:` | Refactoring (kein Bugfix, kein Feature) | `refactor: Storage-Layer für Tickets vereinfachen` |
| `test:` | Tests hinzufügen oder anpassen | `test: E2E-Test für Ticket-Erstellung` |
| `chore:` | Build, Abhängigkeiten, Konfiguration | `chore: Drizzle ORM auf 0.40 aktualisieren` |

## Coding-Richtlinien

- **Sprache**: Kommentare und Variablennamen auf Deutsch; Code-Bezeichner auf Englisch (TypeScript-Konvention)
- **Props**: Alle React-Props mit `Readonly<{...}>` typisieren
- **React Keys**: Keine Array-Indizes als `key`-Props; stabile IDs verwenden
- **Logging**: `server/logger.ts` (Winston) verwenden; kein `console.log` im Server-Code
- **Datenbankzugriff**: Ausschließlich über `server/storage.ts`; direkte DB-Abfragen in Routes vermeiden
- **Validierung**: Zod-Schemas aus `shared/schema.ts` an API-Grenzen einsetzen
- **SonarQube**: CI-Analyse läuft automatisch; unnötige Assertions und tote Zuweisungen vermeiden

## Tests

- Neue Backend-Funktionen sollten einen Unit-Test in `tests/` erhalten
- Neue UI-Flows sollten, wenn möglich, einen E2E-Test in `e2e/` erhalten
- Alle bestehenden Tests müssen nach der Änderung weiterhin bestehen

```bash
npm test        # Vitest Unit-Tests
npm run e2e     # Playwright E2E-Tests
```

## Verhaltenskodex

- Respektvoller und konstruktiver Umgang
- Kritik an Code, nicht an Personen
- Offenheit für verschiedene Lösungsansätze

## Kontakt

- **Issues & Diskussionen**: https://github.com/northbyte-io/Support-Engine/issues
- **E-Mail**: info@northbyte.io
