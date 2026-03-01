# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Express + Vite HMR) on port 5000
npm run build      # Build production bundle (Vite → dist/public/, esbuild → dist/index.cjs)
npm start          # Run production build
npm run check      # TypeScript type checking
npm run db:push    # Apply Drizzle schema changes to database
```

No dedicated test framework is configured (no Jest/Vitest). TypeScript strict mode and Zod schemas at API boundaries serve as primary correctness checks.

## Architecture

**Full-stack TypeScript monorepo** — single `package.json` at root, `"type": "module"` (ES modules).

### Directory Layout

- `client/src/` — React 18 frontend (Vite, Wouter routing, Tanstack Query, shadcn/ui, Tailwind)
- `server/` — Express.js REST API
- `shared/schema.ts` — Single source of truth: all Drizzle table definitions + Zod schemas (1 588 lines)
- `script/build.ts` — Custom build script using esbuild for server bundle
- `migrations/` — Drizzle-generated SQL migrations
- `docs/` — German documentation

### Path Aliases

Defined in both `tsconfig.json` and `vite.config.ts`:
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

### Backend Layers

```
server/routes.ts (156 REST endpoints)
    ↓
server/storage.ts (data access layer, ~3 000 lines)
    ↓
Drizzle ORM
    ↓
PostgreSQL (Neon, via DATABASE_URL)
```

`server/index.ts` bootstraps Express, mounts routes, serves Vite in dev and static files in prod.

### Frontend Data Flow

Tanstack Query (`@/lib/queryClient.ts`) manages all server state. Forms use React Hook Form with Zod resolvers. Auth state lives in an `AuthContext` (`@/lib/auth.tsx`) — JWT stored in localStorage/sessionStorage, sent as `Authorization: Bearer <token>`.

### Multi-Tenancy

Every database query filters by `tenantId`. Tenant branding (colors, logo, CSS) is stored in the `tenants` table and loaded via `@/lib/branding.tsx`.

### Authentication

JWT (7-day expiry) + bcryptjs (10 rounds). Roles: `admin`, `agent`, `customer`. Protected routes validated by middleware in `server/routes.ts`.

## Key Files

| File | Purpose |
|------|---------|
| `shared/schema.ts` | All DB tables and Zod validation schemas — edit here first |
| `server/routes.ts` | All 156 API endpoints |
| `server/storage.ts` | All DB queries (Drizzle) |
| `client/src/App.tsx` | Wouter route definitions |
| `client/src/lib/auth.tsx` | Auth context, `useAuth()` hook |
| `client/src/components/ui/` | 47 shadcn/ui base components — don't modify |
| `design_guidelines.md` | UI/UX conventions (border-radius, colors, spacing) |

## Conventions

- **Language**: Comments, variable names, and user-facing strings are primarily German.
- **Schemas**: Add new DB columns to `shared/schema.ts`, then run `npm run db:push`. Zod insert/select schemas are derived via `drizzle-zod`.
- **Components**: Functional components with hooks only. Props interfaces should be `Readonly<…>` (see recent commits enforcing this).
- **No array index as key**: Use stable IDs as React keys (enforced in recent commits).
- **Logging**: Use `server/logger.ts` (Winston) instead of `console.log` on the server.
- **SonarQube**: CI runs SonarQube Cloud analysis. Avoid unnecessary assertions and dead assignments.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `SESSION_SECRET` | JWT signing secret |
| `PORT` | Server port (default 5000) |
