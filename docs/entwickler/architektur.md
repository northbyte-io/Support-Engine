# Architektur

Support-Engine ist ein Full-Stack-TypeScript-Monorepo. Frontend und Backend teilen sich eine gemeinsame Codebasis und werden aus einem einzigen `package.json` heraus gebaut.

## Überblick

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  React 18 · Vite · Wouter · TanStack Query · shadcn/ui      │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / REST
┌───────────────────────▼─────────────────────────────────────┐
│                    Express.js                               │
│  server/index.ts → server/routes.ts (156 Endpunkte)         │
│                                                             │
│  Dienste:                                                   │
│  ├─ JWT-Auth (authMiddleware / adminMiddleware)             │
│  ├─ Rate-Limiting (express-rate-limit)                      │
│  ├─ SLA-Engine (Hintergrund-Tasks)                          │
│  ├─ Exchange-Sync (Microsoft Graph API)                     │
│  ├─ TLS/ACME (Let's Encrypt)                               │
│  ├─ KeyVault (AES-256-GCM)                                  │
│  └─ Logger (Winston + DailyRotateFile)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │ Drizzle ORM
┌───────────────────────▼─────────────────────────────────────┐
│              PostgreSQL 16 (Neon serverless)                │
│  50+ Tabellen · Multi-Tenant (tenantId überall)             │
└─────────────────────────────────────────────────────────────┘
```

## Verzeichnisstruktur

```
Support-Engine/
├── client/
│   └── src/
│       ├── App.tsx              # Wouter-Routen (alle Seiten)
│       ├── components/          # Wiederverwendbare UI-Komponenten
│       │   └── ui/              # 47 shadcn/ui Basiskomponenten (nicht ändern)
│       ├── lib/
│       │   ├── auth.tsx         # AuthContext + useAuth()-Hook
│       │   ├── branding.tsx     # BrandingProvider (Mandanten-Branding)
│       │   └── queryClient.ts   # TanStack Query Client
│       └── pages/               # Seitenkomponenten (1 Datei pro Seite)
├── server/
│   ├── index.ts                 # Express-Bootstrap, Vite-Integration
│   ├── routes.ts                # Alle 156 API-Endpunkte
│   ├── storage.ts               # Datenzugriffsschicht (~3000 Zeilen)
│   ├── logger.ts                # Winston-Logger mit Strukturierung
│   └── keyvault.ts              # AES-256-GCM Verschlüsselung
├── shared/
│   └── schema.ts                # Drizzle-Tabellen + Zod-Schemas (einzige Quelle)
├── migrations/                  # Drizzle-generierte SQL-Migrations
├── script/
│   └── build.ts                 # esbuild-Skript für Server-Bundle
└── docs/                        # Diese Dokumentation (Sphinx)
```

## Frontend

**Stack:** React 18, Vite 5, TypeScript 5, Tailwind CSS 4, shadcn/ui

**Routing:** [Wouter](https://github.com/molefrog/wouter) — leichtgewichtiger React-Router. Alle Routen definiert in `client/src/App.tsx`.

**Datenabruf:** [TanStack Query v5](https://tanstack.com/query) — alle Serverzustände sind in Queries verwaltet. `apiRequest()` in `@/lib/queryClient.ts` fügt automatisch den JWT-Bearer-Token hinzu.

**Formulare:** React Hook Form + Zod-Resolver. Validierungsschemas kommen aus `shared/schema.ts`.

**Design-System:**
- Primärfarbe: Amber (`--primary`)
- Dunkles Theme: Navy (`#080C16`)
- Schriften: Syne (Display), DM Sans (Sans), JetBrains Mono (Mono)
- Semantische Tokens statt hardcodierter Farben

**Pfad-Aliase (Vite + tsconfig):**
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

## Backend

**Stack:** Express.js, TypeScript, Drizzle ORM, PostgreSQL

**Schichtenmodell:**

```
server/routes.ts      ← HTTP-Handler, Auth-Prüfung, Validierung
       ↓
server/storage.ts     ← Datenbankabfragen (IStorage-Interface)
       ↓
Drizzle ORM           ← SQL-Generierung, typsichere Queries
       ↓
PostgreSQL (Neon)     ← Persistenz
```

**Middleware-Kette:**
1. `helmet` — Security-Header
2. `express-rate-limit` — Rate-Limiting (100 req/15 min, Proxy-Trust konfiguriert)
3. `express.json()` — Body-Parsing
4. `authMiddleware` — JWT-Verifizierung
5. `agentMiddleware` / `adminMiddleware` — Rollenprüfung

## Hintergrunddienste

| Dienst | Beschreibung |
|--------|-------------|
| SLA-Engine | Prüft alle 5 Minuten fällige Tickets, löst Eskalationen aus |
| Exchange-Sync | Ruft E-Mails aus konfigurierten Postfächern ab (konfigurierbar) |
| ACME-Renewal | Automatische TLS-Zertifikatsverlängerung (30 Tage vor Ablauf) |

## Multi-Tenancy

Alle Datenbankabfragen werden durch `tenantId` gefiltert. Der Wert kommt aus dem JWT-Token und wird vom `authMiddleware` in die Anfrage injiziert. Kein Tenant kann auf die Daten eines anderen zugreifen.

```typescript
// Beispiel-Abfrage in storage.ts
const tickets = await db
  .select()
  .from(ticketsTable)
  .where(eq(ticketsTable.tenantId, tenantId));  // immer gefiltert
```

## Authentifizierung

- **JWT** mit 7-Tage-Ablauf, signiert mit `SESSION_SECRET`
- **bcryptjs** mit 10 Runden für Passwort-Hashing
- Token wird im `localStorage` oder `sessionStorage` gespeichert (je nach "Angemeldet bleiben")
- Rollen: `admin`, `agent`, `customer`

## Build-System

```bash
npm run dev    # Vite-Dev-Server + Express (Port 5000), HMR aktiv
npm run build  # Vite → dist/public/ + esbuild → dist/index.cjs
npm start      # Produktions-Build starten
```

`script/build.ts` bündelt den Server mit esbuild als CommonJS-Modul (`dist/index.cjs`). Das Frontend wird als statische Dateien aus `dist/public/` ausgeliefert.
