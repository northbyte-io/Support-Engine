# Installation

Diese Anleitung beschreibt die Installation von Support-Engine für Entwicklungs- und Produktivumgebungen.

## Voraussetzungen

| Software | Mindestversion | Empfohlen |
|----------|---------------|-----------|
| **Node.js** | 20.x | 20 LTS |
| **PostgreSQL** | 14 | 16 |
| **npm** | 9.x | ≥ 10 |
| **Git** | – | aktuell |

Überprüfen Sie die installierten Versionen:

```bash
node --version   # sollte v20.x.x ausgeben
psql --version   # sollte psql (PostgreSQL) 14.x... ausgeben
npm --version
```

## Repository klonen

```bash
git clone https://github.com/northbyte-io/Support-Engine.git
cd Support-Engine
```

## Abhängigkeiten installieren

```bash
npm install
```

## Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env`-Datei im Projektstamm:

```bash
touch .env
```

Fügen Sie die folgenden Variablen ein:

```ini
# Pflichtfelder
DATABASE_URL=postgresql://user:password@localhost:5432/support_engine
SESSION_SECRET=ihr-sicherer-geheimer-schluessel-mindestens-32-zeichen

# Optional
PORT=5000
```

### Variablenreferenz

| Variable | Pflicht | Beschreibung |
|----------|---------|--------------|
| `DATABASE_URL` | ✅ | PostgreSQL-Verbindungs-URL |
| `SESSION_SECRET` | ✅ | Geheimer Schlüssel zum Signieren von JWT-Tokens. Mindestens 32 zufällige Zeichen. |
| `PORT` | – | HTTP-Port des Servers (Standard: `5000`) |

:::{warning}
Committen Sie die `.env`-Datei niemals in das Repository. Sie ist in `.gitignore` eingetragen.
:::

## Datenbank einrichten

Erstellen Sie zunächst die Datenbank in PostgreSQL:

```sql
CREATE DATABASE support_engine;
```

Wenden Sie dann das Drizzle-Schema an:

```bash
npm run db:push
```

Dieser Befehl erstellt alle erforderlichen Tabellen und Indizes in der Datenbank.

## Anwendung starten

### Entwicklungsmodus

```bash
npm run dev
```

Startet den Express-Server mit Vite HMR (Hot Module Replacement) auf Port `5000`. Änderungen am Frontend werden sofort ohne Neustart übernommen.

### Produktionsmodus

```bash
npm run build   # Erstellt dist/public/ (Vite) und dist/index.cjs (esbuild)
npm start       # Startet den produktiven Server
```

Die Anwendung ist nach dem Start unter `http://localhost:5000` erreichbar.

## Ersten Administrator anlegen

Nach dem ersten Start ist noch kein Benutzer vorhanden:

1. Öffnen Sie `http://localhost:5000/register`
2. Füllen Sie das Registrierungsformular aus
3. Der **erste Benutzer** einer Instanz erhält automatisch die Rolle **Admin**

## Docker (optional)

Wenn Sie Docker bevorzugen:

```bash
docker-compose up -d
```

:::{note}
Eine `docker-compose.yml` muss gegebenenfalls noch für Ihre Umgebung angepasst werden
(Datenbankhost, Volumes, Secrets).
:::

## Verfügbare Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Entwicklungsserver mit Vite HMR starten |
| `npm run build` | Produktions-Bundle erstellen |
| `npm start` | Produktionsserver starten |
| `npm run check` | TypeScript strict mode prüfen |
| `npm run lint` | ESLint-Analyse ausführen |
| `npm run db:push` | Drizzle-Schema in die Datenbank pushen |
| `npm run e2e` | Playwright E2E-Tests ausführen |
| `npm test` | Vitest Unit-Tests ausführen |

## Nächste Schritte

- [Schnellstart – erste Einrichtung](schnellstart.md)
- [E-Mail-Integration einrichten](admin/email-integration.md)
- [Entwicklungsumgebung konfigurieren](entwickler/entwicklungsumgebung.md)
