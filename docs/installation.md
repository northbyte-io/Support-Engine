# Installation

## Voraussetzungen

Stellen Sie sicher, dass folgende Software installiert ist:

- **Node.js** >= 20.x
- **PostgreSQL** >= 14
- **npm** oder **yarn**

## Schnellinstallation

### 1. Repository klonen

```bash
git clone https://github.com/northbyte-io/Support-Engine.git
cd Support-Engine
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei basierend auf `.env.example`:

```bash
cp .env.example .env
```

Wichtige Umgebungsvariablen:

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DATABASE_URL` | PostgreSQL Verbindungs-URL | `postgresql://user:pass@localhost:5432/support` |
| `JWT_SECRET` | Geheimer Schlüssel für JWT-Token | `ihr-geheimer-schluessel` |
| `SESSION_SECRET` | Session-Verschlüsselung | `session-geheimer-schluessel` |

### 4. Datenbank einrichten

```bash
npm run db:push
```

### 5. Anwendung starten

**Entwicklungsmodus:**
```bash
npm run dev
```

**Produktionsmodus:**
```bash
npm run build
npm run start
```

Die Anwendung ist nun unter `http://localhost:5000` erreichbar.

## Docker Installation

```bash
docker-compose up -d
```

## Erste Schritte nach der Installation

1. Öffnen Sie die Anwendung im Browser
2. Registrieren Sie den ersten Administrator-Benutzer
3. Konfigurieren Sie Ihren ersten Mandanten
4. Beginnen Sie mit der Ticketerstellung

Weitere Details finden Sie im Kapitel [Schnellstart](schnellstart.md).
