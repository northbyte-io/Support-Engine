# Entwicklungsumgebung einrichten

Diese Anleitung führt neue Entwickler Schritt für Schritt durch die lokale Einrichtung von Support-Engine.

## Voraussetzungen

| Werkzeug | Mindestversion | Empfohlen |
|----------|---------------|-----------|
| Node.js | 18.0 | 20 LTS |
| npm | 9.0 | 10+ |
| PostgreSQL | 14 | 16 (Neon empfohlen) |
| Git | 2.30 | aktuell |

## 1. Repository klonen

```bash
git clone https://github.com/northbyte-io/Support-Engine.git
cd Support-Engine
npm install
```

## 2. Datenbank einrichten

Support-Engine verwendet PostgreSQL. Für die Entwicklung empfehlen wir [Neon](https://neon.tech) (kostenloser Tier) oder eine lokale Instanz:

```bash
# Lokale PostgreSQL-Datenbank erstellen
createdb support_engine_dev
```

## 3. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env`-Datei im Projektstamm:

```ini
DATABASE_URL=postgresql://user:pass@localhost:5432/support_engine_dev
SESSION_SECRET=ein-langer-zufaelliger-string-fuer-entwicklung
PORT=5000
LOG_LEVEL=debug
```

:::{note}
`SESSION_SECRET` wird für die JWT-Signierung verwendet. In der Entwicklung kann ein beliebiger String genutzt werden, in der Produktion **muss** er lang und zufällig sein.
:::

## 4. Datenbankschema anwenden

```bash
npm run db:push
```

Dieser Befehl liest `shared/schema.ts` und erstellt alle Tabellen in der Datenbank. Bei Schemaänderungen erneut ausführen.

## 5. Entwicklungsserver starten

```bash
npm run dev
```

Der Server startet auf Port 5000 (konfigurierbar über `PORT`). Vite HMR ist aktiv — Frontend-Änderungen werden sofort im Browser angezeigt.

Erster Aufruf: `http://localhost:5000`

## Erstregistrierung

Beim ersten Start gibt es noch keine Benutzer. Registrieren Sie sich über die Registrierungsseite (`/register`). Der erste Benutzer eines neuen Mandanten erhält automatisch die Rolle `admin`.

## Wichtige Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Dev-Server starten (Port 5000) |
| `npm run build` | Produktions-Build erstellen |
| `npm start` | Produktions-Build starten |
| `npm run check` | TypeScript-Typprüfung |
| `npm run db:push` | Schema in DB anwenden |

## Projektstruktur verstehen

```
client/src/
├── pages/          # Eine Datei pro Seite (z.B. tickets.tsx)
├── components/     # Wiederverwendbare Komponenten
│   └── ui/         # shadcn/ui Basis — nicht ändern
└── lib/
    ├── auth.tsx     # useAuth()-Hook
    └── queryClient.ts  # apiRequest() Funktion

server/
├── routes.ts       # Hier neue API-Endpunkte hinzufügen
├── storage.ts      # Datenbankabfragen (IStorage-Interface)
└── logger.ts       # logger.info(), logger.error() etc.

shared/
└── schema.ts       # Neue Tabellen/Felder hier definieren
```

## Neue Features entwickeln

### Neues Datenbankfeld hinzufügen

1. `shared/schema.ts` bearbeiten — Spalte zur Tabelle hinzufügen
2. `npm run db:push` ausführen
3. Zod-Schema wird automatisch abgeleitet (drizzle-zod)
4. Bei Bedarf: `storage.ts` anpassen

### Neuen API-Endpunkt hinzufügen

```typescript
// server/routes.ts
app.get("/api/mein-endpunkt", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { tenantId } = req.user!;
  const daten = await storage.meineDaten(tenantId);
  res.json(daten);
});
```

### Neue Seite hinzufügen

1. `client/src/pages/neue-seite.tsx` erstellen
2. Route in `client/src/App.tsx` registrieren
3. Seitenleisteneintrag in `client/src/components/AppSidebar.tsx` hinzufügen

## Code-Konventionen

- **Sprache**: Kommentare, Variablen und UI-Strings auf Deutsch
- **Props**: Immer `Readonly<PropsInterface>` verwenden
- **Keys**: Stabile IDs als React-Keys, kein Array-Index
- **Logging**: `logger.info()` / `logger.error()` statt `console.log`
- **Sicherheit**: Keine Hardcoded-Secrets, keine SQL-Injections, XSS-Schutz via DOMPurify

## Häufige Probleme

**`npm run dev` startet nicht:**
- Prüfen Sie, ob `DATABASE_URL` korrekt gesetzt ist
- Prüfen Sie, ob Port 5000 frei ist: `lsof -i :5000`

**Datenbankfehler beim Start:**
- Führen Sie `npm run db:push` erneut aus
- Prüfen Sie PostgreSQL-Verbindung: `psql $DATABASE_URL`

**TypeScript-Fehler:**
- `npm run check` zeigt alle Typfehler
- Importpfade prüfen: `@/*` und `@shared/*` sind die korrekten Aliase
