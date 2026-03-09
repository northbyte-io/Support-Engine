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

| File                        | Purpose                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `shared/schema.ts`          | All DB tables and Zod validation schemas — edit here first |
| `server/routes.ts`          | All 156 API endpoints                                      |
| `server/storage.ts`         | All DB queries (Drizzle)                                   |
| `client/src/App.tsx`        | Wouter route definitions                                   |
| `client/src/lib/auth.tsx`   | Auth context, `useAuth()` hook                             |
| `client/src/components/ui/` | 47 shadcn/ui base components — don't modify                |
| `design_guidelines.md`      | UI/UX conventions (border-radius, colors, spacing)         |

## Conventions

- **Language**: Comments, variable names, and user-facing strings are primarily German.
- **Schemas**: Add new DB columns to `shared/schema.ts`, then run `npm run db:push`. Zod insert/select schemas are derived via `drizzle-zod`.
- **Components**: Functional components with hooks only. Props interfaces should be `Readonly<…>` (see recent commits enforcing this).
- **No array index as key**: Use stable IDs as React keys (enforced in recent commits).
- **Logging**: Use `server/logger.ts` (Winston) instead of `console.log` on the server.
- **SonarQube**: CI runs SonarQube Cloud analysis. Avoid unnecessary assertions and dead assignments.

## Environment Variables

| Variable         | Purpose                                 |
| ---------------- | --------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string (required) |
| `SESSION_SECRET` | JWT signing secret                      |
| `PORT`           | Server port (default 5000)              |

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update 'tasks/lessons.md' with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero
  context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **PLan First**: Write plan to tasks/todo.md" with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to 'tasks/todo.md\*
6. **Capture Lessons**: Update tasks/lessons md" after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
