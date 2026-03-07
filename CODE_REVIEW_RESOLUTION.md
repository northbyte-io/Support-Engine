# Code Review Resolution — Support-Engine

> Resolved: 2026-03-07
> Based on: CODE_REVIEW.md (generated 2026-03-01)
> Each fix has its own git commit with a descriptive message.

---

## Table of Contents

1. [Fixes Applied](#fixes-applied)
2. [Issues Partially Addressed (Notes)](#issues-partially-addressed-notes)
3. [Issues Not Fixed in This Pass](#issues-not-fixed-in-this-pass)

---

## Fixes Applied

### 1.1 — Hardcoded JWT Secret Fallback
**File:** `server/auth.ts`
**Severity:** Critical Security

**Problem:** `JWT_SECRET` fell back to the literal string `"your-secret-key-change-in-production"` when `SESSION_SECRET` was not set, making all tokens forgeable in any deployment that forgot the env var.

**Resolution:** The fallback was removed. The process now throws `Error("SESSION_SECRET environment variable is required")` at startup if the variable is missing, preventing the server from ever running insecurely.

---

### 1.2 — Demo Credentials Created Unconditionally at Startup
**File:** `server/routes.ts` — `seedDefaultData()`
**Severity:** Critical Security

**Problem:** `seedDefaultData()` ran on every server start in any environment, creating accounts with known passwords (`admin123`, `agent123`, `kunde123`) in any deployment that had an empty database.

**Resolution:** An early return guard `if (process.env.NODE_ENV !== "development") return;` was added as the first statement of `seedDefaultData()`. Demo accounts are now only seeded in local development.

---

### 1.4 / 5.3 — Duplicate Encryption Implementation with Weak Key Derivation
**Files:** `server/exchange-service.ts`, `server/keyVault.ts`
**Severity:** Critical Security / High Maintainability

**Problem:** `exchange-service.ts` contained its own independent AES-256-GCM implementation with two severe weaknesses:
1. The key derivation fell back to the literal string `"default-key"` when `SESSION_SECRET` was absent.
2. The salt was the literal string `"salt"` — entirely static and predictable, providing no hardening.

This also meant that any secret encrypted by one implementation could not be decrypted by the other.

**Resolution:** The duplicate `encryptSecret()` and `decryptSecret()` static methods in `ExchangeService` now delegate directly to `encryptSecretToJson()` / `decryptSecretFromJson()` from `keyVault.ts`. The `crypto` import was removed from `exchange-service.ts` entirely.

> **Migration note:** Existing Exchange configurations stored with the old format (hex-encoded `iv:authTag:ciphertext`) cannot be decrypted by the new implementation. Administrators must re-save their Exchange configuration after this update to re-encrypt their secrets with `keyVault.ts`.

---

### 1.5 — Content-Disposition Header Injection
**File:** `server/routes.ts:650`
**Severity:** High Security

**Problem:** `attachment.fileName` was interpolated directly into the `Content-Disposition` header without sanitization. A filename containing `"` or newline characters could inject additional HTTP headers or break out of the header value.

**Resolution:** The filename is sanitized before being used in the header: all `"`, `\r`, and `\n` characters are replaced with `_`. The safe filename is then interpolated.

---

### 1.6 — Missing Tenant Isolation on TLS Certificate Deletion
**File:** `server/routes.ts:3303`
**Severity:** High Security

**Status:** ⚠️ **Not fixed — schema limitation.**
The `tlsCertificates` table does not have a `tenantId` column, so per-tenant ownership cannot be verified at the application layer without a schema migration. The recommended fix (fetch → compare `tenantId` → delete) requires adding `tenantId` to the schema first (`shared/schema.ts`) and running `npm run db:push`.

The endpoint remains restricted to `adminMiddleware`, which is the best available guard without the schema change.

---

### 1.7 — Error Handler Re-throws After Response Sent
**File:** `server/index.ts`
**Severity:** High Stability

**Problem:** The global error handler called `throw err` after `res.json()` had already committed the response. This caused an unhandled promise rejection and could trigger Express to attempt writing a second response to a finished socket, cascading into further errors.

**Resolution:** The `throw err` was removed. The error is now logged with `logger.error()` so it is still recorded and visible in the admin log UI, without any risk of interfering with the completed response.

---

### 2.2 — Unsafe `parseInt` on Query Parameters
**File:** `server/routes.ts` (6 locations)
**Severity:** High

**Problem:** All six `parseInt()` calls on `req.query` fields omitted the radix argument (allowing hex literals like `0xFF` to parse unexpectedly) and applied no upper bound, letting callers request arbitrarily large pages and exhaust memory.

**Resolution:**
- All calls now use radix `10` explicitly.
- `limit` parameters are capped at `1000` via `Math.min()`.
- `offset` parameters are clamped to `≥ 0`.
- When a non-numeric string is provided, a safe default is used (`isNaN` guard).

---

### 2.3 — Cascading Ticket Deletes Without Transaction
**File:** `server/storage.ts` — `deleteTicket()`
**Severity:** High Data Integrity

**Problem:** `deleteTicket()` executed 11 sequential `DELETE` statements with no database transaction. Any failure midway (network hiccup, DB constraint, timeout) left the database in a partially-deleted, inconsistent state.

**Resolution:** All 11 delete statements are now wrapped in a single `db.transaction(async (tx) => { ... })` call. Either all deletions succeed, or none do and the database remains consistent.

---

### 2.6 — `console.error` Mixed with Structured Logger
**File:** `server/routes.ts` (156 occurrences)
**Severity:** High Observability / Security

**Problem:** Approximately half the catch blocks in `routes.ts` used `console.error()` instead of `logger.error()`. Raw console output bypasses PII masking, log-level filtering, and the in-memory buffer used by the admin log UI.

**Resolution:** All 156 `console.error()` calls were converted to `logger.error("api", ...)` with a structured `{ description, cause, solution }` object. The conversion was applied uniformly — handlers that already used the richer structured format were left unchanged.

---

### 2.8 — Incomplete PII Masking Patterns
**File:** `server/logger.ts`
**Severity:** Medium Security

**Problem:** The `maskSensitiveData()` method only covered the exact field names `password`, `token`, `secret`, and `api_key`. Common aliases (`passwd`, `pwd`, `pass`, `credential`, `private_key`, `privateKey`) and raw Bearer JWT values in log strings were not masked.

**Resolution:** The following additional masking patterns were added:
- Password aliases: `passwd`, `pwd`, `pass`
- Credential aliases: `credential`, `private_key`, `privateKey`
- Raw Bearer token values matching `Bearer <base64url>`

---

### 3.3 — N+1 Query in `getSurveyResultsSummary()`
**File:** `server/storage.ts`
**Severity:** Medium Performance

**Problem:** A `for...of` loop issued one `SELECT` against `surveyResponses` per completed invitation. With many completed invitations this produced one DB round-trip per invitation.

**Resolution:** The loop was replaced with a single batched query using `inArray(surveyResponses.invitationId, completedInvitationIds)`, fetching all responses in one database call.

---

### 3.6 — `staleTime: Infinity` on All Queries
**File:** `client/src/lib/queryClient.ts`
**Severity:** Medium UX

**Problem:** The global `staleTime: Infinity` setting meant all cached data was considered fresh indefinitely. Agents could navigate away and back and still see stale ticket statuses, comment threads, or assignment changes with no automatic refresh.

**Resolution:** The default `staleTime` was changed to `60 * 1000` (60 seconds). Individual queries that require fresher or less frequent data (e.g., ticket details at 30 s, tenant configuration at 5 min) can override this via their own `staleTime` option.

---

### 4.3 — Unvalidated Date Strings Passed to `new Date()`
**File:** `server/routes.ts` (3 locations in time-entry handlers)
**Severity:** Medium

**Problem:** `new Date(req.body.date)` was called without any validation. An invalid string such as `"not-a-date"` silently produces an `Invalid Date` object, which Drizzle then persists to PostgreSQL as `NULL` or raises a cryptic database error.

**Resolution:** Each occurrence was replaced with `z.coerce.date().parse(req.body.date)`. An invalid value throws a `ZodError`, which the existing `catch` block already converts to a `400 Bad Request` with a descriptive error message.

---

### 6.1 — DOMPurify Allowlist Too Permissive
**File:** `client/src/pages/ticket-detail.tsx`
**Severity:** Medium Security

**Problem:** The DOMPurify configuration for ticket descriptions allowed the `style` and `class` attributes and the `img` tag:
- `style` enables CSS-based data exfiltration (e.g., `background-image: url(https://attacker.com/...)`)
- `class` can interact with Tailwind/app CSS to cause UI redressing
- `img` with an arbitrary `src` allows user-IP tracking and credential probing via HTTP requests to attacker-controlled servers

**Resolution:**
- `style` and `class` were removed from `ALLOWED_ATTR`.
- `img`, `div`, `font`, and `center` were removed from `ALLOWED_TAGS`.
- The allow-lists now contain only semantic, non-presentational elements and attributes.

---

### 6.2 — Token Read Directly from `localStorage` in Page Components
**Files:** `client/src/pages/ticket-detail.tsx`, `client/src/pages/knowledge-base.tsx`
**Severity:** Low Maintainability

**Problem:** Two page components bypassed the centralized `apiRequest()` helper and reached into `localStorage` directly to construct `Authorization` headers, scattering token access logic across the codebase.

**Resolution:** Both direct `fetch()` calls with manual `Authorization` headers were replaced with `apiRequest("GET", url)`, which handles token injection centrally and consistently.

---

### 6.6 — `form.watch()` Calls Inside `.map()` Loops
**File:** `client/src/pages/ticket-form.tsx`
**Severity:** Low Performance

**Problem:** Three `.map()` callbacks (assets, areas, assignees) each called `form.watch("fieldName")` inline. Every call creates a new React Hook Form subscription and triggers a re-render of the parent component for every item in the list on every form change event, multiplying unnecessary re-renders.

**Resolution:** The three `form.watch()` calls were moved to the top of the component (alongside the existing `form.watch("customerId")` call) and stored in variables. The map callbacks reference these variables via closure instead of calling `form.watch()` themselves.

---

### 8.2 — `any` Type on Exchange Configuration Object
**File:** `server/routes.ts` — `POST /api/exchange/configuration`
**Severity:** Low TypeScript

**Problem:** `configData` was typed as `any`, defeating TypeScript's ability to detect shape mismatches if the `exchangeConfigurations` schema changes.

**Resolution:** `InsertExchangeConfiguration` is now imported from `@shared/schema`. `configData` is typed as `Partial<InsertExchangeConfiguration>`, so any future schema change surfaces as a compile-time error in the route handler.

---

### 11.1 — No Maximum Length on Generated Slugs
**File:** `server/routes.ts` — `generateSlug()`
**Severity:** Low Validation

**Problem:** `generateSlug()` processed the full user-supplied title with no output length cap. A very long title would produce a slug of the same length, potentially exceeding database column constraints or breaking URL handling.

**Resolution:** `.slice(0, 100)` was appended to the slug generation chain, capping all generated slugs at 100 characters — a common convention for slug columns.

---

## Issues Partially Addressed (Notes)

| Issue | Status | Reason |
|-------|--------|--------|
| 1.6 Missing tenant isolation on TLS cert delete | ⚠️ Schema change needed | `tlsCertificates` has no `tenantId` column; adding it requires a migration |
| 1.4 Raise PBKDF2 iterations in `keyVault.ts` to ≥310,000 | ⚠️ Migration concern | Increasing iterations changes the derived key, making all existing encrypted secrets unreadable; requires a re-encryption migration strategy |

---

## Issues Not Fixed in This Pass

These issues require larger architectural changes, new dependencies, or schema migrations that go beyond contained fixes:

| Issue | Reason not fixed |
|-------|-----------------|
| 1.3 JWT in `localStorage` (XSS risk) | Requires moving to httpOnly cookies — affects all auth flows, client fetch calls, and server session handling |
| 2.4 Access tokens persisted to database | Requires in-memory token store with expiry management |
| 2.5 Hard deletes of audit-critical data | Requires adding `deletedAt` columns to schema + migration + filtering all list queries |
| 2.7 No rate limiting on endpoints | Requires installing and configuring `express-rate-limit` |
| 2.9 No React Error Boundaries | Requires creating a reusable `ErrorBoundary` component and wrapping all routes |
| 3.1 N+1 in `getTicket()` | Large refactor to Drizzle relational API; risk of regression in 156-endpoint surface |
| 3.2 N+1 in `getTickets()` | Same as above |
| 3.4 N+1 in `getAssets()` | Same — requires batch-load with `inArray` and in-memory join |
| 3.5 N+1 in ticket assignee creation | Requires new bulk-insert storage method |
| 3.7 Missing pagination on list methods | Requires storage method signature changes + route updates for many endpoints |
| 4.1 Inconsistent DELETE response codes | Large audit of all DELETE endpoints |
| 4.2 POST endpoints returning 200 not 201 | Large audit of all POST creation endpoints |
| 5.1 Tenant isolation check repeated 50+ times | Requires refactoring ~50 route handlers |
| 5.2 Resource-not-found + tenant check repeated 40+ times | Same |
| 6.3 No loading state during file download | UI enhancement |
| 6.4 No optimistic updates on mutations | Requires per-mutation `onMutate`/`onError`/`onSettled` implementation |
| 6.5 Inline async functions causing re-renders | Requires `useCallback` wrapping across multiple handlers |
| 6.7 Hardcoded German strings bypassing i18n | Large string audit across all page components |
| 6.8 `window.confirm()` for destructive actions | Requires `<AlertDialog>` integration per destructive action |
| 7.1 Icon-only buttons missing `aria-label` | Large audit across all pages |
| 7.2 Custom selectors missing keyboard navigation | Requires ARIA role additions and keyboard handler implementation |
| 8.1 `as any` in storage layer | Requires type-safe destructuring at each of 8+ locations |
| 8.3 `Promise.all` without try-catch context | Requires structured error handling at each parallel fetch |
| 9.1 Missing database indexes | Requires schema changes + `npm run db:push` |
| 9.2 Missing unique constraint on `users.email` | Requires schema change + migration |
| 9.3 Missing foreign key constraints | Requires schema changes + migration |
| 10.1 No automated tests | Requires Vitest/Playwright setup and test authoring |
| 11.2 No ESLint configuration | Requires ESLint setup with `@typescript-eslint/recommended` |
