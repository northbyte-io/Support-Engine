# Architektur

## Systemübersicht

Support-Engine folgt einer modernen Webanwendungs-Architektur mit klarer Trennung von Frontend und Backend.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│                   (Browser / Mobile)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vite)                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  React   │  │ Tanstack │  │  Wouter  │  │  shadcn  │    │
│  │    18    │  │  Query   │  │ Routing  │  │    UI    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   REST   │  │   JWT    │  │ Drizzle  │  │ Winston  │    │
│  │   API    │  │   Auth   │  │   ORM    │  │ Logging  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                              │
│                    (Neon Database)                           │
└─────────────────────────────────────────────────────────────┘
```

## Verzeichnisstruktur

```
Support-Engine/
├── client/                 # Frontend
│   ├── src/
│   │   ├── components/     # React-Komponenten
│   │   ├── hooks/          # Custom Hooks
│   │   ├── lib/            # Hilfsfunktionen
│   │   ├── pages/          # Seiten-Komponenten
│   │   └── App.tsx         # Haupt-App
│   └── index.html
│
├── server/                 # Backend
│   ├── routes.ts           # API-Routen
│   ├── storage.ts          # Datenbankzugriff
│   └── index.ts            # Server-Entry
│
├── shared/                 # Gemeinsamer Code
│   └── schema.ts           # Datenbankschema
│
└── docs/                   # Dokumentation
```

## Frontend-Architektur

### Technologien

| Technologie | Zweck |
|-------------|-------|
| **React 18** | UI-Framework |
| **TypeScript** | Typsicherheit |
| **Tanstack Query** | Server-State-Management |
| **Wouter** | Routing |
| **shadcn/ui** | UI-Komponenten |
| **Tailwind CSS** | Styling |

### State Management

- **Server State**: Tanstack Query für API-Daten
- **Local State**: React useState/useReducer
- **Form State**: React Hook Form

## Backend-Architektur

### Schichten

```
┌─────────────────────────┐
│        Routes           │  ← HTTP-Endpunkte
├─────────────────────────┤
│       Services          │  ← Geschäftslogik
├─────────────────────────┤
│       Storage           │  ← Datenbankzugriff
├─────────────────────────┤
│    Drizzle ORM          │  ← Query Builder
├─────────────────────────┤
│      PostgreSQL         │  ← Datenbank
└─────────────────────────┘
```

### Authentifizierung

1. Benutzer sendet Login-Anfrage
2. Server validiert Credentials (bcrypt)
3. Server erstellt JWT-Token
4. Client speichert Token
5. Client sendet Token bei jeder Anfrage
6. Server validiert Token

## Multi-Tenancy

Jede Datenbankabfrage wird durch `tenantId` gefiltert:

```typescript
// Beispiel: Tickets eines Mandanten abrufen
const tickets = await db
  .select()
  .from(tickets)
  .where(eq(tickets.tenantId, user.tenantId));
```

## Sicherheit

- **Passwörter**: bcrypt mit Salt
- **Token**: JWT mit Expiry
- **XSS**: DOMPurify Sanitisierung
- **SQL-Injection**: Drizzle ORM Prepared Statements
