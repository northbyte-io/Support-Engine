# Code Review Resolution — Support-Engine

> Generated: 2026-03-07
> Scope: Full repository review (server, client, schema, build, docs)
> Based on: CODE_REVIEW.md (reviewer: Claude Code, claude-sonnet-4-6)

This document summarises every issue identified in the code review, explains
how it was resolved, and records which issues are deferred and why.

---

## Table of Contents

1. [Resolved Issues](#resolved-issues)
2. [Deferred Issues (architectural)](#deferred-issues)
3. [Summary Table](#summary-table)

---

## Resolved Issues

### 1.6 — Missing Tenant Isolation on TLS Certificate Deletion

**Severity:** High · **Commit:** `fabaeef`

**Problem:** `DELETE /api/tls/certificates/:id` called `storage.deleteTlsCertificate(id)`
with no tenant check, allowing an admin from tenant A to delete certificates
belonging to tenant B.

**Fix:**
- Added a `tenantId` column to the `tlsCertificates` schema.
- Updated `deleteTlsCertificate(id, tenantId)` to first fetch the certificate and
  verify `cert.tenantId === tenantId` before deleting.
- Updated the route to pass `req.user!.tenantId`.
- Run `npm run db:push` to apply the schema migration.

---

### 2.7 — No Rate Limiting on Any Endpoint

**Severity:** High · **Commit:** `acd6140`

**Problem:** No rate limiting existed on `/api/auth/login`, `/api/auth/register`,
or `/api/exchange/sync`, enabling brute-force, enumeration, and DoS attacks.

**Fix:**
- Installed `express-rate-limit`.
- Added an `authLimiter` (20 requests / 15 min) applied to all `/api/auth/` routes.
- Added a `syncLimiter` (5 requests / 1 min) applied to `/api/exchange/sync`.
- Both limiters return `429` with a German-language error message.

---

### 2.9 — No React Error Boundaries

**Severity:** Medium · **Commit:** `a3b0dcc`

**Problem:** No `ErrorBoundary` wrapped any route. An uncaught render error
anywhere (malformed TipTap HTML, Recharts edge case) crashed the entire app.

**Fix:**
- Created `client/src/components/ErrorBoundary.tsx` — a class component with a
  German-language fallback UI showing the error message and retry/reload buttons.
- Wrapped `<Router />` in `App.tsx` with `<ErrorBoundary>`.

---

### 3.5 — N+1 in Ticket Assignee Creation

**Severity:** Medium · **Commit:** `9ab1cdb`

**Problem:** `POST /api/tickets` fired one `INSERT` per assignee ID in a
`for-await` loop.

**Fix:**
- Added `addTicketAssignees(rows: InsertTicketAssignee[])` to the `IStorage`
  interface and the `DatabaseStorage` class — it issues a single multi-row
  `INSERT … VALUES (…), (…)`.
- Updated the route handler to build the full array and call the new method once.

---

### 4.1 — Inconsistent DELETE Response Codes

**Severity:** Low · **Commit:** `f971240`

**Problem:** Four `DELETE` handlers returned `200 OK` with a JSON body instead
of the RFC-7231-compliant `204 No Content`.

**Fix:** Changed the following to `res.status(204).send()`:
- `DELETE /api/tls/certificates/:id`
- `DELETE /api/exchange/mailboxes/:id`
- `DELETE /api/exchange/rules/:id`
- `DELETE /api/exchange/processing-rules/:id`

---

### 4.2 — POST Creation Endpoints Returning 200 Instead of 201

**Severity:** Low · **Commit:** `4c228c3`

**Problem:** `POST /api/exchange/mailboxes` and `POST /api/exchange/mailboxes/:id/rules`
returned `200 OK` after creating a resource.

**Fix:** Changed both to `res.status(201).json(resource)`.

---

### 6.3 — No Loading State During File Download

**Severity:** Low · **Commit:** `e762822`

**Problem:** Clicking an attachment started a `fetch` with no visual feedback,
causing users to click multiple times and fire duplicate requests.

**Fix:**
- Added `downloadingAttachmentId: string | null` state.
- The clicked attachment's icon is replaced with a `Loader2` spinner and the
  item is dimmed/pointer-events-none during the download.
- Added `aria-busy` and `aria-label` attributes for accessibility.

---

### 6.5 — Inline Async Function Causing Re-renders in Ticket Detail

**Severity:** Low · **Commit:** `e762822`

**Problem:** Each attachment row had an inline `onClick={async () => { … }}`
that created a new function reference on every render.

**Fix:** Extracted the handler to `handleDownloadAttachment` wrapped in
`useCallback`, imported `useCallback` from React.

---

### 6.8 — `window.confirm()` Used for Destructive Action Confirmation

**Severity:** Low · **Commit:** `c82e2ee`

**Problem:** Ticket deletion used `window.confirm()` — a blocking browser
dialog, not styleable, not accessible, and blocked by some contexts.

**Fix:**
- Added `isDeleteDialogOpen` state.
- Replaced the confirm call with a shadcn/ui `<AlertDialog>` that shows a
  German-language confirmation with "Abbrechen" / "Löschen" actions.

---

### 8.1 — `as any` Type Assertions in Storage Layer

**Severity:** Low · **Commit:** `fa8d35f`

**Problem:** Six destructuring statements used `as any` to strip `tenantId`/`id`
fields from insert/update payloads, defeating TypeScript's type checking.

**Fix:** Replaced each `as any` with a narrow type intersection that explicitly
adds the optional fields that are being destructured out, e.g.:
```typescript
// Before
const { tenantId: _, ...rest } = category as any;

// After
const { tenantId: _, ...rest } = category as typeof category & { tenantId?: string | null };
```

---

### 8.3 — `Promise.all` Without Error Context in `getTicket()`

**Severity:** Medium · **Commit:** `4b6cb78`

**Problem:** If any of the parallel relation-loading queries in `getTicket()`
threw, `Promise.all` rejected with no context about which sub-query failed.

**Fix:** Added a `.catch()` on the `Promise.all` that rethrows with a message
identifying the ticket ID and the underlying error message.

---

### 9.1 — Missing Database Indexes

**Severity:** High · **Commit:** `b47b1da`

**Problem:** No explicit indexes existed beyond primary keys, despite columns
like `tenantId`, `status`, `ticketId`, and `userId` being used in `WHERE`/`JOIN`
on every request.

**Fix:** Added Drizzle `.index()` definitions for the following tables:

| Table | Indexed columns |
|-------|----------------|
| `users` | `tenantId` |
| `tickets` | `tenantId`, `status`, `priority`, `createdById`, `customerId` |
| `ticketAssignees` | `ticketId`, `userId` |
| `ticketWatchers` | `ticketId` |
| `comments` | `ticketId` |
| `kbArticles` | `tenantId`, `status`, `categoryId` |
| `notifications` | `userId`, `isRead` |
| `timeEntries` | `ticketId`, `userId` |
| `exchangeEmails` | `mailboxId`, `messageId` |

Run `npm run db:push` to create the indexes in the database.

---

### 9.2 — Missing Unique Constraint on `users.email`

**Severity:** Medium · **Commit:** `b47b1da`

**Problem:** Email is the login identifier but had no uniqueness constraint at
the database level — duplicate emails within a tenant were only prevented by
application logic.

**Fix:** Added `uniqueIndex("users_tenant_email_idx").on(table.tenantId, table.email)`
to the `users` table definition. Run `npm run db:push`.

---

### 9.3 — Missing Foreign Key on `tickets.customerId`

**Severity:** Medium · **Commit:** `b47b1da`

**Problem:** `tickets.customerId` was a plain `varchar` with no FK reference,
leaving orphaned tickets possible when a customer was deleted.

**Fix:** Changed to `.references(() => customers.id, { onDelete: "set null" })`.
On customer deletion, linked tickets have their `customerId` set to `null` rather
than becoming dangling references. Run `npm run db:push`.

---

### 11.3 — `vite.config.ts.*` Gitignore Pattern Ambiguity

**Severity:** Low · **Commit:** `6a2a914`

**Problem:** The pattern `vite.config.ts.*` could be misread as hiding the base
config file from code review.

**Fix:** Added a comment above the line clarifying that the wildcard suffix
only matches Vite's temporary timestamp files (e.g. `vite.config.ts.timestamp-*`)
and that `vite.config.ts` itself is committed and fully visible.

---

## Deferred Issues

The following issues from the code review require architectural decisions or
significant refactoring effort. They are logged here for future sprints.

| # | Issue | Reason deferred |
|---|-------|----------------|
| 1.3 | JWT in localStorage (XSS) | Requires migrating the entire auth flow to httpOnly cookies; affects every API call and the auth context. High risk, plan as a dedicated feature. |
| 2.4 | Exchange access tokens persisted to DB | Requires in-memory token management with TTL logic; impacts `exchange-service.ts` significantly. |
| 2.5 | Hard deletes of audit-critical data | Adding `deletedAt` soft-delete requires schema migration on `tickets` and `kbArticles` plus updating every list query. |
| 3.1 | N+1 in `getTicket()` — 10+ queries | Refactor to Drizzle relational API (`db.query.tickets.findFirst({ with: … })`). Large refactor with risk. |
| 3.2 | N+1 in `getTickets()` — queries in map | Requires batch `inArray()` queries and in-memory join. |
| 3.4 | N+1 in `getAssets()` | Same pattern as 3.2. |
| 3.7 | No pagination on list endpoints | Add `limit`/`offset` to `getUsers()`, `getContacts()`, `getOrganizations()`, `getKbCategories()`. |
| 5.1 | Tenant isolation check repeated 50+ times | Extract `assertTenantAccess()` helper; low risk but large diff. |
| 5.2 | Resource-not-found + tenant check repeated 40+ times | Extract `requireOwnedResource()` middleware factory. |
| 6.4 | No optimistic updates on mutations | Implement `onMutate`/`onError`/`onSettled` pattern for status change, comment add, assignee toggle. |
| 6.7 | Hardcoded German strings bypassing i18n | Establish a convention that all UI strings longer than 3 characters go through `i18n.ts`. |
| 7.1 | Icon-only buttons missing `aria-label` | Audit all icon-button usages across the app; many files affected. |
| 7.2 | Custom selectors missing keyboard navigation | Refactor asset/area selectors in `ticket-form.tsx` to use `<Select>` or `<Command>`. |
| 10.1 | No automated tests | Set up Vitest (unit/integration) and Playwright (E2E); large greenfield effort. |
| 11.2 | No ESLint configuration | Add `@typescript-eslint/recommended` + `eslint-plugin-react-hooks` + `no-console` scoped to server. |

---

## Summary Table

| # | File(s) | Category | Severity | Status |
|---|---------|----------|----------|--------|
| 1.3 | `client/src/lib/auth.tsx` | Security | **Critical** | Deferred |
| 1.6 | `server/routes.ts`, `storage.ts`, `schema.ts` | Security | **High** | **Fixed** |
| 2.4 | `server/exchange-service.ts` | Security | **High** | Deferred |
| 2.5 | `server/storage.ts` | Compliance | **High** | Deferred |
| 2.7 | `server/index.ts` | Security | **High** | **Fixed** |
| 2.9 | `client/src/App.tsx` | Stability | **Medium** | **Fixed** |
| 3.1 | `server/storage.ts` | Performance | **High** | Deferred |
| 3.2 | `server/storage.ts` | Performance | **High** | Deferred |
| 3.4 | `server/storage.ts` | Performance | **Medium** | Deferred |
| 3.5 | `server/routes.ts` | Performance | **Medium** | **Fixed** |
| 3.7 | `server/storage.ts` | Performance | **Medium** | Deferred |
| 4.1 | `server/routes.ts` | API Design | **Low** | **Fixed** |
| 4.2 | `server/routes.ts` | API Design | **Low** | **Fixed** |
| 5.1 | `server/routes.ts` | Maintainability | **Medium** | Deferred |
| 5.2 | `server/routes.ts` | Maintainability | **Medium** | Deferred |
| 6.3 | `client/src/pages/ticket-detail.tsx` | UX | **Low** | **Fixed** |
| 6.4 | Multiple pages | UX | **Medium** | Deferred |
| 6.5 | `client/src/pages/ticket-detail.tsx` | Performance | **Low** | **Fixed** |
| 6.7 | Multiple pages | Maintainability | **Low** | Deferred |
| 6.8 | `client/src/pages/ticket-detail.tsx` | UX | **Low** | **Fixed** |
| 7.1 | Multiple pages | Accessibility | **Medium** | Deferred |
| 7.2 | `client/src/pages/ticket-form.tsx` | Accessibility | **Medium** | Deferred |
| 8.1 | `server/storage.ts` | TypeScript | **Low** | **Fixed** |
| 8.3 | `server/storage.ts` | Error Handling | **Medium** | **Fixed** |
| 9.1 | `shared/schema.ts` | Performance | **High** | **Fixed** |
| 9.2 | `shared/schema.ts` | Data Integrity | **Medium** | **Fixed** |
| 9.3 | `shared/schema.ts` | Data Integrity | **Medium** | **Fixed** |
| 10.1 | Repository | Quality | **High** | Deferred |
| 11.2 | Repository | Quality | **Medium** | Deferred |
| 11.3 | `.gitignore` | Build | **Low** | **Fixed** |

**Fixed: 14 issues** across 12 commits.
**Deferred: 16 issues** (architectural / large scope).
