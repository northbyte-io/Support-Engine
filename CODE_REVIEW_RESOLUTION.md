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

### 2.4 — Access Tokens Stored in the Database

**Severity:** High · **Commit:** `5235c22`

**Problem:** Microsoft Graph access tokens were stored in the
`exchangeConfigurations` table (`access_token`, `access_token_expires_at`,
`refresh_token` columns). A database breach would expose all tenant Exchange
tokens.

**Fix:**
- Removed `accessToken`, `accessTokenExpiresAt`, and `refreshToken` columns
  from the `exchangeConfigurations` schema in `shared/schema.ts`.
- Added a `private static readonly tokenCache: Map<string, CachedToken>` to
  `ExchangeService`. `getAccessToken()` now checks this in-memory cache (with
  a 5-minute pre-expiry buffer) instead of the DB config object. On a cache
  miss the service fetches a fresh token from Azure AD and stores it only in
  memory — never in the database. On server restart, a fresh token is
  transparently requested on first use.
- Cleaned up `GET /api/exchange/configuration` response handler to no longer
  destructure the now-removed `accessToken`/`refreshToken` fields.
- Run `npm run db:push` to drop the three token columns from the database.

---

### 2.5 — Hard Deletes of Audit-Critical Data

**Severity:** High · **Commit:** `10343f9`

**Problem:** Tickets and knowledge-base articles were permanently deleted with no
soft-delete or audit trail, violating compliance and GDPR audit requirements.

**Fix:**
- Added `deletedAt: timestamp("deleted_at")` column to both `tickets` and `kbArticles` tables in `shared/schema.ts`.
- `deleteTicket()` and `deleteKbArticle()` in `server/storage.ts` now set `deletedAt = now()` instead of issuing a hard delete.
- `getTicket()`, `getTickets()`, `getKbArticle()`, and `getKbArticles()` all filter `WHERE deletedAt IS NULL` so soft-deleted records are invisible to normal queries.
- Added `hardDeleteTicket()` and `hardDeleteKbArticle()` methods for permanent removal (used only by admins).
- Added admin-only endpoints `DELETE /api/tickets/:id/hard` and `DELETE /api/kb/articles/:id/hard` in `server/routes.ts`.
- Run `npm run db:push` to add the new columns to the database.

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

### 3.1 — N+1 in `getTicket()` — 10+ Queries per Ticket

**Severity:** High · **Commit:** `5a86d67`

**Problem:** Every call to `getTicket()` fired individual `await` calls to the database
for ticket type, created-by user, assignees, watchers, comments, attachments, and areas —
up to 7+ parallel database round-trips for a single request.

**Fix:**
- Replaced the `Promise.all` of individual queries with a single `db.query.tickets.findFirst({ with: { ... } })` call using Drizzle's relational query API.
- `ticketType`, `createdBy`, `slaDefinition`, `assignees` (with user), `watchers` (with user), `comments` (with author + attachments), `attachments`, and `areas` (with area) are now batch-loaded in one call.
- Added `slaDefinition` relation to `ticketsRelations` in `shared/schema.ts`.
- Customer data (conditional on `customerId`) is still fetched separately, but now uses a single `Promise.all` for contacts and organization rather than three sequential awaits.
- Passwords are stripped from user objects in the mapping step.

---

### 3.2 — N+1 in `getTickets()` — Queries Inside a Loop

**Severity:** High · **Commit:** `9dc3e30`

**Problem:** For every ticket in the result list, `getTickets()` fired individual queries inside a `Promise.all` map for `ticketType`, `createdBy`, and `ticketAssignees` — ~100 parallel queries for a page of 50 tickets, saturating the connection pool.

**Fix:**
- Collect all unique `ticketTypeId`s, `createdById`s, and `ticketId`s from the result set.
- Issue **three** batch queries in parallel using `inArray()`: one for ticket types, one for users, one for assignees (with a LEFT JOIN on users).
- Build `Map` lookup tables and join in memory — O(1) per ticket.
- Reduced from `N×3` queries to `3` queries regardless of page size.

---

### 3.4 — N+1 in `getAssets()`

**Severity:** Medium · **Commit:** `5c58778`

**Problem:** `getAssets()` used a sequential `for` loop over every asset, firing individual `await` calls for category, assignedTo user, license details, and contract details — up to 400 queries for a list of 100 assets.

**Fix:**
- Collect all unique `categoryId`s, `assignedToId`s, and asset IDs filtered by type (software/license/contract).
- Issue **four** batch queries in parallel using `inArray()`: categories, users, licenses, contracts.
- Build `Map` lookup tables and join in memory — O(1) per asset.
- Reduced from up to `N×4` sequential queries to `4` queries regardless of list size.

---

### 3.7 — No Pagination on Several List Endpoints

**Severity:** Medium · **Commit:** `3e0c697`

**Problem:** `getUsers()`, `getKbCategories()`, `getContacts()`, and `getOrganizations()` had no `limit`/`offset`, returning all rows for a tenant as data accumulates.

**Fix:**
- Added optional `{ limit?: number; offset?: number }` to all four methods; default limit is `500`.
- Routes parse `?limit=` and `?offset=` query params and forward them to storage.
- As a bonus, also batch-fixed N+1 loops in `getOrganizations()` and `getContacts()`:
  - `getOrganizations()`: 3 `inArray()` batch queries for customers, contacts, and parent orgs instead of per-org sequential awaits; search moved into DB `WHERE ilike()`.
  - `getContacts()`: 3 `inArray()` batch queries for customers, orgs, and users instead of per-contact sequential awaits; search moved into DB `WHERE ilike()`.

---

### 5.1 — Tenant Isolation Check Repeated 50+ Times

**Severity:** Medium · **Commit:** `8605ac4`

**Problem:** The same 3-line tenant isolation pattern was copy-pasted ~50 times across `server/routes.ts` for every resource type.

**Fix:**
- Added `assertTenantAccess(resource, req, res)` helper at the top of `routes.ts` — returns `false` and sends `403` if `resource.tenantId !== req.tenantId`.
- Replaced 37 occurrences of the 3-line block with `if (!assertTenantAccess(x, req, res)) return;`.
- 3 non-standard checks left as-is: one combined null+tenant check and two notification checks that additionally verify `userId`.
- Fixed 7 call sites where TypeScript lost the `req.tenantId` narrowing after the refactor by adding `?? ""`.

---

### 5.2 — Resource-Not-Found + Tenant Check — 36 Repetitions

**Severity:** Medium · **Commit:** `cbc6d93`

**Problem:** Every guarded endpoint repeated the same 5-line boilerplate:
```typescript
const ticket = await storage.getTicket(req.params.id);
if (!ticket) {
  return res.status(404).json({ message: "Ticket nicht gefunden" });
}
if (!assertTenantAccess(ticket, req, res)) return;
```
This pattern appeared 36 times across `server/routes.ts`, once per resource type + endpoint, making routes harder to read and any change (e.g. a different 404 format) require 36 edits.

**Fix:**
- Added `requireOwnedResource<T>()` async helper directly below `assertTenantAccess` in `routes.ts`. It accepts a `fetcher` function, request, response, and a not-found message string; returns `T | undefined`.
- Replaced all 36 occurrences of the 5-line boilerplate with:
  ```typescript
  const ticket = await requireOwnedResource(
    () => storage.getTicket(req.params.id),
    req, res, "Ticket nicht gefunden"
  );
  if (!ticket) return;
  ```
- Handled two comment-style variants (`// Enforce tenant isolation` and `// Tenant isolation check`) and one portal-ticket route with an intervening blank line via a Perl multiline substitution + one manual edit.
- `assertTenantAccess` is now only called from inside `requireOwnedResource` — zero direct call sites remain in route handlers.

---

### 6.4 — No Optimistic Updates on Mutations

**Severity:** Medium · **Commit:** `c552fe4`

**Problem:** Every mutation (status change, comment add, drag-drop on board) followed a round-trip pattern: fire request → wait for server → invalidate cache → re-render. For a helpdesk tool used intensively, this adds perceptible latency to every interaction.

**Fix:** Implemented the Tanstack Query `onMutate`/`onError`/`onSettled` pattern for the three highest-traffic mutations:

1. **`updateStatusMutation`** (`ticket-detail.tsx`) — status updates the detail cache and flat list cache immediately in `onMutate`; rolls back both on error; invalidates all affected queries (including linked project boards) in `onSettled`.

2. **`addCommentMutation`** (`ticket-detail.tsx`) — appends an optimistic comment object (with current user as author, `id: "optimistic-<timestamp>"`) to the detail cache in `onMutate`, clearing the textarea instantly so the UI responds immediately; rolls back the full ticket snapshot on error; re-fetches in `onSettled` so the server-assigned ID replaces the optimistic one.

3. **`updateTicketStatusMutation`** (`project-board.tsx`) — moves the ticket entry between board columns immediately on drag-drop without waiting for the server; also updates the flat ticket list cache; rolls back both on error.

All three mutations: toast success in `onSuccess`, toast error + rollback in `onError`, invalidate queries in `onSettled`.

---

### 7.1 — Icon-Only Buttons Without `aria-label`

**Severity:** Medium · **Commit:** `6f4e05d`

**Problem:** Buttons containing only an icon and no visible text had no `aria-label`, making them invisible to screen readers. Approximately 50 such elements existed across pages and components.

**Fix:** Audited all `size="icon"` buttons and icon-only interactive elements across 17 pages and 5 components. Added `aria-label` in German to every element missing one:

- **Pages:** contacts, customer-detail, project-board, time-tracking, organizations, users, sla-settings, surveys, ticket-detail, assets, exchange-integration, customers, areas, projects, branding, knowledge-base, ticket-form
- **Components:** `TimerDisplay`, `TicketTimerControl`, `TipTapEditor` (the `ToolbarButton` helper now forwards its `tooltip` prop as `aria-label` to the inner `<Button>`), `NotificationDropdown`, `WorkEntriesList`

Existing accessible patterns (`ThemeToggle` with `<span className="sr-only">`, assets close button with `sr-only` text) were left as-is — they are already correct.

---

### 6.7 — Inconsistent i18n — Hardcoded German Strings

**Severity:** Low · **Commit:** `c2f6e20`

**Problem:** `i18n.ts` defined a full translation object and `t()` helper but was never imported anywhere in the codebase. Loading states, error toasts, and other user-facing strings were hardcoded directly in JSX.

**Fix:**
- Added a `loading` section to `i18n.ts` with domain-specific keys (`generic`, `articles`, `timeEntries`, `logs`, `folders`).
- Added `tickets.downloadFailed` and `tickets.downloadFailedDescription` for the download error toast.
- Imported `t` and migrated hardcoded strings in 6 files:
  - `App.tsx`: 4× `LoadingPage message="Wird geladen..."` → `t("loading.generic")`
  - `ticket-detail.tsx`: download failure toast → `t("tickets.downloadFailed")` / `t("tickets.downloadFailedDescription")`
  - `knowledge-base.tsx`: `"Artikel werden geladen..."` → `t("loading.articles")`
  - `time-tracking.tsx`: `"Zeiteinträge werden geladen..."` → `t("loading.timeEntries")`
  - `logs.tsx`: `"Logs werden geladen..."` → `t("loading.logs")`
  - `exchange-integration.tsx`: `"Ordner werden geladen..."` → `t("loading.folders")`

Establishes the convention: all user-facing strings longer than 3 characters go through `t()` rather than being hardcoded in JSX.

---

### 7.2 — Custom Selection Components Missing Keyboard Navigation

**Severity:** Medium · **Commit:** `f1315bf`

**Problem:** The asset, area, and assignee button-grid selectors in `ticket-form.tsx` lacked accessible state communication. Screen reader users had no way to know which items were selected, and the containers had no group semantics.

**Fix:** The selectors already used `<Button type="button">` (native `<button>` elements), so Tab navigation and Enter/Space activation already worked. The two missing pieces were:

- `aria-pressed={isSelected}` on every toggle button — announces selected/unselected state to screen readers (correct ARIA toggle-button pattern).
- `role="group"` + `aria-label` on each container div — announces the group context: `"Assets auswählen"`, `"Bereiche auswählen"`, `"Bearbeiter auswählen"`.

Applied to all three selectors (assets, areas, assignees).

---

### 10.1 — No Automated Tests

**Severity:** High · **Commit:** `dd82964`

**Problem:** The repository had zero test files — no Jest, Vitest, or Playwright configuration. TypeScript strict mode and Zod schemas provided compile-time/runtime validation but there was no behavioral test coverage of any kind.

**Fix:** Added Vitest (compatible with the existing TypeScript/ES module `"type": "module"` setup):

- **`vitest.config.ts`** — node environment, `@shared/*` and `@/*` path aliases matching `tsconfig.json`.
- **`tests/setup.ts`** — global setup file that sets `SESSION_SECRET` before any module is imported (required by the top-level guard in `server/auth.ts`).
- **`"test": "vitest run"`** added to `package.json` scripts.

Three unit test files covering the highest-value targets from the review:

| File | Tests | Coverage |
|------|-------|----------|
| `tests/auth.test.ts` | 18 | `generateToken`/`verifyToken` round-trip; invalid/manipulated token → null; `hashPassword`/`comparePassword` round-trip + wrong password + salt randomness; `authMiddleware` 401 (no cookie, invalid token) + happy path; `adminMiddleware` 403/pass-through; `agentMiddleware` 403/pass-through |
| `tests/keyVault.test.ts` | 13 | `encryptSecret`/`decryptSecret` round-trip; output shape; random IV per call; empty string and Unicode; `encryptSecretToJson`/`decryptSecretFromJson` JSON round-trip; `isEncryptedJson` (5 cases); `getOrDecrypt` (null/undefined/empty, decrypt JSON, plaintext pass-through) |
| `tests/logger.test.ts` | 13 | PII masking for password, JWT token, Bearer token, API key, secret, email; plain text preserved; title masking; `getLogs` level filter, search filter, limit parameter, total count |

**44 tests pass.** Run with `npm test`.

---

### 11.2 — No ESLint Configuration

**Severity:** Medium · **Commit:** `5f789bb`

**Problem:** The project had no `.eslintrc` or `eslint.config.*` file. Code quality rules (`no-console`, `no-explicit-any`, `exhaustive-deps` for hooks) were not enforced automatically, allowing regressions to accumulate silently.

**Fix:** Added `eslint.config.js` (ESLint v9 flat config format, compatible with `"type": "module"`):

- **`@typescript-eslint/recommended`** — TypeScript-aware rules including `no-explicit-any`, `no-unused-vars`, `no-require-imports` across all TS/TSX files.
- **`eslint-plugin-react-hooks`** — `rules-of-hooks` + `exhaustive-deps` + `set-state-in-effect` scoped to `client/src/**` only.
- **`no-console: "error"`** scoped to `server/**` — enforces use of `server/logger.ts` (Winston) instead of raw console output.
- **`_` prefix allowed** for intentionally unused vars/args/destructured elements (standard TypeScript convention).
- **Ignored:** `dist/`, `node_modules/`, `migrations/`, `client/src/components/ui/` (shadcn/ui).
- **`"lint": "eslint ."`** added to `package.json` scripts.

All 100 pre-existing violations fixed to reach 0 errors:

| Category | Count | Files |
|----------|-------|-------|
| `no-explicit-any` | ~60 | `exchange-integration.tsx` (local interfaces), `tls-service.ts`, `routes.ts`, `storage.ts`, `index.ts`, `exchange-service.ts` |
| `no-unused-vars` | ~20 | `routes.ts` (destructured `tenantId`/`id` → `_`), `exchange-service.ts`, `use-toast.ts`, `storage.ts` |
| `no-console` | 2 | `server/index.ts`, `server/routes.ts` → `logger.info(...)` |
| `no-require-imports` | 2 | `tailwind.config.ts` → ESM `import` |
| `set-state-in-effect` | 2 | `TicketTimerControl.tsx`, `branding.tsx` (disable-next-line — intentional sync) |

**Result:** `npm run lint` → 0 errors, 8 warnings (all `react-hooks/incompatible-library` on `form.watch()` — expected, non-actionable React Compiler advisory about React Hook Form's watch API).

---

### 1.3 — JWT Stored in localStorage (XSS Risk)

**Severity:** Critical · **Commit:** `e0e7168`

**Problem:** Two pages (`time-tracking.tsx`, `logs.tsx`) stored the JWT in `localStorage` and sent it as an `Authorization: Bearer` header, making the token accessible to any JavaScript running on the page (XSS vector). The rest of the codebase had already been migrated to httpOnly cookies, but these pages were missed.

**Investigation:** `server/auth.ts`'s `authMiddleware` reads exclusively from the `Cookie` header — it has no `Authorization: Bearer` fallback. This meant the localStorage-based fetches in these two files would silently return 401 for any user who had no token in localStorage (e.g. after a browser restart), while also being XSS-exploitable for users who did.

`client/src/lib/auth.tsx`, `server/routes.ts` (login/register/logout/me), and `client/src/lib/queryClient.ts` were already fully cookie-based. Only these two pages had regressed to the old pattern.

**Fix:**
- `client/src/pages/time-tracking.tsx`: removed `Authorization: Bearer ${localStorage.getItem("token")}` header from both `/api/time-entries` and `/api/time-entries/summary` custom `queryFn`s; replaced with `credentials: "include"`.
- `client/src/pages/logs.tsx`: removed `localStorage.getItem("token")` + conditional `Authorization` header from the `/api/logs` query, `/api/logs/export` fetch, and `/api/logs/test` fetch; replaced all with `credentials: "include"`.

No JWT is stored in `localStorage` or `sessionStorage` anywhere in the client. The entire auth surface uses `credentials: "include"` with the httpOnly cookie set by `res.cookie(TOKEN_COOKIE_NAME, token, TOKEN_COOKIE_OPTIONS)` on login.

---

## Deferred Issues

All issues from the original code review have been resolved. No issues remain deferred.

---

## Summary Table

| # | File(s) | Category | Severity | Status |
|---|---------|----------|----------|--------|
| 1.3 | `time-tracking.tsx`, `logs.tsx` | Security | **Critical** | **Fixed** |
| 1.6 | `server/routes.ts`, `storage.ts`, `schema.ts` | Security | **High** | **Fixed** |
| 2.4 | `server/exchange-service.ts`, `shared/schema.ts` | Security | **High** | **Fixed** |
| 2.5 | `server/storage.ts`, `shared/schema.ts`, `server/routes.ts` | Compliance | **High** | **Fixed** |
| 2.7 | `server/index.ts` | Security | **High** | **Fixed** |
| 2.9 | `client/src/App.tsx` | Stability | **Medium** | **Fixed** |
| 3.1 | `server/storage.ts`, `shared/schema.ts` | Performance | **High** | **Fixed** |
| 3.2 | `server/storage.ts` | Performance | **High** | **Fixed** |
| 3.4 | `server/storage.ts` | Performance | **Medium** | **Fixed** |
| 3.5 | `server/routes.ts` | Performance | **Medium** | **Fixed** |
| 3.7 | `server/storage.ts`, `server/routes.ts` | Performance | **Medium** | **Fixed** |
| 4.1 | `server/routes.ts` | API Design | **Low** | **Fixed** |
| 4.2 | `server/routes.ts` | API Design | **Low** | **Fixed** |
| 5.1 | `server/routes.ts` | Maintainability | **Medium** | **Fixed** |
| 5.2 | `server/routes.ts` | Maintainability | **Medium** | **Fixed** |
| 6.3 | `client/src/pages/ticket-detail.tsx` | UX | **Low** | **Fixed** |
| 6.4 | `ticket-detail.tsx`, `project-board.tsx` | UX | **Medium** | **Fixed** |
| 6.5 | `client/src/pages/ticket-detail.tsx` | Performance | **Low** | **Fixed** |
| 6.7 | Multiple pages | Maintainability | **Low** | **Fixed** |
| 6.8 | `client/src/pages/ticket-detail.tsx` | UX | **Low** | **Fixed** |
| 7.1 | Multiple pages + components | Accessibility | **Medium** | **Fixed** |
| 7.2 | `client/src/pages/ticket-form.tsx` | Accessibility | **Medium** | **Fixed** |
| 8.1 | `server/storage.ts` | TypeScript | **Low** | **Fixed** |
| 8.3 | `server/storage.ts` | Error Handling | **Medium** | **Fixed** |
| 9.1 | `shared/schema.ts` | Performance | **High** | **Fixed** |
| 9.2 | `shared/schema.ts` | Data Integrity | **Medium** | **Fixed** |
| 9.3 | `shared/schema.ts` | Data Integrity | **Medium** | **Fixed** |
| 10.1 | Repository | Quality | **High** | **Fixed** |
| 11.2 | Repository | Quality | **Medium** | **Fixed** |
| 11.3 | `.gitignore` | Build | **Low** | **Fixed** |

**Fixed: 29 issues** across 28 commits.
**Deferred: 0 issues — all issues resolved.**
