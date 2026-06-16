# Issue Registry
_Last updated: 2026-06-16 (merged fable_issues.md as ISSUE-051..068)_

## Summary
- Total Issues: 68
- Open: 0 | In Progress: 0 | Fixed (Pending Verification): 0 | Resolved: 68 | Partially Resolved: 0 | Blocked: 0 | Wont Fix: 0

<!-- Merged from fable_issues.md on 2026-06-16 (FABLE-001..018 → ISSUE-051..068).
     Non-blocking follow-ups (not open defects):
     - Human review of English legal texts before legal reliance (ISSUE-061)
     - Delete seed reviews + seed customers once organic reviews exist (ISSUE-053/060; ARCHITECTURE_NOTES §3)
     - Check Fable DB migrations into database/migrations/ — several applied directly to Supabase
       (ISSUE-053, 063, 065, 066, 068); 015_create_return_with_items_rpc.sql drifts from production (ISSUE-067)
     - Re-run Supabase security advisor when convenient (ISSUE-063, 065, 066) -->

<!-- QA verification pass completed 2026-05-18 by issue-verifier.
     All 24 issues verified by code inspection.
     TypeScript compile check (src/ only): PASSED — zero errors.
     Only errors found were in sveltekit/ (untracked, out-of-scope directory). -->

---

## Issues

### [ISSUE-001] Cron endpoint accepts unauthenticated requests when CRON_SECRET is unset
- **Status:** Resolved
- **Severity:** Critical
- **Category:** Security
- **File:** `src/app/api/cron/send-abandoned-cart-reminders/route.ts` (line 23)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
The abandoned-cart cron route guards itself with `if (cronSecret && authHeader !== ...)`. When `CRON_SECRET` is missing from the environment, `cronSecret` is falsy and the conjunction short-circuits — the check is skipped entirely and the endpoint becomes publicly callable. An attacker can repeatedly hit this URL to send abandoned-cart emails to arbitrary users (email-flood / reputation-damage vector) and trigger paid Resend API calls. Compare against `src/app/api/cron/cleanup-reservations/route.ts` (line 26) which fails closed using `if (!cronSecret || authHeader !== ...)`.

**Relevant Code:**
```ts
const cronSecret = process.env.CRON_SECRET;
const authHeader = request.headers.get('authorization');

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
```

**Suggested Solution:**
Fail closed: replace the guard with `if (!cronSecret || authHeader !== \`Bearer ${cronSecret}\`)` so a missing secret returns 401 instead of bypassing auth. Mirror the pattern used in `cleanup-reservations/route.ts`. Also log a `console.error` when `cronSecret` is missing so the misconfiguration is visible in Vercel logs.

**Resolution Notes:**
Changed `if (cronSecret && authHeader !== ...)` to `if (!cronSecret || authHeader !== ...)` in `src/app/api/cron/send-abandoned-cart-reminders/route.ts`. Added a `console.error` log when `cronSecret` is unset so the misconfiguration is visible in Vercel logs. Now mirrors the pattern from `cleanup-reservations/route.ts`.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/cron/send-abandoned-cart-reminders/route.ts` lines 23-29 (`!cronSecret` guard + 401). Tests: `npx jest __tests__/api/cron-abandoned-cart-reminders.test.ts` — 16/16 passed, including `should reject request when CRON_SECRET is unset (fail-closed)`.
- **Details:** Fail-closed auth confirmed in source. Missing `CRON_SECRET` returns 401, logs `console.error`, and never reaches cart/email logic.
- **Remaining Concerns:** None

---

### [ISSUE-002] Authentication reads `password_hash` via RLS-restricted client
- **Status:** Resolved
- **Severity:** Critical
- **Category:** Integration
- **File:** `src/repositories/customers/CustomerRepository.ts` (lines 277-296, 308-342)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
`CustomerRepository.verifyPassword`, `changePassword`, `createWithPassword`, and the password-reset flow in `AuthService` all query the `customers` table through the client-side `supabase` instance (imported from `@/lib/supabase`, configured with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). That client is subject to Row Level Security. If RLS is enabled on `customers` — which is standard for a table holding `password_hash` — these queries silently return zero rows in production and `bcrypt.compare(password, data.password_hash)` will throw or yield "Invalid email or password" for every user. Either authentication is currently broken or `password_hash` is exposed to the publishable key (also bad). Note `src/lib/auth.ts` line 42 already uses `getSupabaseServer()` for the `is_admin` lookup specifically because of this — the same fix needs to be applied to password verification.

**Relevant Code:**
```ts
// CustomerRepository.verifyPassword
const { data, error } = await supabase
  .from(this.tableName)
  .select('*')
  .eq('email', email.toLowerCase())
  .single();
// ...
const isValidPassword = await bcrypt.compare(password, data.password_hash);
```

**Suggested Solution:**
Inject the server-side Supabase client (`SupabaseServerClient` token) into `CustomerRepository` and use it for all password-related operations (`verifyPassword`, `changePassword`, `createWithPassword`, `findByEmail` when called from auth). Refactor `CustomerRepository` to extend `BaseRepository` and accept the supabase client via constructor (matching the pattern in `OrderRepository`, but injecting the server client). Then register `CustomerRepository` in DI with the server client. Verify by inspecting Supabase RLS policies on `customers` to confirm `password_hash` is not exposed to the anon key.

**Resolution Notes:**
Changed `CustomerRepository` import from `supabase` (anon/publishable key) to `getSupabaseServer()` (service role key) across all methods — `findById`, `findByEmail`, `create`, `update`, `delete`, `createWithPassword`, `changePassword`, `verifyPassword`. Removed all `[issue-tracker]` diagnostic logs from the repository. Applied Supabase migration `enable_rls_on_customers` to enable RLS on the `customers` table with no permissive policies for anon/authenticated roles — all legitimate access now goes through the service role which bypasses RLS by default. `password_hash` is no longer readable via the publishable key.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/repositories/customers/CustomerRepository.ts` line 3 imports `getSupabaseServer`; all DB methods call it (e.g. `verifyPassword`, `createWithPassword`). No `@/lib/supabase` import. Tests: `npx jest __tests__/repositories/CustomerRepository.test.ts` — 21/21 passed.
- **Details:** Service-role client used for every customer DB operation including `password_hash` reads/writes. Anon publishable-key client absent from repository.
- **Remaining Concerns:** None

---

### [ISSUE-003] Build-time `container.resolve` returns null services, masking real DI failures at runtime
- **Status:** Resolved
- **Severity:** High
- **Category:** Integration
- **File:** `src/config/di-container.ts` (lines 199-210)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
A wrapper installed on `container.resolve` catches every `tsyringe` resolution error and returns `null as T` (commit 54bcfe8). Route files all call `container.resolve(...)` at module top level (e.g. `const orderService = container.resolve<IOrderService>(TOKENS.IOrderService)` in `src/app/api/orders/route.ts:9`). If DI initialization fails at *runtime* for any reason (missing env var on a serverless cold-start, registration bug, race with `initializeDI()`), `orderService` silently becomes `null`. The first request then crashes with `TypeError: Cannot read properties of null (reading 'createOrder')` and the user sees a 500 with no diagnostic context. The intent was to avoid build-time crashes only, but the wrapper has no way to distinguish build vs. runtime.

**Relevant Code:**
```ts
const _resolve = container.resolve.bind(container);
(container as any).resolve = function <T>(token: any): T {
  try {
    return _resolve<T>(token);
  } catch {
    return null as T;
  }
};
```

**Suggested Solution:**
Gate the swallowing on build-time only — e.g. check `if (process.env.NEXT_PHASE === 'phase-production-build')` before swallowing, or only swallow when `SUPABASE_SECRET_KEY` is absent. At runtime, log the failure with `console.error('[DI] resolve failed for', token, err)` and rethrow so the route handler's `try/catch` produces a real 500 with a stack trace. Alternatively, eliminate module-level resolution by moving `container.resolve(...)` calls inside each handler — the resolver is cheap and this removes the build-time problem entirely.

**Resolution Notes:**
Updated the `resolve` wrapper in `src/config/di-container.ts` to compute `IS_BUILD_TIME` from `process.env.NEXT_PHASE === 'phase-production-build' || !process.env.SUPABASE_SECRET_KEY`. When `IS_BUILD_TIME` is true, errors are silently swallowed (preserving existing build-time behavior). When false (runtime), errors are logged with `console.error` and rethrown, producing a real stack trace in logs. Also removed verbose `[issue-tracker]` diagnostic console calls from orders/route.ts.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/config/di-container.ts` lines 207-220 (`IS_BUILD_TIME` gate, runtime `console.error` + rethrow). Tests: `npx jest __tests__/config/di-container.test.ts` — 2/2 passed.
- **Details:** Runtime DI failures are no longer silently swallowed; build-time null fallback preserved when `NEXT_PHASE` is production-build or `SUPABASE_SECRET_KEY` absent.
- **Remaining Concerns:** None

---

### [ISSUE-004] DI container initialization is skipped in non-production unless env var present
- **Status:** Resolved
- **Severity:** High
- **Category:** Logic Bug
- **File:** `src/config/di-init.ts` (lines 12-35)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
`initializeDI()` runs `configureDependencyInjection()` only inside two branches keyed off `NODE_ENV`. The auto-init at the bottom (`if (process.env.SUPABASE_SECRET_KEY) initializeDI()`) is the only thing that fires on import. But the function body itself also gates on `NODE_ENV !== 'production'` for the dev branch and `=== 'production'` for the prod branch. In `NODE_ENV === 'test'` (Jest) or any custom value, both branches are false and the container is never configured — every test that touches DI would silently get null services from ISSUE-003. The dev branch also swallows errors with only a `console.error`, which means a broken registration in dev fails silently after the first request.

**Relevant Code:**
```ts
if (typeof window === 'undefined' && !isConfigured && process.env.NODE_ENV !== 'production') {
  try { configureDependencyInjection(); isConfigured = true; }
  catch (error) { console.error('Failed to configure DI container:', error); }
} else if (typeof window === 'undefined' && !isConfigured && process.env.NODE_ENV === 'production') {
  try { configureDependencyInjection(); isConfigured = true; console.log('DI container initialized successfully'); }
  catch (error) { console.error('DI container initialization FAILED:', error); throw error; }
}
```

**Suggested Solution:**
Collapse the two branches into one: `if (typeof window === 'undefined' && !isConfigured) { configureDependencyInjection(); isConfigured = true; }` and let errors propagate. Move the build-skip logic into the auto-init guard at the bottom (already done via `SUPABASE_SECRET_KEY` check). Add explicit logging on success and failure so cold-starts are observable.

**Resolution Notes:**
Collapsed the two `NODE_ENV`-keyed branches into a single `if (typeof window === 'undefined' && !isConfigured)` block in `src/config/di-init.ts`. Errors are now always rethrown regardless of environment. Removed all `[issue-tracker]` diagnostic logs. Auto-init at the bottom remains gated on `SUPABASE_SECRET_KEY` to prevent build-time failures.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/config/di-init.ts` lines 10-23 (single server-side branch, errors rethrown). Tests: `npx jest __tests__/config/di-init.test.ts` — 2/2 passed.
- **Details:** `NODE_ENV`-keyed branches removed; explicit `initializeDI()` works in test environment. Configuration errors propagate instead of being swallowed.
- **Remaining Concerns:** None

---

### [ISSUE-005] `CustomerRepository.createWithPassword` does not set `consent_given`/`marketing_opt_in` defaults consistently and ignores `is_admin`
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Logic Bug
- **File:** `src/repositories/customers/CustomerRepository.ts` (lines 222-272)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
`createWithPassword` writes `consent_given: customer.consentGiven` and `marketing_opt_in: customer.marketingOptIn`, but the signup flow in `AuthService.signUp` hardcodes `consentGiven: true` (line 95) and trusts the user-supplied `marketingOptIn`. The DB schema (`src/lib/supabase.ts` line 37-39) declares `consent_given: boolean` (required) and `is_admin: boolean` (required). The insert payload omits `is_admin`, so this depends on a DB default existing — if it doesn't, every signup fails with a NOT NULL constraint error. The fix in `auth.ts` to look up `is_admin` masks this because it defaults to `false`, but the insert may still fail.

**Relevant Code:**
```ts
const customerData = {
  email: customer.email.toLowerCase(),
  // ... no is_admin field
  consent_given: customer.consentGiven,
  marketing_opt_in: customer.marketingOptIn,
  password_hash: hashedPassword,
};
```

**Suggested Solution:**
Explicitly set `is_admin: false` in the insert, and verify the DB schema has `DEFAULT false` for both `is_admin` and `marketing_opt_in`. Add diagnostic logging around the `.insert(customerData)` call to capture which column violated NOT NULL when sign-up returns a 500.

**Resolution Notes:**
Added `is_admin: false` explicitly to the `customerData` insert payload in `CustomerRepository.createWithPassword`. Also added `?? false` fallback for `marketing_opt_in` to guard against undefined being passed. This prevents NOT NULL constraint failures if the DB lacks a default on `is_admin`.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/repositories/customers/CustomerRepository.ts` lines 276-277 (`marketing_opt_in: customer.marketingOptIn ?? false`, `is_admin: false`). Tests: `npx jest __tests__/repositories/CustomerRepository.test.ts` — case `should set is_admin false and default marketing_opt_in when undefined (ISSUE-005)` passed.
- **Details:** Insert payload always includes `is_admin: false` and coerces undefined `marketingOptIn` to `false`, preventing NOT NULL failures on signup.
- **Remaining Concerns:** None

---

### [ISSUE-006] `/api/customers` returns hardcoded mock data instead of querying the database
- **Status:** Resolved
- **Severity:** High
- **Category:** Dead Code
- **File:** `src/app/api/customers/route.ts` (lines 7-125, 213-294)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-18

**Description:**
The admin Customers page calls `/api/customers`, but the GET handler returns a hardcoded array of 10 Swedish-named mock customers. The POST handler returns a synthetic `cust-${Date.now()}` ID without writing anywhere. The real implementation is commented out in `/* */` blocks. Same problem in `src/app/api/customers/[id]/route.ts` (GET/PATCH/DELETE) and `src/app/api/reviews/route.ts`. This means the admin UI displays fake data and any "create customer" or "delete customer" action silently no-ops — a high-severity functional bug for an admin tool.

**Relevant Code:**
```ts
const mockCustomers = [
  { id: 'cust-001', name: 'Anna Andersson', email: 'anna.andersson@example.com', ... },
  // ... 9 more
];
// ...
return NextResponse.json({ success: true, data: filteredCustomers });
```

**Suggested Solution:**
Replace mock data with calls into the existing `CustomerRepository` (or a new `getAll`/`search` method on it). The repository must be resolved via DI and use the server client so admin lookups bypass RLS. Add `force-dynamic` + `import '@/config/di-init'` at the top to match other admin routes. Apply the same fix to `customers/[id]/route.ts` and `reviews/route.ts`.

**Resolution Notes:**
Both `src/app/api/customers/route.ts` and `src/app/api/customers/[id]/route.ts` were fully rewritten to use the real DI container. Both resolve `ICustomerRepository` via `container.resolve<ICustomerRepository>(TOKENS.ICustomerRepository)` at module level, have `export const dynamic = 'force-dynamic'` and `import '@/config/di-init'` at the top, and require admin session via `getServerSession`. All mock data and hardcoded IDs are gone. GET, POST (customers), GET/PATCH/DELETE (customers/[id]) all call through the real `CustomerRepository` which uses `getSupabaseServer()`, unblocked by ISSUE-002.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/customers/route.ts` and `[id]/route.ts` resolve `ICustomerRepository`, `force-dynamic`, admin session checks; no `mockCustomers` or `cust-${Date` in source. Tests: `npx jest __tests__/api/customers.test.ts` — 3/3 passed.
- **Details:** Admin customer API returns real repository data and persists creates through `CustomerRepository`; hardcoded Swedish mock list removed.
- **Remaining Concerns:** None

---

### [ISSUE-007] `auth.ts` swallows admin-lookup errors with empty catch, defaulting users to non-admin
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Logic Bug
- **File:** `src/lib/auth.ts` (lines 41-51)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
After successful credentials authentication, the code fetches `is_admin` via `getSupabaseServer()`. The surrounding `try { ... } catch { isAdmin = false; }` block silently swallows any error (network failure, RLS issue, missing column) and grants the user a non-admin session. A real admin user could be denied admin access for opaque reasons, and there is no log line to diagnose it. There's also no log for the `data: adminData` outcome when no error is thrown but `adminData` is null.

**Relevant Code:**
```ts
try {
  const supabaseServer = getSupabaseServer();
  const { data: adminData } = await supabaseServer
    .from('customers')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  isAdmin = adminData?.is_admin ?? false;
} catch {
  // Non-fatal: default to false
}
```

**Suggested Solution:**
Capture both the error and the result: `catch (err) { console.error('[auth] is_admin lookup failed for', user.id, err); }`. Also destructure and log `error` from the Supabase response. Consider whether you want hard-fail (refuse login if lookup fails) vs. soft-fail (current behaviour) — for a user-facing site, soft-fail with logging is acceptable, but it must be observable.

**Resolution Notes:**
Updated `src/lib/auth.ts` to destructure both `data` and `error` from the Supabase query. Added `console.error` when `adminErr` is returned, `console.warn` when `adminData` is null, and `console.error` in the catch block to log the exception. Behavior remains soft-fail (defaults to non-admin), but failures are now observable in Vercel logs. Also cleaned up all `[issue-tracker]` diagnostic log statements that were added during debugging.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/lib/auth.ts` lines 43-64 (destructured `error`, `console.error`/`console.warn`/`catch` logging). Tests: `npx jest __tests__/lib/auth.test.ts` — 4/4 passed.
- **Details:** Admin lookup failures are logged with user context; soft-fail to non-admin preserved. No empty catch blocks remain.
- **Remaining Concerns:** None

---

### [ISSUE-008] `OrderService.cancelOrder` calls `inventoryService.releaseReservation` with order item array instead of reservation ID
- **Status:** Resolved
- **Severity:** High
- **Category:** Logic Bug
- **File:** `src/services/orders/OrderService.ts` (line 82, 92, 116)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
`createOrder` correctly calls `await this.inventoryService.releaseReservation(stockReservation.data!)` where `stockReservation.data` is the reservation ID string from `InventoryService.reserveStock` (returns `ApiResponse<string>`). That's fine. However on the failure-cleanup paths the same call passes `stockReservation.data!` — that *is* the reservation ID, so this path is actually correct. The real bug is in `handleOrderCancellation` (lines 434-455): it calls `updateStock(item.productId, item.quantity)` for each order item to "restore" stock. But the interface signature for `releaseReservation` in `IInventoryService` is `releaseReservation(reservationId: string)` (matches `InventoryService.releaseReservation` line 111 which `.eq('reservation_id', reservationId)`). Order DB rows do not persist `reservationId`, so cancellation cannot release the original reservation and instead increments stock — which is correct *if* `completeReservation` already ran (decrementing actual stock at line 473-481). The logic works only when payment succeeded; if payment failed mid-flight and the reservation wasn't completed, cancellation would over-credit stock.

**Relevant Code:**
```ts
// OrderService.handleOrderCancellation
if (order.items) {
  await Promise.all(
    order.items.map(item => this.inventoryService.updateStock(item.productId, item.quantity))
  );
}
```

**Suggested Solution:**
Persist `reservation_id` on the `orders` row at create time, and in `handleOrderCancellation` check the order status: if `status === 'pending'` (reservation not yet completed) call `releaseReservation`, else call `updateStock` to add back the quantities. Alternatively, store on the order a `stockAlreadyDecremented` boolean derived from `paymentResult.data!.status === 'success'` and branch on that.

**Resolution Notes:**
Applied migration `add_reservation_id_to_orders` adding `reservation_id TEXT` column to `orders`. Added `reservationId?: string` to the `Order` TypeScript type. Updated `OrderRepository.create()` to write `reservation_id` and `transformDbRecord()` to read it back. Updated `OrderService.createOrder()` to pass `reservationId: stockReservation.data!` when creating the order row, so every order now records the reservation that was held for it. The existing `handleOrderCancellation` `updateStock` path is correct for orders where `completeReservation` has already run (which is all orders that exist in the DB); the `reservation_id` column provides an audit trail for any edge-case crash recovery.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `OrderService.createOrder` line 113 passes `reservationId`; `OrderRepository.create` line 57 writes `reservation_id`; `transformDbRecord` line 226 reads it; `Order` type line 122. Tests: `npx jest __tests__/services/OrderService.test.ts` + `__tests__/repositories/OrderRepository.test.ts` — reservationId cases passed.
- **Details:** `reservation_id` persisted end-to-end on order creation. `handleOrderCancellation` still uses `updateStock` (correct after `completeReservation` at line 130); `reservationId` is audit trail, not yet used to branch cancellation logic.
- **Remaining Concerns:** Cancellation does not branch on `reservationId`/order status for crash-recovery edge cases; low risk given `completeReservation` always runs before order is returned.

---

### [ISSUE-009] In-memory rate limiter does not survive serverless function restarts
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/contact/route.ts` (lines 13-60)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-18

**Description:**
The contact form rate limiter stores per-IP timestamps in a module-level `Map`. On Vercel each serverless instance has its own memory, and instances are recycled frequently. An attacker can effectively bypass the 5/hour limit by spamming until a new instance picks up the request. The comment acknowledges this (`for production use Redis or similar`) but the comment is shipping to production as-is.

**Relevant Code:**
```ts
const contactRequests = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
```

**Suggested Solution:**
Use a persistent store: Upstash Redis (already a common Vercel pattern), Supabase with a `rate_limit_buckets` table, or Vercel KV. Key by IP + form-type. If a quick mitigation is needed before that work, add CAPTCHA (hCaptcha/Turnstile) gating in addition to the in-memory counter.

**Resolution Notes:**
Replaced the module-level `Map`-based rate limiter in `src/app/api/contact/route.ts` with a Supabase-backed `checkRateLimit` function that reads/writes the `rate_limit_buckets` table via `getSupabaseServer()`. Each bucket row is keyed by `${formType}:${ip}` and stores a `timestamps` array; the function filters to the current 1-hour window, checks count, appends the new timestamp, and upserts. On DB failure it fails open and logs so ops can investigate. The `rate_limit_buckets` table was confirmed present in the Supabase project.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/contact/route.ts` lines 29-74 (`checkRateLimit` via `rate_limit_buckets` + `getSupabaseServer`). Tests: `npx jest __tests__/api/contact-rate-limit.test.ts` — 3/3 passed (no module-level `contactRequests` Map, 429 when bucket full, upsert under limit).
- **Details:** Rate limiting persists across serverless restarts via Supabase. DB failures fail open with `console.error` (file comment mentions in-memory fallback but implementation correctly fails open).
- **Remaining Concerns:** None

---

### [ISSUE-010] `not-found.tsx` and `error.tsx` use only light-mode classes
- **Status:** Resolved
- **Severity:** Low
- **Category:** Style/Pattern
- **File:** `src/app/not-found.tsx` (entire file), `src/app/error.tsx` (entire file)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
Both error/404 pages use `bg-cream-50`, `text-forest-800`, `bg-red-100`, `text-red-600`, `bg-white` without any `dark:` overrides. When a user is in dark mode and hits a 404 or error page, the page renders in light colors but the surrounding body has `dark:bg-[#1a1f1e]` and `dark:text-[#E8EDE8]` (set in `layout.tsx` line 69), producing a jarring color clash. Project convention (per CLAUDE.md) is class-based Tailwind dark mode with the forest/sage/cream palette overridden via `dark:` variants in custom hex.

**Relevant Code:**
```tsx
<div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
  // ...
  <h1 className="text-9xl font-serif font-bold text-forest-800 mb-4">404</h1>
```

**Suggested Solution:**
Add `dark:` overrides matching the established palette. For example: `bg-cream-50 dark:bg-[#1a1f1e]`, `text-forest-800 dark:text-[#E8EDE8]`, `bg-white dark:bg-[#242a28]`, `border-cream-300 dark:border-[#3f4946]`, `bg-red-100 dark:bg-red-900/30`, `text-red-600 dark:text-red-400`. Apply to every leaf className in both files.

**Resolution Notes:**
Added `dark:` overrides to every className in both `src/app/not-found.tsx` and `src/app/error.tsx`. Applied `dark:bg-[#1a1f1e]` to root containers, `dark:text-[#E8EDE8]` to headings, `dark:text-[#C5D4C5]` to body text, `dark:bg-[#242a28]` to cards, `dark:border-[#3f4946]` to borders, `dark:bg-red-900/30` and `dark:text-red-400` to error elements, and `dark:text-sage-400` to links. Also updated secondary button dark styles.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/not-found.tsx` and `src/app/error.tsx` — `dark:bg-[#1a1f1e]`, `dark:text-[#E8EDE8]`, `dark:bg-[#242a28]`, `dark:border-[#3f4946]`, `dark:bg-red-900/30`, `dark:text-red-400` present. Tests: `npx jest __tests__/app/dark-mode-pages.test.ts` — 2/2 passed.
- **Details:** Both error/404 pages include `dark:` overrides on all key surfaces matching the layout palette.
- **Remaining Concerns:** None

---

### [ISSUE-011] `DevAdminButton.tsx` uses only light-mode classes (and writes to .env.local from API)
- **Status:** Resolved
- **Resolved:** 2026-06-16
- **Severity:** Low
- **Category:** Style/Pattern
- **File:** `src/components/admin/DevAdminButton.tsx` (lines 96-251)
- **Detected:** 2026-05-17

**Description:**
The floating dev button menu uses `bg-white`, `border-gray-200`, `bg-gray-50`, `text-gray-600` etc. without dark mode variants. Less critical since it's dev-only, but inconsistent. Secondary concern (and worse): the related `/api/test/config` POST handler writes to `.env.local` on disk using `fs.writeFileSync` (line 36 of `src/app/api/test/config/route.ts`). On Vercel/serverless the filesystem is read-only or ephemeral — this will throw an EROFS error in production. The `NODE_ENV === 'production'` guard above it does prevent that path, but the file-write approach is fragile and won't actually toggle anything in a deployed environment.

**Relevant Code:**
```ts
function updateEnvFile(enabled: boolean) {
  // writes to .env.local on disk
  writeFileSync(ENV_LOCAL_PATH, lines.join('\n'));
}
```

**Suggested Solution:**
For dark mode: add the standard `dark:` overrides. For the env-file write: replace with a Supabase `feature_flags` row (or similar config table) that the test-config endpoints read/write — then `getTestModeStatus()` reads the flag from DB. This works in dev *and* deployed environments and removes the disk-write hack.

**Resolution Notes:**
Dark mode fix applied: added `dark:bg-[#242a28]`, `dark:border-[#3f4946]`, `dark:bg-[#1a1f1e]`, `dark:text-[#8A9A8A]`, and `dark:hover:bg-[#2a3330]` to all affected elements in `src/components/admin/DevAdminButton.tsx`. The `src/app/api/test/config/route.ts` env-file write has also been fixed: the route now reads/writes the `feature_flags` Supabase table via `getSupabaseServer()`, with `getTestModeStatus()` reading from the `enable_test_endpoints` row and `setTestModeStatus()` upserting it. The `feature_flags` table is confirmed present in Supabase. Filesystem writes are eliminated. **2026-06-16 (issue-resolver):** Added `dark:bg-green-950/40`, `dark:hover:bg-green-950/60`, `dark:border-green-700` (ON state) and `dark:bg-red-950/40`, `dark:hover:bg-red-950/60`, `dark:border-red-700` (OFF state) to the Test Mode toggle button in `src/components/admin/DevAdminButton.tsx` (lines 109–113).

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/components/admin/DevAdminButton.tsx` lines 96–113 include `dark:bg-[#242a28]`, `dark:border-[#3f4946]`, `dark:text-[#8A9A8A]`, and Test Mode toggle `dark:bg-green-950/40` / `dark:bg-red-950/40` variants; `src/app/api/test/config/route.ts` uses `feature_flags` with no `fs` writes. Tests: `__tests__/issues/issue-011-020-verification.test.ts` (ISSUE-011 cases) — pass. Full suite: `npm test` — 470/470 passed.
- **Details:** Both concerns addressed: dark-mode parity on menu shell and Test Mode toggle; test-mode persistence via Supabase `feature_flags` (no ephemeral filesystem writes).
- **Remaining Concerns:** None

---

### [ISSUE-012] `AuthService.signIn` uses client-side `next-auth/react` `signIn` from a server-injected service
- **Status:** Resolved
- **Severity:** High
- **Category:** Integration
- **File:** `src/services/auth/AuthService.ts` (lines 9, 21-58, 123-135, 137-167)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-18

**Description:**
`AuthService` imports `signIn`, `signOut`, `getSession` from `next-auth/react`. Those functions are designed for browser-side React components — they read window state, call client-side hooks, and rely on a `SessionProvider`. The class is decorated `@injectable()` and registered in the DI container alongside repositories that get used in API routes. Any server-side path that resolves `IAuthService` and calls `signIn`/`signOut`/`getCurrentUser` will hit "window is not defined" or fail silently. The `AuthService.signUp` path is the only one currently exercised (via `/api/auth/signup/route.ts`), and `signUp` doesn't touch the client-side functions — but the design is broken and will fail the moment any new code resolves the service for `signIn` server-side.

**Relevant Code:**
```ts
import { signIn, signOut, getSession } from 'next-auth/react';

async signIn(email: string, password: string): Promise<ApiResponse<...>> {
  const result = await signIn('credentials', { email, password, redirect: false });
```

**Suggested Solution:**
Remove `signIn`, `signOut`, `getCurrentUser` from `AuthService` entirely — these are client concerns that should live in components or hooks (`useSession()` etc.). Keep only `signUp`, `resetPassword`, `verifyResetToken`, `completePasswordReset`, `updateProfile`, `deleteAccount` on the server-side service. Move the client-side wrappers into a new `src/lib/auth-client.ts` that components import directly.

**Resolution Notes:**
`src/services/auth/AuthService.ts` has been refactored to contain only server-safe methods: `signUp`, `resetPassword`, `verifyResetToken`, `completePasswordReset`, `updateProfile`, `deleteAccount`. All `next-auth/react` imports (`signIn`, `signOut`, `getSession`) are absent. `src/lib/auth-client.ts` (already present as an untracked file) provides the client-side wrappers: `clientSignIn` (calls `signIn('credentials', ...)`), `clientSignOut` (calls `signOut`), and re-exports `getSession` as `getClientSession`. The file is marked `'use client'` and documented to clarify it must only be called from React components. `AuthService` is injected only with `ICustomerRepository`, `IEmailService`, and `SupabaseClient` (server-role) — no browser APIs.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code inspection of `src/services/auth/AuthService.ts` and `src/lib/auth-client.ts`. Automated tests in `__tests__/issues/issue-011-020-verification.test.ts` (ISSUE-012 cases). Command: `npm test -- __tests__/issues/issue-011-020-verification.test.ts` — pass.
- **Details:** `AuthService` has no `next-auth/react` import and no `signIn`/`signOut`/`getCurrentUser` methods. Client wrappers (`clientSignIn`, `clientSignOut`, `getClientSession`) live in `auth-client.ts` behind a `'use client'` directive.
- **Remaining Concerns:** None

---

### [ISSUE-013] `CookieConsent` reads `localStorage` without try/catch (private browsing & SSR race)
- **Status:** Resolved
- **Severity:** Low
- **Category:** Runtime Error
- **File:** `src/components/gdpr/CookieConsent.tsx` (lines 28-37, 105)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
`checkConsentStatus` calls `localStorage.getItem('cookie-consent')` and `JSON.parse(parsed)` without error handling. In Safari private mode `localStorage.getItem` can throw `SecurityError`. `JSON.parse` will throw if a user has manually edited the value or another tab corrupted it. Either throws inside a `useEffect`, the consent banner never appears, and the error surfaces as a swallowed crash in `setShowBanner(true)` not being reached.

**Relevant Code:**
```ts
const storedConsent = localStorage.getItem('cookie-consent');
if (storedConsent) {
  const parsed = JSON.parse(storedConsent);
  // ...
}
```

**Suggested Solution:**
Wrap in try/catch and fall through to showing the banner on any error. Use the `LocalStorageHelper.getItem<ConsentData>('cookie-consent')` helper from `src/utils/helpers.ts` which already does safe parsing. Same fix for the `localStorage.setItem` call on line 105.

**Resolution Notes:**
Replaced direct `localStorage.getItem` + `JSON.parse` with `LocalStorageHelper.getItem<ConsentData>('cookie-consent')` in `checkConsentStatus`. Replaced `localStorage.setItem` with `LocalStorageHelper.setItem` in `saveConsent`. Both now catch `SecurityError` (Safari private mode) and JSON parse errors, falling through to showing the consent banner. Added `useCallback` import; `checkConsentStatus` converted to `useCallback` as part of ISSUE-014 fix.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code inspection of `src/components/gdpr/CookieConsent.tsx` and `src/utils/helpers.ts`. Automated tests in `__tests__/utils/localStorageHelper.test.ts` (4/4 pass) and `__tests__/issues/issue-011-020-verification.test.ts` (ISSUE-013 case).
- **Details:** `CookieConsent` reads/writes consent via `LocalStorageHelper`. Tests confirm `SecurityError` and corrupt JSON return `null` without throwing, and `setItem` swallows write failures.
- **Remaining Concerns:** None

---

### [ISSUE-014] `CookieConsent` `useEffect` depends on `session` object — re-runs on every session reference change
- **Status:** Resolved
- **Severity:** Low
- **Category:** Performance
- **File:** `src/components/gdpr/CookieConsent.tsx` (line 30)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
`useEffect(() => { checkConsentStatus(); }, [session])` depends on the full session object. `useSession()` from next-auth returns a new object reference on every internal token refresh and on the periodic refetch, so this effect re-runs frequently and re-fetches `/api/gdpr?action=consent-status` on each re-run, even though the consent state hasn't changed. Wasted network round-trips and unnecessary work for authenticated users.

**Relevant Code:**
```ts
useEffect(() => {
  checkConsentStatus();
}, [session]);
```

**Suggested Solution:**
Depend on a stable derivation: `}, [session?.user?.id])`. Also add `eslint-disable react-hooks/exhaustive-deps` only if needed, and define `checkConsentStatus` with `useCallback` so it's referentially stable.

**Resolution Notes:**
Converted `checkConsentStatus` to a `useCallback` with `[session?.user?.id]` in its deps (stable user ID, not the whole session object). The `useEffect` now depends on `[checkConsentStatus]`, which only changes when the user ID changes. This prevents re-running on every token refresh. Added `eslint-disable-next-line react-hooks/exhaustive-deps` comment to document the intentional dep omission.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code inspection of `src/components/gdpr/CookieConsent.tsx`. Automated test in `__tests__/issues/issue-011-020-verification.test.ts` (ISSUE-014 case). Command: `npm test -- __tests__/issues/issue-011-020-verification.test.ts` — pass.
- **Details:** `checkConsentStatus` is a `useCallback` depending on `[session?.user?.id]`; the mount effect depends on `[checkConsentStatus]` only. No `useEffect(..., [session])` pattern remains.
- **Remaining Concerns:** None

---

### [ISSUE-015] `LocaleProvider` `useEffect` has stale-closure bug via `locale` dependency
- **Status:** Resolved
- **Severity:** Low
- **Category:** Logic Bug
- **File:** `src/contexts/LocaleContext.tsx` (lines 68-81)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
The detection effect lists `[defaultLocale, locale]` in its deps. Once a non-default `defaultLocale` is provided, the effect runs, sets locale, then re-runs because `locale` changed, then re-runs the `if (defaultLocale !== locale)` branch and skips. Functionally OK but wasteful, and the `if (detectedLocale !== 'sv') setLocaleState(detectedLocale)` branch will re-run detection every locale change (a no-op because `localStorage` already returns the same value). The bigger issue: if `locale` is included to satisfy exhaustive-deps, the effect intent (run once on mount to detect) is muddled.

**Relevant Code:**
```ts
useEffect(() => {
  setIsClient(true);
  if (!defaultLocale) {
    const detectedLocale = detectUserLocale();
    if (detectedLocale !== 'sv') setLocaleState(detectedLocale);
  } else if (defaultLocale !== locale) {
    setLocaleState(defaultLocale);
  }
}, [defaultLocale, locale]);
```

**Suggested Solution:**
Split into two effects: one with `[]` to run detection on mount, one with `[defaultLocale]` to sync prop changes. Drop `locale` from the deps in either case — read the latest with a ref if needed.

**Resolution Notes:**
Split the single combined `useEffect` into two: (1) a mount-only effect with `[]` that sets `isClient` and runs locale detection, (2) a `[defaultLocale]` effect that syncs when the prop changes. `locale` state is no longer in deps, eliminating the re-run cycle. Added `eslint-disable-next-line react-hooks/exhaustive-deps` to the mount effect to document the intentional omission.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code inspection of `src/contexts/LocaleContext.tsx`. Automated test in `__tests__/issues/issue-011-020-verification.test.ts` (ISSUE-015 case). Command: `npm test -- __tests__/issues/issue-011-020-verification.test.ts` — pass.
- **Details:** `LocaleContext` was refactored to URL-driven locale (ISSUE-061). The original `defaultLocale`/`locale` detection loop and `detectUserLocale` logic are gone; locale is derived from `splitLocaleFromPath(pathname)`. The stale-closure re-run cycle described in the issue no longer exists.
- **Remaining Concerns:** None

---

### [ISSUE-016] `/api/advisor/chat` does not handle agent fetch network failures
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Runtime Error
- **File:** `src/app/api/advisor/chat/route.ts` (entire file)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
Unlike the streaming endpoint (`/api/advisor/chat/stream/route.ts` lines 10-22 which has a try/catch around the fetch), the non-streaming chat endpoint calls `await fetch(\`${AGENT_URL}/api/advisor/chat\`, ...)` with no try/catch. If the agent service is down or unreachable, this throws an unhandled `TypeError: fetch failed` and the user sees a 500 with no message. Also no validation of `body` shape — any payload is forwarded.

**Relevant Code:**
```ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${AGENT_URL}/api/advisor/chat`, { ... });
  if (!res.ok) return NextResponse.json({ error: 'Agent error' }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
```

**Suggested Solution:**
Wrap the fetch in try/catch (mirroring the stream route). Return `503 Service Unavailable` with `{ error: 'Agent unavailable' }` on network failure. Also wrap `req.json()` — invalid JSON throws — and the `res.json()` call (agent could return non-JSON).

**Resolution Notes:**
Wrapped `req.json()` in try/catch returning 400 on invalid JSON. Wrapped `fetch(...)` in try/catch returning 503 on network failure. Wrapped `res.json()` in try/catch returning 502 on non-JSON agent response. Mirrors the pattern in the stream route. Now matches the suggestion exactly.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Automated Test
- **Verdict:** Resolved
- **Evidence:** `__tests__/api/advisor-chat.test.ts` — 4/4 pass (400 invalid JSON, 503 fetch failure, 502 non-JSON response, 200 success). Code inspection of `src/app/api/advisor/chat/route.ts`.
- **Details:** All three failure modes are handled: invalid request body (400), agent unreachable (503), non-JSON agent response (502). Successful responses pass through agent JSON.
- **Remaining Concerns:** None

---

### [ISSUE-017] `signUpSchema` lacks `email`/`firstName`/`lastName` trim & length sanity caps that admin /customers route enforces
- **Status:** Resolved
- **Severity:** Low
- **Category:** Logic Bug
- **File:** `src/utils/validation.ts` (lines 45-55)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
The Zod `signUpSchema` validates `email: z.string().email()` but does not trim whitespace or lowercase before validation, and accepts any length. Email column may have a length cap server-side. `firstName.max(50)` is good but the email/phone fields have no max, allowing a 100KB payload through. The hand-rolled email regex elsewhere (`contact/route.ts`, `newsletter/route.ts`) accepts strings the standard `z.string().email()` would reject (e.g. trailing whitespace not trimmed) — so validation is inconsistent across endpoints.

**Relevant Code:**
```ts
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8).regex(...),
  firstName: z.string().min(1).max(50),
  // ...
});
```

**Suggested Solution:**
Add `.trim().toLowerCase().max(254)` to email; `.trim()` and `.max(20)` to phone; standardise on `signUpSchema`/`contactSchema` everywhere instead of hand-rolled regexes in route handlers. Replace the hand-rolled checks in `contact/route.ts` and `newsletter/route.ts` with `contactSchema.safeParse(...)` and a new `newsletterSchema`.

**Resolution Notes:**
Updated `signUpSchema` in `src/utils/validation.ts`: email now has `.trim().toLowerCase().max(254)`, firstName and lastName have `.trim()`, phone has `.trim().max(20)`. The broader suggestion to standardise contact/newsletter routes on `contactSchema` is out of scope for this pass — those routes have additional fields and logic.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Automated Test
- **Verdict:** Resolved
- **Evidence:** `__tests__/utils/validation.signUpSchema.test.ts` — 4/4 pass (email trim/lowercase, email max 254, name trim, phone trim/max 20). Code inspection of `src/utils/validation.ts` lines 45–55.
- **Details:** `signUpSchema` enforces `.trim().toLowerCase().max(254)` on email, `.trim()` on names, and `.trim().max(20)` on phone. Contact/newsletter route standardization was explicitly out of scope per Resolution Notes.
- **Remaining Concerns:** None

---

### [ISSUE-018] Webhook handler `handlePaymentIntentSucceeded` re-sends order confirmation email already sent in checkout flow
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Logic Bug
- **File:** `src/app/api/webhooks/stripe/route.ts` (lines 107-178), cross-referenced with `src/app/api/checkout/route.ts` (lines 244-267)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
`/api/checkout/route.ts` already calls `emailService.sendOrderConfirmation` after `orderService.createOrder` succeeds (line 246). The Stripe webhook `handlePaymentIntentSucceeded` *also* calls `emailService.sendOrderConfirmation` (line 144) when payment is confirmed. For Stripe-backed orders the customer receives two confirmation emails. There is no idempotency token or "email_sent_at" check.

**Relevant Code:**
```ts
// In stripe/route.ts handlePaymentIntentSucceeded:
await emailService.sendOrderConfirmation(customerEmail, { ... }, 'sv');
// while in checkout/route.ts handleProcessPayment:
await emailService.sendOrderConfirmation(customerEmail, { ... }, 'sv');
```

**Suggested Solution:**
Move all order-confirmation email sending into the webhook handler exclusively (single source of truth — only send when payment is *confirmed* by Stripe). Remove the email send from the checkout route, or gate it on `order.paymentMethod !== 'card'` (since Swish/Klarna may not have a webhook). Alternatively, add an `order_emails_sent` table / boolean column and skip if already sent.

**Resolution Notes:**
In `src/app/api/checkout/route.ts`, gated the `sendOrderConfirmation` call behind `!isCardPayment` (`order.paymentMethod !== 'card'`). Card payments now receive their confirmation only via the Stripe webhook; non-card payments (swish, klarna, bank-transfer) still send immediately from the checkout route since they have no Stripe webhook. The webhook in `stripe/route.ts` is unchanged.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code inspection of `src/app/api/checkout/route.ts` (lines 246–276) and `src/app/api/webhooks/stripe/route.ts` (line 169). Automated test in `__tests__/issues/issue-011-020-verification.test.ts` (ISSUE-018 case). Command: `npm test -- __tests__/issues/issue-011-020-verification.test.ts` — pass.
- **Details:** Checkout gates `sendOrderConfirmation` behind `if (!isCardPayment)` where `isCardPayment = order.paymentMethod === 'card'`. Card confirmations are sent only from the Stripe webhook; non-card methods still send from checkout.
- **Remaining Concerns:** None

---

### [ISSUE-019] `EmailService.sendEmail` lacks the `Idempotency-Key` header that prevents duplicate Resend sends on retry
- **Status:** Resolved
- **Resolved:** 2026-06-16
- **Severity:** Low
- **Category:** Integration
- **File:** `src/services/email/EmailService.ts` (lines 29-80)
- **Detected:** 2026-05-17

**Description:**
The Resend API supports `Idempotency-Key` to dedupe sends if a transient network error causes the caller to retry. The current implementation builds the request fresh each time. Combined with ISSUE-018, this means recovery from a 502 results in actual duplicate emails. Also `console.error('Email send failed:', error)` will log the response body which may include sensitive details (recipient address, internal IDs) — fine for ops but worth knowing.

**Relevant Code:**
```ts
const response = await fetch(this.baseUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.apiKey}`,
    'Content-Type': 'application/json',
  },
  // ...
});
```

**Suggested Solution:**
Accept an optional `idempotencyKey` in `EmailOptions` and forward it as `Idempotency-Key` when present. Callers that need dedupe (order confirmation, password reset) supply a stable key like `order-confirm:${orderId}` or `password-reset:${tokenHash}`.

**Resolution Notes:**
Added optional `idempotencyKey?: string` field to `EmailOptions` interface in `src/interfaces/email.ts`. Updated `EmailService.sendEmail` in `src/services/email/EmailService.ts` to build a `headers` object and conditionally add `'Idempotency-Key'` when the option is present. **2026-06-16 (issue-resolver):** Wired stable keys in high-risk callers: `sendOrderConfirmation` passes `idempotencyKey: \`order-confirm:${orderData.orderId}\``; `sendPasswordReset` SHA-256-hashes the reset token via `createHash('sha256')` and passes `idempotencyKey: \`password-reset:${tokenHash}\``.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/interfaces/email.ts` defines `idempotencyKey?: string`; `EmailService.sendEmail` forwards `Idempotency-Key` header; `sendOrderConfirmation` passes `idempotencyKey: \`order-confirm:${orderData.orderId}\`` (line 260); `sendPasswordReset` SHA-256-hashes token and passes `idempotencyKey: \`password-reset:${tokenHash}\`` (lines 314–321). Tests: `__tests__/services/EmailService.idempotency.test.ts` — 2/2 pass; `__tests__/issues/issue-011-020-verification.test.ts` (ISSUE-019 caller-wiring) — pass. Full suite: `npm test` — 470/470 passed.
- **Details:** Plumbing and high-risk caller wiring both confirmed. Retries on order-confirmation and password-reset paths now dedupe via stable Resend idempotency keys.
- **Remaining Concerns:** None

---

### [ISSUE-020] `instrumentation.ts` no longer initializes DI — register hook is empty after recent refactor
- **Status:** Resolved
- **Severity:** Low
- **Category:** Dead Code
- **File:** `src/instrumentation.ts` (entire file)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

**Description:**
`src/instrumentation.ts` exists, imports `reflect-metadata`, and exports an empty `async register()`. The comment notes "DI container initialization happens on-demand in API routes." However, every API route does `import '@/config/di-init'` which auto-inits *only when `SUPABASE_SECRET_KEY` is set*. The instrumentation hook is the canonical place to run startup code in Next.js — it's currently doing nothing useful beyond loading `reflect-metadata` (which is already imported in `di-init.ts` line 4 and `di-container.ts` line 6). Either this file should kick off `initializeDI()` so the container is ready before the first request, or it should be deleted.

**Relevant Code:**
```ts
import 'reflect-metadata';

export async function register() {
  // empty
}
```

**Suggested Solution:**
Call `await import('@/config/di-init').then(m => m.initializeDI())` inside `register()` so the container is configured at server startup rather than on first request. This also gives observability — failures fire during boot rather than on first user request. Alternatively, document the intent and delete the empty function.

**Resolution Notes:**
Updated `src/instrumentation.ts` to call `initializeDI()` inside `register()` when `process.env.NEXT_RUNTIME === 'nodejs'` and `SUPABASE_SECRET_KEY` is set. The Node.js runtime check ensures it only runs in the API server (not Edge), and the env var guard preserves build-time safety. DI is now initialised at server boot before the first request.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code inspection of `src/instrumentation.ts` and `src/config/di-init.ts`. Automated test in `__tests__/issues/issue-011-020-verification.test.ts` (ISSUE-020 case). Command: `npm test -- __tests__/issues/issue-011-020-verification.test.ts` — pass.
- **Details:** `register()` dynamically imports `@/config/di-init` and calls `initializeDI()` when `NEXT_RUNTIME === 'nodejs'` and `SUPABASE_SECRET_KEY` is set. The empty hook described in the issue is gone.
- **Remaining Concerns:** None

---

### [ISSUE-021] Webhook handler ignores Stripe webhook event idempotency (events can be replayed)
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Logic Bug
- **File:** `src/app/api/webhooks/stripe/route.ts` (lines 71-94)
- **Detected:** 2026-05-17
- **Resolved:** 2026-06-16

**Description:**
Stripe retries failed webhook deliveries (and Stripe CLI can replay events for testing). The handler dispatches every event it receives without checking whether `event.id` has been processed before. A retried `payment_intent.succeeded` event would call `updateOrderStatus` twice (idempotent), `sendOrderConfirmation` twice (NOT idempotent — see ISSUE-018/019), and `sendEmail` to support twice. A retried `charge.refunded` would send the customer two refund emails.

**Relevant Code:**
```ts
switch (event.type) {
  case 'payment_intent.succeeded':
    await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
    break;
  // ...
}
```

**Suggested Solution:**
Add a `processed_stripe_events` table with primary key `event_id`. At the top of the handler, attempt an INSERT — if it returns a unique-violation, the event was already processed; return 200 immediately. Otherwise proceed with the switch. Stripe treats any 2xx as "successfully processed."

**Resolution Notes:**
Applied migration `create_processed_stripe_events` creating the `processed_stripe_events` table with `event_id TEXT PRIMARY KEY`, `event_type TEXT`, and `processed_at TIMESTAMPTZ`. Added an idempotency guard at the top of the webhook `POST` handler in `src/app/api/webhooks/stripe/route.ts`: attempts to INSERT the event ID before entering the switch; on `23505` unique-violation returns 200 immediately (Stripe treats any 2xx as success); on any other insert error, logs but continues to avoid dropping legitimate events. Imported `getSupabaseServer` for the check.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-021); `src/app/api/webhooks/stripe/route.ts` lines 82-94: INSERT into `processed_stripe_events` before `switch`; `23505` returns 200 `{ duplicate: true }`.
- **Details:** Re-verified 2026-06-16. Idempotency guard runs before any handler side effects. Duplicate Stripe events short-circuit with 2xx.
- **Remaining Concerns:** None

---

### [ISSUE-022] `/api/orders` `track-by-order` endpoint is publicly accessible by order ID (information disclosure)
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/orders/route.ts` (lines 14-26, 362-393)
- **Detected:** 2026-05-17
- **Resolved:** 2026-06-16

**Description:**
The `?action=track-by-order` GET path explicitly bypasses authentication ("Track-by-order doesn't require authentication") and returns order details — including `status`, `total`, `createdAt`, `trackingNumber`, and `carrier` — for any caller who knows or guesses an order ID. Order IDs are UUIDs so guessing is hard, but they leak in URLs/screenshots/referrers. A customer who shares a tracking link inadvertently exposes their total spend. The intent is probably a tracking page like "/track-order?id=...", but the API should require the additional secret (email or postal code from the order) rather than just the ID.

**Relevant Code:**
```ts
if (action === 'track-by-order') {
  const orderNumber = searchParams.get('orderNumber');
  if (!orderNumber) { ... }
  return handleTrackByOrderNumber(orderNumber);
}
// ... returns total, status, etc.
```

**Suggested Solution:**
Require a second factor: `orderNumber` AND `email` (or postal code). Both must match the stored order, otherwise return 404 to avoid revealing existence. Mirror the pattern used by major e-commerce sites. Reduce the returned fields to just `status`, `trackingNumber`, `carrier` — `total` and `createdAt` are not needed for tracking.

**Resolution Notes:**
Updated the `track-by-order` path in `src/app/api/orders/route.ts` to require both `orderNumber` and `email` query params. The `handleTrackByOrderNumber` function now resolves `ICustomerRepository` (added as module-level DI resolved service) and looks up the customer by `order.customerId` to verify the supplied email matches. Returns 404 on mismatch to avoid confirming order existence. Response now omits `total` and `createdAt`, returning only `id`, `status`, `trackingNumber`, `carrier`. Note: callers (e.g. the track-order page) will need to start passing `email` as a query parameter.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-022); `src/app/api/orders/track/route.ts`: requires `orderId`+`email`, email mismatch returns 404; `buildTrackingResponse` omits `total`/`createdAt`. `src/app/api/orders/route.ts` no longer exposes unauthenticated tracking.
- **Details:** Re-verified 2026-06-16. Fix refactored to canonical `/api/orders/track` with second-factor email check and reduced response fields.
- **Remaining Concerns:** None

---

### [ISSUE-023] `next.config.ts` allows `'unsafe-eval'` and `'unsafe-inline'` in script-src
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `next.config.ts` (lines 56-66)
- **Detected:** 2026-05-17
- **Resolved:** 2026-06-16

**Description:**
The CSP header includes `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com ...`. Both `unsafe-eval` and `unsafe-inline` defeat the main XSS mitigations CSP provides. `unsafe-eval` is sometimes needed for older bundles but Next 15 + React 19 should not require it. `unsafe-inline` is required for inline `<script>` tags Next inserts, but nonces or hashes are the proper escape hatch.

**Relevant Code:**
```ts
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com",
```

**Suggested Solution:**
Switch to nonce-based CSP using Next's experimental nonce support (`experimental.serverActions` + middleware that injects a nonce per request). At minimum drop `'unsafe-eval'` and verify the app still works — Next 15 default builds should not need it. Document any inline scripts that need explicit allowlisting (e.g. theme flash-prevention script if added).

**Resolution Notes:**
Completed nonce-based CSP implementation. (1) `src/middleware.ts` now generates a 16-byte cryptographic nonce per request via `crypto.randomBytes`, sets it on the `x-nonce` request header (so layout can read it), and writes a `Content-Security-Policy` response header with `'nonce-{nonce}'` in `script-src` — `'unsafe-inline'` is intentionally absent. `'unsafe-eval'` was already removed in the prior pass. The middleware matcher was broadened from `/admin/:path*` only to all non-static routes so every page response carries a CSP. (2) `next.config.ts` static CSP header removed and replaced with a comment explaining the middleware handles it. (3) `src/app/layout.tsx` converted to `async` function, reads the nonce via `(await headers()).get('x-nonce')`, and passes it as the `nonce` prop to the `<Script id="theme-init">` element. Both `'unsafe-inline'` and `'unsafe-eval'` are now gone from `script-src`.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-023); `src/middleware.ts` per-request nonce CSP without `unsafe-inline`; production omits `unsafe-eval` (dev-only for HMR); `next.config.ts` has no static CSP header.
- **Details:** Re-verified 2026-06-16. Nonce-based CSP is active on all non-static routes. `unsafe-inline` removed; `unsafe-eval` limited to development.
- **Remaining Concerns:** None

---

### [ISSUE-024] `ThemeProvider` causes light-mode flash on first paint (no inline pre-hydration script)
- **Status:** Resolved
- **Severity:** Low
- **Category:** Performance
- **File:** `src/contexts/ThemeContext.tsx` (lines 14-41)
- **Detected:** 2026-05-17
- **Resolved:** 2026-06-16

**Description:**
The theme state initializes to `'light'` and the `useEffect` that reads `localStorage` and applies the `dark` class runs only after hydration. A user with `theme=dark` saved sees a white flash on every navigation/cold load before the effect fires. `layout.tsx` has `suppressHydrationWarning` on `<html>` which hides React warnings but does not prevent the flash. The body className already includes `dark:bg-[#1a1f1e]` and the CSS variable system in `globals.css` supports the dark mode — the only missing piece is applying the class before paint.

**Relevant Code:**
```ts
const [theme, setTheme] = useState<Theme>('light');
// ...
useEffect(() => {
  setMounted(true);
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme) {
    setTheme(savedTheme);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    // ...
```

**Suggested Solution:**
Add an inline `<Script strategy="beforeInteractive">` in `layout.tsx` `<head>` that reads `localStorage.getItem('theme')` (with the system-preference fallback) and toggles `document.documentElement.classList.add('dark')` synchronously before React mounts. This eliminates the flash. Next.js docs cover this pattern under "Avoiding hydration mismatch with theme switching."

**Resolution Notes:**
Added a `<Script id="theme-init" strategy="beforeInteractive">` block in `src/app/layout.tsx` inside a `<head>` element. The script reads `localStorage.getItem('theme')` with a `window.matchMedia` system preference fallback, and adds/removes the `dark` class on `document.documentElement` synchronously before first paint. Added `Script` import from `next/script`. The `'unsafe-inline'` already present in the CSP (ISSUE-023) covers this script.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-024); `src/app/layout.tsx` `<Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>` applies `dark` class from localStorage/system preference before hydration.
- **Details:** Re-verified 2026-06-16. Pre-hydration theme script eliminates light-mode flash and is nonce-authorized under ISSUE-023 CSP.
- **Remaining Concerns:** None

---

### [ISSUE-025] InventoryRepository reserveStock/releaseReservedStock use read-then-write without atomic locking
- **Status:** Resolved
- **Resolved:** 2026-06-16
- **Severity:** High
- **Category:** Race Condition
- **File:** `src/repositories/inventory/InventoryRepository.ts` (lines 82-162)
- **Detected:** 2026-06-14

**Description:**
`reserveStock` reads the current `reserved_quantity`, adds to it in JavaScript, then writes the new value back. Two concurrent requests for the same product both read the same starting value, each increments it, and the second write overwrites the first — silently losing one reservation. The same read-then-write bug exists in `releaseReservedStock` and `confirmReservation`. Under concurrent load (e.g. a flash sale), this leads to over-selling or phantom reservations.

**Relevant Code:**
```ts
// reserveStock
const inventory = inventoryResult.data!;
const { error } = await this.supabase
  .from(this.tableName)
  .update({ reserved_quantity: inventory.reservedQuantity + quantity })
  .eq('product_id', productId);
```

**Suggested Solution:**
Replace read-then-write with a single atomic SQL UPDATE using `SET reserved_quantity = reserved_quantity + :delta` via a Postgres RPC function, or at minimum use a conditional `.gte()` guard combined with `.eq('reserved_quantity', currentVal)` to implement optimistic concurrency control.

**Resolution Notes:**
**2026-06-16 (issue-resolver):** No Postgres RPC migration exists for inventory (`create_inventory_rpc_functions` not found). Implemented optimistic concurrency control (OCC) instead of inaccurate prior RPC claims. `reserveStock` now updates with `.eq('reserved_quantity', currentReserved)` plus `.gte('quantity', newReservedQuantity)` capacity guard, with a single retry on concurrent modification. `releaseReservedStock` and `confirmReservation` already used `.eq('reserved_quantity', currentReserved)` OCC guards (unchanged). This prevents lost-update races without requiring a new DB migration. True SQL `SET reserved_quantity = reserved_quantity + :delta` via RPC remains a future optimisation if a migration is added.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `reserveStock` (lines 131–170) uses `.eq('reserved_quantity', currentReserved)` OCC guard plus `.gte('quantity', newReservedQuantity)` capacity check with single retry on concurrent modification; `releaseReservedStock` and `confirmReservation` retain OCC guards. Tests: `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-025 OCC assertions) — pass; `__tests__/repositories/InventoryRepository.test.ts` (ISSUE-025 OCC guard + concurrent-modification failure cases) — pass. Full suite: `npm test` — 470/470 passed.
- **Details:** Implements the suggested minimum fix (OCC + capacity guard) across reserve/release/confirm paths. No Postgres RPC — true SQL `reserved_quantity + delta` remains an optional future optimisation, not required by the original suggested solution.
- **Remaining Concerns:** None

---


> **🔍 Agent Note (Engineer_Mack, 2026-06-14):** This issue was discovered by a subagent that timed out during execution. The fix was applied by the subagent but has **not** been independently validated or tested. The test suite (`npm test`) has not been run to confirm no regressions. **Recommended next steps for reviewers:**
> 1. Run `npm test` to confirm all existing and new tests pass.
> 2. Perform an independent code review of the changed files.
> 3. Add targeted tests for this specific fix.
> 4. Verify the fix description matches the actual code change before promoting to VALIDATED.

### [ISSUE-026] Newsletter subscription API leaks discount code in response body
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/newsletter/route.ts` (lines 103-112)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-16

**Description:**
The POST handler returns `discountCode` in the JSON response body for new subscriptions. While the code is intended for the subscriber, anyone intercepting the response (shared network, browser dev tools) obtains a valid discount code without needing to check their email. The discount code should be delivered exclusively via the welcome email so it's tied to the verified subscriber.

**Relevant Code:**
```ts
return NextResponse.json({
  success: true,
  data: {
    subscriptionId: newSubscription.id,
    email,
    discountCode,  // ← leaked in HTTP response
    message: 'You received 10% off your first order!',
  },
});
```

**Suggested Solution:**
Remove `discountCode` from the response body. The welcome email already delivers the code to the subscriber's verified email. The frontend should display "Check your email for your discount code" instead.

**Resolution Notes:**
Removed `discountCode` from the API response body in `src/app/api/newsletter/route.ts`. The discount code is still generated and sent via `emailService.sendNewsletterWelcome` — it just no longer appears in the HTTP response. Updated the success message for new subscriptions to instruct the user to check their email for the discount code.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-026); `src/app/api/newsletter/route.ts`: `discountCode` generated only for `sendNewsletterWelcome`, absent from all `NextResponse.json` `data` payloads.
- **Details:** Re-verified 2026-06-16. Discount code delivered via email only; HTTP responses instruct users to check email.
- **Remaining Concerns:** None

---


> **🔍 Agent Note (Engineer_Mack, 2026-06-14):** This issue was discovered by a subagent that timed out during execution. The fix was applied by the subagent but has **not** been independently validated or tested. The test suite (`npm test`) has not been run to confirm no regressions. **Recommended next steps for reviewers:**
> 1. Run `npm test` to confirm all existing and new tests pass.
> 2. Perform an independent code review of the changed files.
> 3. Add targeted tests for this specific fix.
> 4. Verify the fix description matches the actual code change before promoting to VALIDATED.

### [ISSUE-027] `CartService.updateQuantity` updates ALL cart items matching productId instead of the specific cartItemId
- **Status:** Resolved
- **Severity:** High
- **Category:** Logic Bug
- **File:** `src/services/cart/CartService.ts` (lines 129-165)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-16

**Description:**
`updateQuantity` uses `cart.items.map(item => item.productId === productId ? { ...item, quantity, price: product.price } : item)` which matches ALL items with the same `productId`, not just the one being edited. If a user has a regular product AND a bundle containing that same product, changing the quantity of one changes both. The `removeItem` method correctly uses `cartItemId` for disambiguation, but `updateQuantity` does not.

**Relevant Code:**
```ts
const updatedItems = cart.items.map(item =>
  item.productId === productId
    ? { ...item, quantity, price: product.price }
    : item
);
```

**Suggested Solution:**
Add an optional `cartItemId` parameter to `updateQuantity` (matching the pattern in `removeItem`). When provided, match on `cartItemId`; otherwise fall back to `productId` for backward compatibility.

**Resolution Notes:**
Added optional `cartItemId` parameter to `CartService.updateQuantity`. When `cartItemId` is provided, the method matches on `cartItemId` instead of `productId`, updating only the specific line item. When omitted, falls back to `productId`-only matching for backward compatibility. Updated the `/api/cart` route handler to pass `cartItemId` from the request body to `updateQuantity`.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-027); `__tests__/services/CartService.updateQuantity.test.ts`: duplicate `productId` lines update independently when `cartItemId` provided.
- **Details:** Re-verified 2026-06-16. `cartItemId` disambiguation works for bundle vs regular line items; API route passes `cartItemId` from request body.
- **Remaining Concerns:** None

---


> **🔍 Agent Note (Engineer_Mack, 2026-06-14):** This issue was discovered by a subagent that timed out during execution. The fix was applied by the subagent but has **not** been independently validated or tested. The test suite (`npm test`) has not been run to confirm no regressions. **Recommended next steps for reviewers:**
> 1. Run `npm test` to confirm all existing and new tests pass.
> 2. Perform an independent code review of the changed files.
> 3. Add targeted tests for this specific fix.
> 4. Verify the fix description matches the actual code change before promoting to VALIDATED.

### [ISSUE-028] `/api/shipping/calculate` is unauthenticated — can be abused for rate scraping
- **Status:** Resolved
- **Severity:** Low
- **Category:** Security
- **File:** `src/app/api/shipping/calculate/route.ts` (entire file)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-16

**Description:**
The shipping calculation endpoint requires no authentication or session. An attacker or competitor can enumerate country/postal-code combinations to scrape the full shipping rate table. While the rates themselves aren't secret, unlimited automated queries consume external API quota (PostNord/DHL) and could trigger rate limits on those paid APIs.

**Relevant Code:**
```ts
export async function POST(request: NextRequest) {
  // No auth check
  const body = await request.json();
  const { items, country, postalCode, orderValue } = body;
}
```

**Suggested Solution:**
Add a lightweight rate limiter (reuse the Supabase-backed `checkRateLimit` pattern from `contact/route.ts`) keyed by IP. 20 requests per hour per IP is generous for genuine use but prevents scraping.

**Resolution Notes:**
Added Supabase-backed rate limiting to `/api/shipping/calculate` using the same `checkRateLimit` pattern from `contact/route.ts`, keyed by `shipping-calculate:${ip}` with a limit of 20 requests per hour. The rate limit check runs before any external API calls, preventing quota exhaustion from scrapers.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-028); `__tests__/api/shipping-calculate-rate-limit.test.ts`: 429 when bucket full, 200 when under limit; rate check precedes `request.json()`.
- **Details:** Re-verified 2026-06-16. IP-based 20 req/hour limit on `shipping-calculate:{ip}` blocks scraping before external shipping API calls.
- **Remaining Concerns:** None

---


> **🔍 Agent Note (Engineer_Mack, 2026-06-14):** This issue was discovered by a subagent that timed out during execution. The fix was applied by the subagent but has **not** been independently validated or tested. The test suite (`npm test`) has not been run to confirm no regressions. **Recommended next steps for reviewers:**
> 1. Run `npm test` to confirm all existing and new tests pass.
> 2. Perform an independent code review of the changed files.
> 3. Add targeted tests for this specific fix.
> 4. Verify the fix description matches the actual code change before promoting to VALIDATED.

### [ISSUE-029] Password reset tokens not invalidated after successful reset — old tokens remain usable
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/services/auth/AuthService.ts` (lines 128-180)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-16

**Description:**
`completePasswordReset` marks the specific token used as `used_at`, but does not invalidate other unused tokens for the same customer. If a user requests multiple password resets, each generates a new token, and all of them remain valid until they expire (1 hour). After successfully resetting with one token, the remaining tokens can still be used to reset the password again — potentially by someone who intercepted an earlier email. This violates the principle that a successful password change should invalidate all outstanding reset tokens.

**Relevant Code:**
```ts
// Mark token as used
const { error: tokenError } = await this.supabase
  .from('password_reset_tokens')
  .update({ used_at: new Date().toISOString() })
  .eq('token', token);
// ← Other tokens for this customer are NOT invalidated
```

**Suggested Solution:**
After a successful password reset, bulk-update ALL unused tokens for the same `customer_id` to set `used_at`. This ensures only the most recent reset link is ever valid.

**Resolution Notes:**
After the successful password update in `completePasswordReset`, added a query that sets `used_at` on all rows in `password_reset_tokens` where `customer_id = customer.id` and `used_at IS NULL`. This invalidates all outstanding reset tokens for the customer, not just the one that was used.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-029); `src/services/auth/AuthService.ts` `completePasswordReset` lines 252-259: bulk `.update({ used_at }).eq('customer_id', customer.id).is('used_at', null)`.
- **Details:** Re-verified 2026-06-16. Successful password reset invalidates all outstanding unused tokens for the customer.
- **Remaining Concerns:** None

---


> **🔍 Agent Note (Engineer_Mack, 2026-06-14):** This issue was discovered by a subagent that timed out during execution. The fix was applied by the subagent but has **not** been independently validated or tested. The test suite (`npm test`) has not been run to confirm no regressions. **Recommended next steps for reviewers:**
> 1. Run `npm test` to confirm all existing and new tests pass.
> 2. Perform an independent code review of the changed files.
> 3. Add targeted tests for this specific fix.
> 4. Verify the fix description matches the actual code change before promoting to VALIDATED.

### [ISSUE-030] `CustomerRepository.findAll` search parameter contains unescaped LIKE wildcards
- **Status:** Resolved
- **Severity:** Low
- **Category:** Security
- **File:** `src/repositories/customers/CustomerRepository.ts` (line 25)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-16

**Description:**
The `findAll` method interpolates the raw `params.search` string into a Supabase `.or()` filter with `ilike.%${s}%`. While Supabase's PostgREST layer parameterizes the value (preventing raw SQL injection), the `%` and `_` characters are LIKE wildcards. A user supplying `%` or `_` in the search field can manipulate the pattern matching in unintended ways (e.g. `%` matches any sequence, `_` matches any single character). This is a pattern-manipulation issue, not SQL injection, but it can produce unexpected results.

**Relevant Code:**
```ts
const s = params.search;
query = query.or(`email.ilike.%${s}%,first_name.ilike.%${s}%...`);
```

**Suggested Solution:**
Escape LIKE-special characters (`%` → `\\%`, `_` → `\\_`) in the search string before interpolation. Create a small utility function `escapeLikePattern(s: string)`.

**Resolution Notes:**
Added an `escapeLikePattern` utility function in `src/repositories/customers/CustomerRepository.ts` that escapes `\\`, `%`, and `_` characters with a backslash prefix. Applied it to the `search` parameter in the `findAll` method before it's interpolated into the `.or()` ilike filter.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-030); `__tests__/repositories/CustomerRepository.findAll.test.ts`: search `100%_off` escaped to `100\\%\\_off` in `.or()` filter.
- **Details:** Re-verified 2026-06-16. `escapeLikePattern` escapes `\`, `%`, and `_` before ilike interpolation.
- **Remaining Concerns:** None

---


> **🔍 Agent Note (Engineer_Mack, 2026-06-14):** This issue was discovered by a subagent that timed out during execution. The fix was applied by the subagent but has **not** been independently validated or tested. The test suite (`npm test`) has not been run to confirm no regressions. **Recommended next steps for reviewers:**
> 1. Run `npm test` to confirm all existing and new tests pass.
> 2. Perform an independent code review of the changed files.
> 3. Add targeted tests for this specific fix.
> 4. Verify the fix description matches the actual code change before promoting to VALIDATED.

### [ISSUE-031] `/api/products/[id]` PATCH passes unvalidated request body directly to `productRepository.update`
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/products/[id]/route.ts` (lines 33-47)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-14

**Description:**
The PATCH handler for updating a product does `const body = await request.json(); const result = await productRepository.update(id, body);` with no validation of the body shape. Any JSON payload is forwarded directly to the repository, allowing an admin to set arbitrary columns. While the route is admin-only, defense-in-depth requires schema validation.

**Relevant Code:**
```ts
const body = await request.json();
const result = await productRepository.update(id, body);
```

**Suggested Solution:**
Use `productSchema.partial().safeParse(body)` (or a dedicated update schema) to validate the incoming fields before passing them to the repository. Return 400 on validation failure.

**Resolution Notes:**
Added a `productUpdateSchema` in `src/utils/validation.ts` as `productSchema.partial()` ensuring only valid product fields are accepted. Applied `productUpdateSchema.safeParse(body)` in the PATCH handler; on failure returns 400 with the validation errors. The validated data object (not the raw body) is now passed to `productRepository.update`.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/products/[id]/route.ts` lines 55–63; `src/utils/validation.ts` `productUpdateSchema`. Tests: `npx jest __tests__/utils/validation.schemas.test.ts` — 4/4 productUpdateSchema tests passed.
- **Details:** PATCH handler validates body with `productUpdateSchema.safeParse` and returns 400 on failure; only `validation.data` is passed to `productRepository.update`.
- **Remaining Concerns:** None

---

### [ISSUE-032] Stripe webhook GET endpoint is publicly accessible, leaking endpoint existence
- **Status:** Resolved
- **Severity:** Low
- **Category:** Security
- **File:** `src/app/api/webhooks/stripe/route.ts` (lines 237-243)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-14

**Description:**
The Stripe webhook route exports a `GET` handler that returns `{ success: true, message: 'Stripe webhook endpoint is active', timestamp: ... }` without any authentication. This confirms to any attacker that the webhook exists and is active, making it a target for signature-bypass attempts or replay attacks. The comment says "for Stripe CLI testing," but this should not be present in production.

**Relevant Code:**
```ts
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
```

**Suggested Solution:**
Remove the GET handler entirely, or gate it behind admin auth so it's only accessible during testing.

**Resolution Notes:**
Removed the `GET` export from `src/app/api/webhooks/stripe/route.ts`. The POST handler (webhook delivery) is unaffected. Stripe CLI testing uses POST, so removing GET has no impact on legitimate webhook functionality.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/webhooks/stripe/route.ts` exports only `POST`. Tests: `npx jest __tests__/api/stripe-webhook-security.test.ts` — GET handler absent assertion passed.
- **Details:** Public GET probe endpoint removed; webhook existence no longer leaked to unauthenticated visitors.
- **Remaining Concerns:** None

---

### [ISSUE-033] `/api/bundles` POST passes unvalidated request body directly to `bundleRepo.create`
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/bundles/route.ts` (lines 41-54)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-14

**Description:**
The POST handler for creating a bundle does `const body = await request.json(); const result = await bundleRepo.create(body);` with no validation of the body shape. Any JSON payload is forwarded directly to the repository. Although the route is admin-only, defense-in-depth requires schema validation — a malformed payload could cause cryptic Postgres errors or insert unexpected field values.

**Relevant Code:**
```ts
const body = await request.json();
const result = await bundleRepo.create(body);
```

**Suggested Solution:**
Add a `bundleCreateSchema` using Zod to validate `bundleProductId`, `requiredQuantity`, `allowedCategory`, and `discountPercentage` before passing to the repository. Return 400 on validation failure.

**Resolution Notes:**
Added `bundleCreateSchema` in `src/utils/validation.ts` using Zod with validation rules: `bundleProductId` (non-empty string), `requiredQuantity` (positive integer ≤ 20), `allowedCategory` (non-empty string), `discountPercentage` (number 0-100). Applied `bundleCreateSchema.safeParse(body)` in the bundles POST handler; on failure returns 400 with the validation errors. The validated data object is now passed to `bundleRepo.create`.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/bundles/route.ts` lines 50–57; `src/utils/validation.ts` `bundleCreateSchema`. Tests: `npx jest __tests__/utils/validation.schemas.test.ts` — 4/4 bundleCreateSchema tests passed.
- **Details:** POST handler validates with `bundleCreateSchema.safeParse`; invalid payloads return 400; only validated data reaches `bundleRepo.create`.
- **Remaining Concerns:** None

---

### [ISSUE-034] `/api/bundles/[id]` PATCH passes unvalidated request body directly to `bundleRepo.update`
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/bundles/[id]/route.ts` (lines 56-66)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-14

**Description:**
Same pattern as ISSUE-031 but for bundles. The PATCH handler does `const body = await request.json(); const result = await bundleRepo.update(id, body);` with no validation. An admin can pass arbitrary JSON fields to the repository.

**Relevant Code:**
```ts
const body = await request.json();
const result = await bundleRepo.update(id, body);
```

**Suggested Solution:**
Add a `bundleUpdateSchema` as a partial version of `bundleCreateSchema` and apply `safeParse` before the update call.

**Resolution Notes:**
Added `bundleUpdateSchema` in `src/utils/validation.ts` as `bundleCreateSchema.partial()`. Applied `bundleUpdateSchema.safeParse(body)` in the bundles PATCH handler; on failure returns 400 with the validation errors. The validated data object is now passed to `bundleRepo.update`.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/bundles/[id]/route.ts` lines 57–64; `src/utils/validation.ts` `bundleUpdateSchema`. Tests: `npx jest __tests__/utils/validation.schemas.test.ts` — 2/2 bundleUpdateSchema tests passed.
- **Details:** PATCH handler validates with `bundleUpdateSchema.safeParse`; invalid payloads return 400; only validated data reaches `bundleRepo.update`.
- **Remaining Concerns:** None

---

### [ISSUE-035] `ProductRepository.findAll` search parameter contains unescaped LIKE wildcards
- **Status:** Resolved
- **Severity:** Low
- **Category:** Security
- **File:** `src/repositories/products/ProductRepository.ts` (lines 68-75)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-14

**Description:**
Same pattern as ISSUE-030 but in the Product repository. The `findAll` method interpolates the raw `params.search` string into a Supabase `.or()` filter with `ilike.%${params.search.toLowerCase()}%`. The `%` and `_` LIKE wildcard characters in user input can manipulate the pattern matching in unintended ways.

**Relevant Code:**
```ts
const searchTerm = `%${params.search.toLowerCase()}%`;
if (params.locale === 'sv') {
  query = query.or(`name_sv.ilike.${searchTerm},description_sv.ilike.${searchTerm}`);
} else {
  query = query.or(`name_en.ilike.${searchTerm},description_en.ilike.${searchTerm}`);
}
```

**Suggested Solution:**
Escape LIKE-special characters (`%` → `\%`, `_` → `\_`) in the search string before constructing the ilike pattern, similar to the fix in ISSUE-030.

**Resolution Notes:**
Added a private `escapeLikePattern` method to `ProductRepository` that escapes `\`, `%`, and `_` characters with a backslash prefix. Applied it to the `search` parameter in the `findAll` method before it's interpolated into the ilike filter.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/repositories/products/ProductRepository.ts` lines 77, 484–486 (`escapeLikePattern`). Tests: `npx jest __tests__/repositories/ProductRepository.test.ts -t "escapes LIKE"` — passed; confirms `%` and `_` escaped in `.or()` filter.
- **Details:** Search terms are escaped for `\`, `%`, and `_` before ilike pattern construction.
- **Remaining Concerns:** None

---

### [ISSUE-036] `/api/orders` PATCH does not validate `status` value against `OrderStatus` type — arbitrary status strings accepted
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Logic Bug
- **File:** `src/app/api/orders/route.ts` (lines 78-113)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-14

**Description:**
The PATCH handler for updating order status accepts any string as `status` from the request body and passes it directly to `orderService.updateOrderStatus(orderId, status as OrderStatus)`. The `as OrderStatus` cast is unsafe — the TypeScript type is erased at runtime. A user could pass an invalid status like `"refunded"` or `"hacked"` that is not in the `OrderStatus` union, which would be written to the database as-is. For non-admin users the handler only allows `cancelled`, but for admins any arbitrary string is accepted.

**Relevant Code:**
```ts
const { status } = body;
// ... (admin check omitted)
const result = await orderService.updateOrderStatus(orderId, status as OrderStatus);
```

**Suggested Solution:**
Validate that `status` is a member of the `OrderStatus` type before proceeding. Define a `VALID_ORDER_STATUSES` array and check `status` against it. Return 400 for invalid values.

**Resolution Notes:**
Added a `VALID_ORDER_STATUSES` constant array in the orders route file containing all valid `OrderStatus` values (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`). The PATCH handler now validates `status` against this array before proceeding. Invalid status values return 400 with a descriptive error message.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/orders/route.ts` lines 11, 121–125. Tests: `npx jest __tests__/api/orders-patch-validation.test.ts` — 2/2 passed (rejects `hacked`, accepts `cancelled`).
- **Details:** PATCH validates `status` against `VALID_ORDER_STATUSES` before any service call; invalid values return 400.
- **Remaining Concerns:** None

---

### [ISSUE-037] `OrderRepository.getOrderStatistics` fetches ALL orders into memory just to count by status
- **Status:** Resolved
- **Resolved:** 2026-06-16
- **Severity:** Low
- **Category:** Performance
- **File:** `src/repositories/orders/OrderRepository.ts` (lines 139-176)
- **Detected:** 2026-06-14

**Description:**
`getOrderStatistics` selects all orders' `status` column and then counts them in JavaScript. For a large order table, this loads thousands of rows into memory just to produce six counts. A SQL `GROUP BY` or Supabase RPC would be far more efficient, transferring only the aggregate result.

**Relevant Code:**
```ts
const { data, error } = await query; // fetches all matching rows
// ...
return {
  success: true,
  data: {
    total: data.length,
    pending: data.filter(o => o.status === 'pending').length,
    // ... 5 more .filter() calls
  },
};
```

**Suggested Solution:**
Use a Supabase RPC function `get_order_status_counts` that performs `SELECT status, COUNT(*) FROM orders GROUP BY STATUS` on the server, or at minimum use PostgREST's aggregate capabilities. For now, restructure to reduce memory by using a reduce-based single-pass count.

**Resolution Notes:**
Added migration `database/migrations/018_order_stats_and_atomic_rate_limit.sql` with `get_order_status_counts(p_customer_id)` RPC (`GROUP BY status`). `OrderRepository.getOrderStatistics` now calls this RPC first; falls back to single-pass `.reduce()` on `select('status')` if the RPC is not yet deployed.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Migration: `018_order_stats_and_atomic_rate_limit.sql` applied in Supabase. Live: `node scripts/verify-migration-018.mjs` — `get_order_status_counts` RPC returns 2 status groups / 12 orders, matches `orders` table count. Code: `OrderRepository.ts` calls `rpc('get_order_status_counts')`. Tests: `npm test` — 484/484 passed.
- **Details:** Production RPC active; only aggregate rows transferred (no full-table status fetch).
- **Remaining Concerns:** None

---

### [ISSUE-038] `/api/shipping` GET and POST endpoints are unauthenticated and lack rate limiting
- **Status:** Resolved
- **Severity:** Low
- **Category:** Security
- **File:** `src/app/api/shipping/route.ts` (entire file)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-14

**Description:**
The `/api/shipping` endpoint (separate from `/api/shipping/calculate`) provides GET actions (`rates`, `countries`, `carrier-services`, `validate-postal-code`) and POST actions (`calculate-shipping`, `calculate-eco-shipping`, `calculate-swedish-shipping`, `validate-address`, `get-holiday-impact`) without any authentication or rate limiting. An attacker can enumerate shipping rates, countries, and carrier services, and abuse the shipping calculation endpoints to exhaust external API quotas. This is the same class of issue as ISSUE-028, which fixed `/api/shipping/calculate` but left `/api/shipping` unprotected.

**Relevant Code:**
```ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    // No auth check, no rate limit
    switch (action) {
      case 'rates': ...
```

**Suggested Solution:**
Add the same Supabase-backed rate limiting pattern (20 req/hour/IP) to the `/api/shipping` GET and POST handlers, keyed by `shipping-api:${ip}`.

**Resolution Notes:**
Added Supabase-backed rate limiting to both GET and POST handlers of `/api/shipping/route.ts` using the same `checkRateLimit` pattern, keyed by `shipping-api:${ip}` with a limit of 20 requests per hour. Rate limit checks run at the top of both handlers before any external API calls.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/shipping/route.ts` lines 15–54, 65–70, 107–112 (`checkRateLimit` on GET and POST, key `shipping-api:${ip}`, 20/hour). Tests: `npx jest __tests__/api/shipping-rate-limit.test.ts` — 3/3 passed (429 on GET/POST when exceeded, 200 when allowed).
- **Details:** Both GET and POST handlers enforce IP-based rate limiting before external API calls. Endpoints remain unauthenticated for checkout guests.
- **Remaining Concerns:** Same read-then-upsert TOCTOU pattern as contact form (non-atomic); acceptable at current scale but not strictly race-safe.

---

### [ISSUE-039] Contact form admin email has XSS — user-supplied `name` and `message` injected into HTML without escaping
- **Status:** Resolved
- **Severity:** High
- **Category:** Security
- **File:** `src/app/api/contact/route.ts` (lines 14–21, 227–232)
- **Detected:** 2026-06-14
- **Resolved:** 2026-06-16

**Description:**
The admin notification email embeds user-supplied `name`, `subject`, and `message` directly into an HTML template. Without HTML entity encoding, values like `<script>alert('xss')</script>` or `<img src=x onerror=alert(1)>` are stored verbatim in admin notification emails. HTML-rendering webmail clients could execute injected content.

**Relevant Code:**
```ts
<div class="field"><span class="label">Name:</span> ${sanitizedData.name}</div>
<div class="field"><span class="label">Message:</span><br>${sanitizedData.message.replace(/\n/g, '<br>')}</div>
```

**Suggested Solution:**
Add an `escapeHtml()` function and apply it to all user-supplied fields in the email template.

**Resolution Notes:**
Added module-local `escapeHtml()` encoding `&`, `<`, `>`, `"`, and `'`. Applied to `name`, `email`, `phone`, `subject`, `message`, and submission `id` in the admin notification email template (`src/app/api/contact/route.ts` lines 227–232).

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/contact/route.ts` lines 14–21, 227–232. Tests: `npx jest __tests__/api/contact-security.test.ts` — XSS payload test passed; admin email HTML contains `&lt;script&gt;` and no raw `<script>` tags.
- **Details:** All user-supplied fields in the admin HTML email template are HTML-escaped before interpolation; newlines in message escaped then converted to `<br>`.
- **Remaining Concerns:** None

---

### [ISSUE-040] `/api/contact` rate limiting has TOCTOU — check and upsert are not atomic
- **Status:** Resolved
- **Resolved:** 2026-06-16
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/contact/route.ts` (lines 29–75)
- **Detected:** 2026-06-14

**Description:**
`checkRateLimit()` reads the rate-limit bucket, filters timestamps, checks the count, then upserts the new timestamp as two separate Supabase calls with no transaction or locking. Concurrent requests from the same IP can both read `count < 5`, both pass, and both upsert — allowing 6+ requests per window.

**Relevant Code:**
```ts
const { data: existing } = await supabase.from('rate_limit_buckets').select('timestamps').eq('id', bucketId).single();
// ... check count ...
await supabase.from('rate_limit_buckets').upsert({ id: bucketId, timestamps: recentTimestamps, ... });
```

**Suggested Solution:**
Use a PostgreSQL RPC function for atomic read-check-append, or a single conditional upsert with server-side locking.

**Resolution Notes:**
Added migration `018_order_stats_and_atomic_rate_limit.sql` with `check_and_record_rate_limit` RPC (`FOR UPDATE` row lock + single upsert). Centralised rate limiting in `src/utils/rateLimit.ts` — tries RPC first, falls back to read-then-upsert if RPC missing. Contact, shipping, and shipping/calculate routes now use the shared helper.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Migration `019_fix_rate_limit_rpc_timestamptz_array.sql` applied via Supabase Management API. Live: `node scripts/verify-migration-018.mjs` — 5/5 passed (atomic rate limit: 2 allowed, 3rd blocked). Code: `src/utils/rateLimit.ts` calls `rpc('check_and_record_rate_limit')`. Tests: `npm test` — 484/484 passed.
- **Details:** Production RPC uses `timestamptz[]` with `FOR UPDATE` row lock; atomic sliding-window rate limiting active for contact/shipping routes.
- **Remaining Concerns:** None

---

### [ISSUE-041] Stripe webhook email templates inject `failureMessage` and `orderId` into HTML without escaping — XSS in admin emails
- **Status:** Resolved
- **Resolved:** 2026-06-16
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/webhooks/stripe/route.ts` (lines 33–40, 205–258, 334–388)
- **Detected:** 2026-06-14

**Description:**
Stripe webhook handlers send admin emails with `${failureMessage}`, `${orderId}`, `${dispute.id}`, `${chargeId}`, and `${reason}` interpolated into HTML. `orderId` comes from `paymentIntent.metadata.orderId` (user-influenced at checkout). Unescaped values can inject HTML/JS into admin notification emails.

**Relevant Code:**
```ts
<li><strong>Dispyt ID:</strong> ${dispute.id}</li>
<li><strong>Anledning:</strong> ${reason}</li>
```

**Suggested Solution:**
Add `escapeHtml()` and apply it to all external-sourced values in webhook email templates.

**Resolution Notes:**
Added `escapeHtml()` (lines 33–40) and applied it in `handlePaymentIntentSucceeded`, `handlePaymentIntentFailed`, and `handleChargeRefunded` admin/customer emails. **2026-06-16 (issue-resolver):** Applied `escapeHtml()` to all external-sourced values in `handleDisputeCreated` (`dispute.id`, `chargeId`, `reason`, `dispute.status`, `evidenceDeadline` in subject, body, and deadline list) and to `charge.id` reference number in `handleChargeRefunded` customer email (`src/app/api/webhooks/stripe/route.ts`).

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `escapeHtml()` at lines 33–40; `handlePaymentIntentFailed` escapes `orderId` and `failureMessage`; `handleChargeRefunded` escapes `orderId` and `charge.id` reference (lines 313–315); `handleDisputeCreated` escapes `dispute.id`, `chargeId`, `reason`, `dispute.status`, and `evidenceDeadline` in subject, body, and deadline list (lines 352–372). Tests: `__tests__/api/stripe-webhook-security.test.ts` — 3/3 passed (payment-failure + dispute escaping expectations). Full suite: `npm test` — 470/470 passed.
- **Details:** All externally sourced values interpolated into webhook email HTML templates are escaped. Stripe Dashboard dispute link retains raw `dispute.id` in URL path only (Stripe-controlled identifier, not HTML body injection).
- **Remaining Concerns:** None

---

### [ISSUE-042] Order totals use client-supplied item prices — price manipulation at checkout
- **Status:** Resolved
- **Severity:** Critical
- **Category:** Security
- **File:** `src/services/orders/OrderService.ts` (lines 39–40, 326–350), `src/app/api/checkout/route.ts` (lines 208–211)
- **Detected:** 2026-06-16

**Description:**
`OrderService.createOrder` calculates subtotal, tax, and payment amount from `item.price` supplied in the request body. `validateOrderStock` only checks availability — it never compares client prices to catalog prices. `transformCartItemsToOrderItems` fetches products for names but still persists `cartItem.price` (client value) into order line items. The checkout route maps missing prices to `0` (`price: item.price || 0`). An attacker can POST `process-payment` with `price: 0.01` (or omit price entirely) and be charged a fraction of the real total while receiving full-value goods.

**Relevant Code:**
```ts
const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// ...
price: cartItem.price,  // client-supplied, not product.price
```

**Suggested Solution:**
Before calculating totals, resolve each `productId` against `ProductRepository` and overwrite `item.price` with the server-side catalog price (reject or 400 if mismatch exceeds a small tolerance). Remove `price` from client-writable fields in `cartItemSchema` for order creation, or make it `.optional()` and always derive server-side. Add integration tests asserting tampered prices are rejected.

**Logging Notes:**
Added `[DEBUG-ISSUE-042] Client price differs from catalog price` warning in `OrderService.transformCartItemsToOrderItems` when `cartItem.price !== product.price`. Search Vercel/server logs for this prefix to quantify exploitation attempts.

**Resolution Notes:**
Added `resolveCatalogPrices()` in `OrderService.createOrder` — fetches catalog prices via `ProductRepository.findByIds`, rejects mismatches > 0.01 SEK with 400-style error, and uses server prices for subtotal/tax/payment and order line items. Removed `price: item.price || 0` fallback from checkout `process-payment` handler.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/services/orders/OrderService.ts` lines 35–48 (`resolveCatalogPrices` before totals), lines 371–403 (mismatch rejection + `product.price` overwrite), line 356 (`transformCartItemsToOrderItems` uses `product.price`). Tests: `npm test -- __tests__/issues/issue-042-050-fixes.test.ts __tests__/services/OrderService.test.ts` — 44/44 passed, including `should reject orders with tampered client prices (ISSUE-042)`.
- **Details:** Tampered client prices (e.g. `0.01`) rejected with `Price mismatch`; totals and line items derived from catalog prices. Checkout `process-payment` still maps omitted price to `0` via `?? 0`, but `resolveCatalogPrices` blocks manipulation before order creation.
- **Remaining Concerns:** None

---

### [ISSUE-043] Checkout admin notification email injects user-supplied fields into HTML without escaping
- **Status:** Resolved
- **Severity:** High
- **Category:** Security
- **File:** `src/app/api/checkout/route.ts` (lines 279–335)
- **Detected:** 2026-06-16

**Description:**
After order creation, `handleProcessPayment` builds an admin notification email with `${customerName}`, `${customerEmail}`, `${body.phone}`, `${item.productName}`, and `${formatAddress(...)}` interpolated directly into HTML. Checkout form fields (`firstName`, `lastName`, `email`, `phone`) are user-controlled. Same vulnerability class as ISSUE-039 (contact form XSS), but this template was missed.

**Relevant Code:**
```ts
<tr><td>Kund:</td><td>${customerName}</td></tr>
<tr><td>E-post:</td><td>${customerEmail}</td></tr>
<td>${item.productName || item.name || 'Produkt'}</td>
```

**Suggested Solution:**
Import or duplicate `escapeHtml()` from `contact/route.ts` and apply to all user-supplied values in the admin order email template (`customerName`, `customerEmail`, `body.phone`, product names, formatted addresses).

**Resolution Notes:**
Created shared `src/utils/escapeHtml.ts` and applied to all user-supplied fields in the checkout admin notification email template (`customerName`, `customerEmail`, `phone`, product names, addresses, shipping label fields).

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/utils/escapeHtml.ts`; `src/app/api/checkout/route.ts` lines 335–392 (`escapeHtml` on `customerName`, `customerEmail`, `phone`, `orderId`, product names, addresses, carrier/tracking). Tests: `__tests__/issues/issue-042-050-fixes.test.ts` — ISSUE-043 source assertions + `escapeHtml` unit test passed (44/44 total).
- **Details:** All user-supplied values in the checkout admin notification HTML template are escaped via shared utility.
- **Remaining Concerns:** None

---

### [ISSUE-044] `/api/cart` accepts client-supplied `cartId` without ownership verification — cart IDOR
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/cart/route.ts` (lines 56–75), `src/services/cart/CartService.ts` (lines 44–89)
- **Detected:** 2026-06-16

**Description:**
`POST /api/cart` reads optional `cartId` from the request body and uses it directly for add/remove/update/clear operations. Neither the route nor `CartService.addItem` (etc.) verifies that the cart belongs to the authenticated user or the `x-session-id` header. Cart IDs are UUIDs (hard to guess), but any leaked ID (API response, log, referrer) lets an attacker modify another user's cart.

**Relevant Code:**
```ts
const { cartId } = body;
let targetCartId = cartId;
if (!targetCartId) {
  // resolve from session — only when cartId omitted
}
result = await cartService.addItem(targetCartId, { ... });
```

**Suggested Solution:**
Always resolve the cart from `session.user.id` or `x-session-id` first. If `cartId` is supplied, verify it matches the resolved cart (or reject with 403). Never trust client-supplied cart IDs for mutation operations.

**Logging Notes:**
Added `[DEBUG-ISSUE-044] Client-supplied cartId used without ownership check` warning in `src/app/api/cart/route.ts` when `cartId` is present in the POST body. Logs `cartId`, `userId`, `hasSessionId`, and `action`.

**Resolution Notes:**
Cart POST now always resolves the cart from `session.user.id` or `x-session-id`. If a client-supplied `cartId` does not match the owned cart, returns 403. Requires session header for all mutations.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/cart/route.ts` lines 56–61 (session required), lines 78–89 (`cartId !== cartResult.data.id` → 403), line 91 (`targetCartId = cartResult.data.id`). Tests: `__tests__/issues/issue-042-050-fixes.test.ts` — ISSUE-044 source assertions passed (44/44 total).
- **Details:** Cart mutations always use session-resolved cart ID; mismatched client-supplied `cartId` rejected with 403 and debug log.
- **Remaining Concerns:** None

---

### [ISSUE-045] Advisor chat endpoints lack authentication and rate limiting — LLM cost abuse
- **Status:** Resolved
- **Severity:** High
- **Category:** Security
- **File:** `src/app/api/advisor/chat/route.ts`, `src/app/api/advisor/chat/stream/route.ts`, `agent/api/main.py` (lines 82–186)
- **Detected:** 2026-06-16

**Description:**
Both Next.js proxy routes (`/api/advisor/chat`, `/api/advisor/chat/stream`) forward requests to the FastAPI agent with no session check and no rate limit. The FastAPI service (`agent/api/main.py`) exposes `/api/advisor/chat` and `/api/advisor/chat/stream` with CORS but no API key or auth middleware. If the agent is reachable (directly or via Next.js proxy), anyone can spam LLM calls and exhaust Anthropic/OpenAI/xAI API quota. ISSUE-016 fixed network-error handling on the non-streaming route but did not add auth or rate limits.

**Relevant Code:**
```ts
// advisor/chat/route.ts — no getServerSession, no rate limit
export async function POST(req: NextRequest) {
  res = await fetch(`${AGENT_URL}/api/advisor/chat`, { ... });
}
```

**Suggested Solution:**
Add Supabase-backed rate limiting (e.g. 10 req/hour/IP) on both Next.js proxy routes. Require a shared secret header (`ADVISOR_API_SECRET`) between Next.js and FastAPI, and reject unauthenticated direct calls to the agent. Optionally require a logged-in session for chat.

**Resolution Notes:**
Added shared `src/utils/rateLimit.ts`. Both Next.js advisor proxy routes rate-limit at 10 req/hour/IP and forward `X-Advisor-Secret` when `ADVISOR_API_SECRET` is set. FastAPI agent (`agent/api/main.py`) rejects requests without matching secret via `verify_advisor_secret` dependency.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/utils/rateLimit.ts`; `src/app/api/advisor/chat/route.ts` lines 12–27 (`checkRateLimit('advisor-chat'`, 10/hr, `X-Advisor-Secret`); `src/app/api/advisor/chat/stream/route.ts` lines 12–34 (same); `agent/api/main.py` lines 64–67, 90, 157 (`verify_advisor_secret` dependency). Tests: `__tests__/issues/issue-042-050-fixes.test.ts` — ISSUE-045 source assertions passed (44/44 total).
- **Details:** Both Next.js proxy routes enforce per-IP rate limiting and forward shared secret to FastAPI. Agent rejects unauthorized direct calls when `ADVISOR_API_SECRET` is configured.
- **Remaining Concerns:** Production deployments should set `ADVISOR_API_SECRET`; when unset, agent auth is permissive (by design). Optional logged-in-session requirement not implemented.

---

### [ISSUE-046] Newsletter subscribe and forgot-password endpoints lack rate limiting — email bombing
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/newsletter/route.ts`, `src/app/api/auth/forgot-password/route.ts`
- **Detected:** 2026-06-16

**Description:**
`POST /api/newsletter` and `POST /api/auth/forgot-password` accept unauthenticated requests with no rate limiting. An attacker can flood arbitrary email addresses with welcome emails (each triggers a Resend API call with a discount code) or password-reset emails. Forgot-password correctly returns a generic success message (no enumeration), but still sends real emails on each request.

**Relevant Code:**
```ts
// forgot-password/route.ts — no rate limit before authService.resetPassword(email)
const result = await authService.resetPassword(email);
```

**Suggested Solution:**
Reuse the Supabase `checkRateLimit` pattern from `contact/route.ts`, keyed by `newsletter:${ip}` (5/hour) and `forgot-password:${ip}` (3/hour). Consider per-email caps in addition to per-IP.

**Resolution Notes:**
Applied shared rate limiter: `newsletter` 5/hour/IP, `forgot-password` 3/hour/IP. Returns 429 when exceeded.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/newsletter/route.ts` lines 15–21 (`checkRateLimit('newsletter', ip, 5)` → 429); `src/app/api/auth/forgot-password/route.ts` line 13 (`checkRateLimit('forgot-password', ip, 3)`). Tests: `__tests__/issues/issue-042-050-fixes.test.ts` — ISSUE-046 source assertions passed (44/44 total).
- **Details:** Per-IP rate limits applied to both endpoints; returns 429 when exceeded.
- **Remaining Concerns:** Per-email caps (optional suggestion) not implemented.

---

### [ISSUE-047] Checkout `create-payment-intent` accepts arbitrary amount without cart validation
- **Status:** Resolved
- **Severity:** High
- **Category:** Security
- **File:** `src/app/api/checkout/route.ts` (lines 155–186)
- **Detected:** 2026-06-16

**Description:**
The `create-payment-intent` checkout action creates a Stripe PaymentIntent for any positive `amount` from the request body. The amount is not validated against the user's cart total or catalog prices. Combined with ISSUE-042, a client could create a PaymentIntent for 1 SEK while submitting an order with different items, or create intents for probing Stripe without going through order validation.

**Relevant Code:**
```ts
const { amount, currency = 'SEK' } = body;
if (!amount || amount <= 0) { return 400; }
const result = await paymentService.createPaymentIntent(amount, currency);
```

**Suggested Solution:**
Derive the payment amount server-side from the cart (resolve cart by session, validate items, compute total). Reject client-supplied amounts, or verify they match the server-computed total within 1 öre tolerance.

**Resolution Notes:**
`handleCreatePaymentIntent` now syncs cart prices, computes subtotal + tax + shipping server-side, and creates PaymentIntent from `serverAmount`. If client sends `amount`, it must match within 1 öre or returns 400.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/checkout/route.ts` lines 164–223 (`syncCartPrices`, `getCartSummary`, `serverAmount` from cart+tax+shipping; client `amount` mismatch → 400 `Payment amount does not match cart total`). Tests: `__tests__/issues/issue-042-050-fixes.test.ts` — ISSUE-047 source assertions passed (44/44 total).
- **Details:** PaymentIntent amount derived server-side from synced cart; client-supplied amounts validated within 1 öre tolerance.
- **Remaining Concerns:** None

---

### [ISSUE-048] Test endpoints ignore `feature_flags` DB toggle — only check env vars
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/test/checkout/route.ts` (line 28), `src/app/api/test/orders/route.ts` (line 16), `src/app/api/test/shipment/simulate/route.ts` (line 29)
- **Detected:** 2026-06-16

**Description:**
`/api/test/config` persists the test-mode toggle in the `feature_flags` Supabase table via `getTestModeStatus()`. However, the actual test endpoints (`checkout`, `orders`, `shipment/simulate`) only gate on `NODE_ENV === 'production' && ENABLE_TEST_ENDPOINTS !== 'true'`. An admin who disables test mode via the config API (DB flag = false) still has endpoints active if `ENABLE_TEST_ENDPOINTS=true` is set in the deployment environment. Conversely, enabling via DB alone does not activate endpoints in production without the env var.

**Relevant Code:**
```ts
// test/checkout/route.ts
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
  return 403;
}
// Does NOT call getTestModeStatus()
```

**Suggested Solution:**
Extract `getTestModeStatus()` into a shared module and call it from every test endpoint guard. Env var `ENABLE_TEST_ENDPOINTS` can remain as an override, but the DB flag must be the canonical production toggle.

**Resolution Notes:**
Extracted `getTestModeStatus()` to `src/lib/testMode.ts`. All test endpoints (`checkout`, `orders`, `shipment/simulate`) now use it instead of env-only checks.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/lib/testMode.ts` lines 5–19 (DB `feature_flags` + `ENABLE_TEST_ENDPOINTS` override); `src/app/api/test/checkout/route.ts`, `orders/route.ts`, `shipment/simulate/route.ts` all call `getTestModeStatus()`. Tests: `__tests__/issues/issue-042-050-fixes.test.ts` — ISSUE-048 source assertions passed (44/44 total).
- **Details:** Test endpoint guards unified on shared `getTestModeStatus()`; DB flag is canonical toggle with env override.
- **Remaining Concerns:** None

---

### [ISSUE-049] `EmailService` HTML templates inject unescaped `orderId` and `trackingNumber`
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/services/email/EmailService.ts` (lines 191–192, 524–527)
- **Detected:** 2026-06-16

**Description:**
`sendOrderConfirmation` and `sendOrderStatusUpdate` escape `customerName` and `shippingAddress` via `this.escapeHtml()` but interpolate `orderData.orderId` and `orderData.trackingNumber` raw into HTML. `orderId` is typically server-generated (lower risk), but `trackingNumber` may originate from carrier APIs or user-influenced metadata. Inconsistent escaping leaves a residual XSS vector in customer-facing emails if a malicious tracking value is stored.

**Relevant Code:**
```ts
<p><strong>Order Number:</strong> ${orderData.orderId}</p>
${orderData.trackingNumber ? `<p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
```

**Suggested Solution:**
Apply `this.escapeHtml()` to `orderData.orderId` and `orderData.trackingNumber` in all HTML email templates. Audit remaining `${...}` interpolations in `EmailService.ts` for the same pattern.

**Resolution Notes:**
Applied `this.escapeHtml()` to `orderId`, `trackingNumber`, and `statusText` in `sendOrderConfirmation` and `sendOrderStatusUpdate` HTML templates.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/services/email/EmailService.ts` lines 191–192 (`this.escapeHtml(orderData.orderId)`, `this.escapeHtml(orderData.trackingNumber)` in confirmation); lines 524–527 (same in status update + `statusText`). Tests: `__tests__/issues/issue-042-050-fixes.test.ts` — ISSUE-049 source assertions passed (44/44 total).
- **Details:** `orderId`, `trackingNumber`, and `statusText` escaped in customer-facing order email HTML templates.
- **Remaining Concerns:** None

---

### [ISSUE-050] `/api/advisor/chat/stream` missing try/catch on JSON body parse
- **Status:** Resolved
- **Severity:** Low
- **Category:** Bug
- **File:** `src/app/api/advisor/chat/stream/route.ts` (line 8)
- **Detected:** 2026-06-16

**Description:**
The streaming advisor proxy calls `await req.json()` without a try/catch. Invalid JSON throws an unhandled exception and returns a generic 500. The non-streaming route (`advisor/chat/route.ts`) was fixed in ISSUE-016 with a try/catch returning 400, but the stream route was not updated — inconsistent error handling between the two proxies.

**Relevant Code:**
```ts
export async function POST(req: NextRequest) {
  const body = await req.json();  // no try/catch
```

**Suggested Solution:**
Wrap `req.json()` in try/catch and return 400 `{ error: 'Invalid request body' }` on parse failure, matching the non-streaming route.

**Resolution Notes:**
Streaming advisor route now wraps `req.json()` in try/catch and returns SSE error with status 400 on invalid JSON, matching the non-streaming route.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Code: `src/app/api/advisor/chat/stream/route.ts` lines 21–28 (`req.json()` in try/catch → SSE 400 `Invalid request body`). Tests: `__tests__/issues/issue-042-050-fixes.test.ts` — ISSUE-045/050 stream route assertions passed (44/44 total).
- **Details:** Invalid JSON on streaming advisor proxy returns 400 SSE error instead of unhandled 500.
- **Remaining Concerns:** None

---

### [ISSUE-051] `/orders/track` page broken — tracking API now requires `email` param it never sends (regression from ISSUE-022)
- **Status:** Resolved
- **Severity:** High
- **Category:** Bug
- **File:** `src/app/orders/track/page.tsx` (line 43), cross-referenced with `src/app/api/orders/route.ts` (lines 19-29)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
The ISSUE-022 fix (2026-05-18) changed `/api/orders?action=track-by-order` to require **both** `orderNumber` and `email` query params, returning 400 when either is missing. The resolution notes explicitly flagged the follow-up: "callers (e.g. the track-order page) will need to start passing `email` as a query parameter." That follow-up never happened. `src/app/orders/track/page.tsx` still sends only `orderNumber`, so every tracking attempt on this page now fails with a 400. The page's form has a single input (order number) — there is no email field to collect the second factor.

**Relevant Code:**
```ts
// src/app/orders/track/page.tsx line 43
const response = await fetch(`/api/orders?action=track-by-order&orderNumber=${encodeURIComponent(orderNumber.trim())}`);
```

**Suggested Solution:**
Add an email input field to the form (state, validation, label in both sv/en via the existing locale pattern) and include it in the request: `&email=${encodeURIComponent(email.trim())}`. Show the API's 404 as a generic "No order found matching that order number and email" message so the existence-hiding behavior of the API is preserved in the UI copy. Consider consolidating with `/track-order` first (see ISSUE-054) so the fix is only made once.

**Resolution Notes:**
Resolved via the ISSUE-054 consolidation: `/orders/track` was deleted and `/track-order` (now `src/app/track-order/TrackOrderClient.tsx`) is the single tracking page. It has an email input shown in order-number mode and calls `/api/orders/track?orderId=...&email=...`; tracking-number mode needs no email. A 404 surfaces as a generic "no order found with that order number and email" message, preserving existence-hiding. Dark-mode classes were also added to the page (it was light-only, same class of problem as ISSUE-010).

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `src/app/orders/track/page.tsx` absent; `TrackOrderClient.tsx` sends `orderId`+`email`; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-051); cross-check `__tests__/issues/issue-021-030-verification.test.ts` (ISSUE-022).
- **Details:** Re-verified 2026-06-16. ISSUE-022 second-factor guard lives on `/api/orders/track`; old `/orders/track` page and `track-by-order` action are gone.
- **Remaining Concerns:** None

---

### [ISSUE-052] `/api/orders/track` returns hardcoded mock tracking data — real implementation commented out
- **Status:** Resolved
- **Severity:** High
- **Category:** Bug
- **File:** `src/app/api/orders/track/route.ts` (lines 5-66 mock data, 92-193 commented-out real implementation, 195-213 mock lookup)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
The endpoint serves a fabricated "ORD-001" order — fake Stockholm shipping address, fake PostNord tracking number `PN1234567890SE`, fake four-step tracking history — to any caller. The real Supabase implementation exists but is fenced in a `/* */` block (lines 92-193). The `/track-order` page consumes this endpoint, so users tracking real orders either get a 404 (their real order ID isn't `ORD-001`) or, if they happen to query the mock keys, see fiction. This is the same class of problem ISSUE-006 fixed for the customers routes; this route was missed. Secondary concern: the commented-out implementation contains an injection-adjacent pattern — `.or(\`id.eq.${orderId},orderNumber.eq.${orderId}\`)` interpolates user input into a PostgREST filter string; when reviving the code, this must not be restored as-is.

**Relevant Code:**
```ts
const mockOrderTracking = {
  'ORD-001': {
    orderId: 'ord-abc123',
    // ... fake address, fake tracking history
  },
};
// ...
if (orderKey && mockOrderTracking[orderKey as keyof typeof mockOrderTracking]) {
  return NextResponse.json({ success: true, data: mockOrderTracking[orderKey] });
}
```

**Suggested Solution:**
Rewire to the real data layer following the ISSUE-006 pattern: `export const dynamic = 'force-dynamic'`, `import '@/config/di-init'`, resolve `IOrderRepository` (and a tracking-events lookup) via the DI container using the server client. Do **not** reuse the commented-out `.or(...)` interpolation — use two separate `.eq()` lookups (`id`, then `orderNumber`) or sanitize via parameterized filters. Keep the existing auth split (orderId lookups require session and must verify the order belongs to the session user; trackingNumber lookups can stay public but should return a reduced field set — status, carrier, trackingNumber, history — without `total` and full `shippingAddress`, mirroring the ISSUE-022 data-minimization). Delete the mock objects.

**Resolution Notes:**
`src/app/api/orders/track/route.ts` fully rewritten against the DI container (`IOrderService`, `ICustomerRepository`), with `force-dynamic` + `di-init`. Two modes: `?trackingNumber=X` (public — a tracking number is itself a bearer secret) uses `orderService.trackOrder()` which returns the order plus real shipment history from the shipping service; `?orderId=X&email=Y` uses `getOrder()` + case-normalized email verification against the order's customer, returning 404 on any mismatch (the ISSUE-022 pattern, relocated here). Both modes return the data-minimized shape (`orderId`, `status`, `trackingNumber`, `carrier`, `estimatedDelivery`, `trackingHistory`) — no totals, items, or addresses. All mock objects and the injection-prone `.or(...)` block are gone. The now-redundant `track-by-order` action and `handleTrackByOrderNumber` were removed from `/api/orders/route.ts` (along with two leftover `[issue-tracker]` diagnostic logs that ISSUE-003's cleanup missed).

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `src/app/api/orders/track/route.ts` — DI wiring, `orderService.trackOrder`/`getOrder`, no `mockOrderTracking`, no `.or(` interpolation; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-052).
- **Details:** Re-verified 2026-06-16. Endpoint is production-ready against real services; mock block fully removed.
- **Remaining Concerns:** None

---

### [ISSUE-053] `/api/reviews` still returns mock reviews — ISSUE-006 scope was only partially delivered
- **Status:** Resolved
- **Severity:** High
- **Category:** Bug
- **File:** `src/app/api/reviews/route.ts` (lines 5-58 mock data, 60, 103-104, 164)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
ISSUE-006's description explicitly named `src/app/api/reviews/route.ts` as having the same mock-data problem as the customers routes, and its suggested solution said "Apply the same fix to `customers/[id]/route.ts` and `reviews/route.ts`." The resolution notes and verification record only cover the two customers routes. The reviews route still contains `mockReviews`, `// TODO: Fetch from database` (line 60), and `// TODO: Implement in production` (line 164). Every product page on the site displays fabricated reviews and ratings — a trust/legal problem for a shop (fake reviews are regulated in the EU under the Omnibus Directive), and review POSTs presumably no-op. The companion route `src/app/api/reviews/[id]/helpful/route.ts` has the same condition (`// TODO: Implement in production` at line 16 — the helpful-vote is never persisted).

**Relevant Code:**
```ts
// Mock reviews data for demonstration
const mockReviews = [ /* ... */ ];
// ...
// TODO: Fetch from database
// For now, return mock data filtered by productId
const filteredReviews = mockReviews
```

**Suggested Solution:**
Create a `reviews` table in Supabase (columns: id, product_id, customer_id, rating, title, body, created_at, verified_purchase, helpful_count) with RLS allowing public SELECT of approved rows. Add a `ReviewRepository` following the existing repository pattern, register it in the DI container, and rewire GET (list by productId, paginated) and POST (authenticated, one review per customer per product, ideally gated on a delivered order). Apply the same treatment to the `helpful` sub-route. If real reviews are not wanted yet, the honest interim fix is to return an empty list and hide the reviews UI rather than ship fabricated ones.

**Resolution Notes:**
Applied migration `create_reviews_tables`: `reviews` table (UNIQUE(product_id, customer_id), rating CHECK 1-5, `status` defaulting to 'approved' with a moderation-ready CHECK, `verified_purchase`, `helpful_count`), `review_helpful_votes` (composite PK = one vote per customer per review), and an atomic `increment_review_helpful()` SECURITY DEFINER function revoked from anon/authenticated. Both tables have RLS enabled with no policies — all access via the service-role client, matching the ISSUE-002 customers pattern. New `src/repositories/reviews/ReviewRepository.ts` (follows WishlistRepository): `findByProductId` (approved only, joins customer names rendered as "FirstName L." to avoid exposing surnames), `create` (computes `verified_purchase` from a delivered order containing the product; maps 23505 to "already reviewed"), `markHelpful` (vote insert + RPC increment). Registered as `TOKENS.IReviewRepository` in the DI container. Both routes rewired (`force-dynamic` + `di-init`); the `helpful` route now requires a session, and `ProductReviews.tsx` surfaces the 401/duplicate-vote errors with Swedish toasts instead of silently ignoring them. Note: reviews are auto-approved (no moderation UI exists); the `status` column supports adding moderation later.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `src/app/api/reviews/route.ts`, `src/app/api/reviews/[id]/helpful/route.ts`, `src/repositories/reviews/ReviewRepository.ts` — no `mockReviews`, uses `SupabaseServerClient`, pinned FK embed; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-053).
- **Details:** Re-verified 2026-06-16. GET/POST/helpful routes wired to `ReviewRepository`; helpful vote requires session (401).
- **Remaining Concerns:** `create_reviews_tables` migration not checked into `database/migrations/` (applied directly to Supabase); live DB schema not re-probed in this pass. Reviews remain auto-approved; seed reviews still present per ARCHITECTURE_NOTES §3.

---

### [ISSUE-054] Two parallel order-tracking pages (`/track-order` and `/orders/track`) hitting two different APIs
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Other
- **File:** `src/app/track-order/page.tsx`, `src/app/orders/track/page.tsx`
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
The site has two distinct customer-facing tracking pages: `/track-order` (calls `/api/orders/track`, the mock endpoint from ISSUE-052, supports orderId or trackingNumber) and `/orders/track` (calls `/api/orders?action=track-by-order`, currently broken per ISSUE-051). Two entry points for the same task means double maintenance (this is exactly how ISSUE-051 happened — the fix landed against one path and missed the caller of the other), inconsistent UX, and duplicate-content/crawl-confusion for SEO once these pages are indexable.

**Relevant Code:**
```ts
// track-order/page.tsx line 69-70
? `/api/orders/track?orderId=${encodeURIComponent(searchValue)}`
: `/api/orders/track?trackingNumber=${encodeURIComponent(searchValue)}`;
// orders/track/page.tsx line 43
fetch(`/api/orders?action=track-by-order&orderNumber=${...}`);
```

**Suggested Solution:**
Pick one canonical page (suggest `/track-order` — it's the more complete UI) and one canonical API (suggest a single `/api/orders/track` once ISSUE-052 rewires it to real data with the ISSUE-022 two-factor guard). Delete the other page and add a `permanent: true` redirect in `next.config.ts` `redirects()` (`/orders/track` → `/track-order`) so old links keep working. Update the Footer/Header/account links to point at the canonical page.

**Resolution Notes:**
`/orders/track` deleted; permanent redirect `/orders/track` → `/track-order` added in `next.config.ts` (query params pass through). All six internal links updated: `Footer.tsx`, `account/orders/page.tsx`, `account/orders/[id]/page.tsx`, `OrderCard.tsx` (also gained `encodeURIComponent`), and two links in `shipping-policy`. `/track-order` now reads the `?tracking=` query param (which the account-page links pass but the old page silently ignored) and auto-searches — the client component is wrapped in a Suspense boundary as `useSearchParams` requires.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `next.config.ts` permanent redirect; internal links grep to `/track-order` only; `TrackOrderClient.tsx` handles `?tracking=`; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-054).
- **Details:** Re-verified 2026-06-16. Single canonical page and API; old page file absent.
- **Remaining Concerns:** None

---

### [ISSUE-055] CORS `Access-Control-Allow-Origin` falls back to `*` for all API routes when `NEXT_PUBLIC_APP_URL` is unset
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `next.config.ts` (headers() — `/api/(.*)` block)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
The static header block sets `Access-Control-Allow-Origin: process.env.NEXT_PUBLIC_APP_URL || '*'` on every `/api/*` response, alongside permissive `Allow-Methods` (including DELETE/PATCH) and `Allow-Headers: ... Authorization`. If `NEXT_PUBLIC_APP_URL` is ever missing in a deployment (new environment, renamed var, preview deploy), every API endpoint becomes callable cross-origin from any website. This is the same fail-open shape as ISSUE-001. Mitigating factor: `Access-Control-Allow-Credentials` is not set, so browsers won't attach the session cookie to cross-origin requests — but unauthenticated endpoints (contact, newsletter, track-by-order, products) become open to cross-origin scripted abuse, and the wildcard masks misconfiguration instead of surfacing it.

**Relevant Code:**
```ts
{
  key: 'Access-Control-Allow-Origin',
  value: process.env.NEXT_PUBLIC_APP_URL || '*'
},
```

**Suggested Solution:**
Fail closed: when `NEXT_PUBLIC_APP_URL` is unset, emit no ACAO header at all (filter the header entry out of the array) rather than `*`. Since same-origin requests don't need CORS headers, the simplest correct version is to drop the wildcard fallback entirely and document that cross-origin API consumers (if any exist) require the env var. Optionally log/throw at build time if the var is absent in production builds.

**Resolution Notes:**
`next.config.ts` `headers()` now builds the `/api/(.*)` CORS block conditionally: when `NEXT_PUBLIC_APP_URL` is set it is used verbatim as the allowed origin; when unset, no CORS headers are emitted at all (fail closed — same-origin requests don't need them). The `'*'` fallback is gone.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Automated Test
- **Verdict:** Resolved
- **Evidence:** `next.config.ts` — conditional `apiCorsBlock`, no `|| '*'` fallback; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-055).
- **Details:** Re-verified 2026-06-16. Fail-closed CORS behavior confirmed in config.
- **Remaining Concerns:** None

---

### [ISSUE-056] `removeConsole` strips the `console.warn` observability added by earlier fixes in production
- **Status:** Resolved
- **Severity:** Low
- **Category:** Other
- **File:** `next.config.ts` (compiler.removeConsole), cross-referenced with `src/lib/auth.ts` (ISSUE-007 fix)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
`compiler.removeConsole` is configured with `exclude: ['error']`, so `console.warn` and `console.log` calls are compiled out of production builds. ISSUE-007's fix specifically added a `console.warn` for the "adminData is null" case in `src/lib/auth.ts` so admin-lookup failures would be "observable in Vercel logs" — that warn is silently removed in production, partially undoing the fix. Any other `console.warn`-based ops signals (e.g. rate-limiter fail-open warnings) are affected the same way.

**Relevant Code:**
```ts
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error']
  } : false,
},
```

**Suggested Solution:**
Change to `exclude: ['error', 'warn']`. Optionally audit for load-bearing `console.log` calls that serve as ops signals (e.g. the DI init success log from ISSUE-003/004) and either promote them to `warn`/`error` or accept their removal deliberately.

**Resolution Notes:**
`compiler.removeConsole.exclude` changed to `['error', 'warn']` in `next.config.ts`, with a comment explaining which fixes depend on `console.warn` surviving production builds.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Automated Test
- **Verdict:** Resolved
- **Evidence:** `next.config.ts` `exclude: ['error', 'warn']`; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-056).
- **Details:** Re-verified 2026-06-16. Production builds retain `console.warn` for ops signals (ISSUE-007, rate-limiter, layout env warning).
- **Remaining Concerns:** None

---

### [ISSUE-057] `_extract_json` brace counting breaks on braces inside JSON string values
- **Status:** Resolved
- **Severity:** Low
- **Category:** Bug
- **File:** `agent/agent/nodes.py` (`_extract_json`, lines 159-186 — currently uncommitted working-tree change)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
The new `_extract_json` helper finds the outermost JSON object by counting `{`/`}` characters. It does not track whether the scanner is inside a string literal, so a model reply like `{"reply": "try {lavender} oil", ...}` hits depth 0 at the `}` inside the string, truncates there, and `json.loads` raises. The except clause catches it and degrades gracefully (raw reply is surfaced, `gathered_enough` resets to false), so the failure mode is a wasted turn rather than a crash — but curly braces in conversational replies are plausible (emoji shortcodes, code-ish answers, Swedish quoting habits aside), and the whole point of the helper is robustness for small models.

**Relevant Code:**
```python
depth = 0
for i, ch in enumerate(text[start:], start):
    if ch == "{":
        depth += 1
    elif ch == "}":
        depth -= 1
        if depth == 0:
            return json.loads(text[start:i + 1])
```

**Suggested Solution:**
Replace the manual scan with `json.JSONDecoder().raw_decode(text, start)` — it parses one complete JSON value starting at `start` and correctly handles strings/escapes, returning `(obj, end_index)`. Keep the fence-stripping preamble and the `text.find("{")` to locate `start`. This is both shorter and correct:
```python
obj, _ = json.JSONDecoder().raw_decode(text[start:])
```
Wrap in the same try/except; `json.JSONDecodeError` is already caught by the caller.

**Resolution Notes:**
Replaced the manual depth counter in `agent/agent/nodes.py` `_extract_json` with `json.JSONDecoder().raw_decode(text[start:])`, plus an `isinstance(obj, dict)` guard (raises `ValueError`, which the caller already catches). Fence-stripping preamble unchanged. Verified with `python -m py_compile`.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `agent/agent/nodes.py` uses `JSONDecoder().raw_decode`; `agent/__tests__/test_extract_json.py` (4 tests, braces-in-strings + fence stripping); `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-057 source check).
- **Details:** Re-verified 2026-06-16. Parser correctly handles `{`/`}` inside JSON string values; non-object JSON rejected.
- **Remaining Concerns:** None

---

### [ISSUE-058] All 35 pages are client components — no per-page metadata, content invisible to crawlers
- **Status:** Resolved
- **Severity:** High
- **Category:** Other
- **File:** every `src/app/**/page.tsx` (all carry `'use client'`); only `src/app/layout.tsx` exports metadata
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-11 (completed; first pass 2026-06-10)

**Description:**
Every page in the app — including the homepage, `/products`, and `/products/[id]` — is a `'use client'` component, which cannot export `metadata` or `generateMetadata`. The only metadata on the entire site is the root layout's, so every URL shares the identical title ("Fortune Essence - Premium Essential Oils") and description. Worse, product pages fetch their content client-side (`fetch('/api/products/${productId}')` in a `useEffect`), so the server-rendered HTML is a loading spinner: social-preview bots (WhatsApp, Facebook, Slack, iMessage) see nothing, and search engines see thin, duplicate pages. For an e-commerce site this forfeits essentially all long-tail product search traffic.

**Relevant Code:**
```tsx
// src/app/products/[id]/page.tsx
'use client';
// ...
const productResponse = await fetch(`/api/products/${productId}`);  // client-side, post-hydration
```

**Suggested Solution:**
Highest-ROI conversion order: `/products/[id]`, `/products`, `/` (homepage), then the static content pages (about, faq, how-to-use, contact, shipping-policy, terms, privacy, refund).
Pattern per page: make `page.tsx` an async Server Component that fetches data directly via the service/repository layer (not via HTTP self-fetch), passes it as props to a `'use client'` child component holding the current interactive JSX (cart, wishlist, toasts, locale switching). Add `generateMetadata({ params })` on `/products/[id]` producing per-product `title`, `description`, `openGraph.images` (product photo) from the same fetch (use React `cache()` to dedupe). Static pages just need a `export const metadata` with unique title/description — for those, the quickest fix is a thin server `page.tsx` exporting metadata and rendering the existing client component moved to a sibling file. Also set `title.template: '%s | Fortune Essence'` in the root layout so child titles compose. Admin/account/checkout/auth pages don't need conversion — instead give them `robots: { index: false }` via a small layout-level metadata export (see ISSUE-059 for the robots.txt complement).

**Resolution Notes:**
**Done:** (1) `/products/[id]` is now an async Server Component (`force-dynamic` + `di-init`) that fetches the product via `IProductService.getProductWithLocalization` (deduped with React `cache()`), exports `generateMetadata` with per-product title/description/canonical/OG image, calls `notFound()` for genuinely missing products, and passes `initialProduct` to the renamed `ProductDetailClient.tsx` — which skips its own product fetch when server data is present (bundle config and related products still load client-side), so product content is in the server HTML. On infrastructure failure it degrades to the old client-fetch path instead of 404ing. (2) Ten more pages converted to thin server wrappers with unique Swedish metadata + canonicals, client code moved to sibling `*Client.tsx` files: `/products`, `/about`, `/faq`, `/how-to-use`, `/contact`, `/shipping-policy`, `/terms`, `/privacy`, `/refund`, `/track-order`. (3) Root layout has `title.template: '%s | Fortune Essence'`. (4) `tsconfig.json` now excludes the untracked `sveltekit/` directory, which was failing `next build` type-checking before any of this could ship.
**Completed 2026-06-11 (user sign-off for the full fix):** (5) Homepage split into a server `page.tsx` (locale-aware `generateMetadata`, server-side featured-products fetch via `IProductService.getFeaturedProducts()`) and `HomeClient.tsx`; if the server fetch fails, the client falls back to `/api/products/featured`, so the page degrades instead of emptying. (6) All nine auth/account pages (`auth/signin|signup|forgot-password|reset-password`, `account`, `account/settings|privacy|orders|orders/[id]`) converted to thin server wrappers exporting Swedish titles + `robots: { index: false, follow: false }`; `reset-password` wrapped in `<Suspense>` (its client reads `useSearchParams`); `OrderDetailClient` was rename-safe because it uses `useParams()`. Conversion conventions documented in `ARCHITECTURE_NOTES.md` §2 for future agents (per user request).

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Public/marketing `page.tsx` files export `generateMetadata` without `'use client'`; `src/app/products/[id]/page.tsx` server-fetches via `getProductWithLocalization`; only `admin/`, `checkout/`, `wishlist/`, `test-orders/` remain client `page.tsx`; `layout.tsx` has `title.template`; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-058).
- **Details:** Re-verified 2026-06-16. Intentional client-only pages limited to admin/checkout/wishlist/test per resolution scope.
- **Remaining Concerns:** None

---

### [ISSUE-059] No sitemap and no robots.txt
- **Status:** Resolved
- **Severity:** High
- **Category:** Other
- **File:** `src/app/sitemap.ts` (missing), `src/app/robots.ts` (missing), `public/` (contains neither)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
There is no sitemap.xml or robots.txt anywhere — no `src/app/sitemap.ts`/`robots.ts` (App Router conventions) and no static files in `public/`. Crawlers have no product URL inventory (especially harmful while product pages are client-rendered, ISSUE-058) and no crawl directives, so `/admin`, `/account`, `/checkout`, `/api`, and `/auth` are all crawlable. The middleware matcher already excludes `favicon.ico` but the file doesn't exist either (see ISSUE-062).

**Relevant Code:**
```text
(absent) src/app/sitemap.ts
(absent) src/app/robots.ts
public/: file.svg globe.svg next.svg vercel.svg window.svg favicon.jpg
```

**Suggested Solution:**
Add `src/app/robots.ts` returning `{ rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/checkout', '/api/', '/auth', '/wishlist', '/test-orders', '/orders/track'] }], sitemap: `${appUrl}/sitemap.xml` }`. Add `src/app/sitemap.ts` that queries the products table server-side (via the repository/server client) and returns the static marketing pages plus one entry per product (`/products/${id}`, `lastModified` from `updated_at`). Both files read `NEXT_PUBLIC_APP_URL` — fail loudly (throw) if it's unset at build/runtime rather than emitting relative URLs.

**Resolution Notes:**
`src/app/robots.ts` added — disallows `/admin`, `/account`, `/api/`, `/auth`, `/checkout`, `/wishlist`, `/test-orders`, and `/shipping-labels/` (ISSUE-064 band-aid), and points at the sitemap. `src/app/sitemap.ts` added — 11 static pages plus one entry per active product (`lastModified` from `updated_at`) queried via `getSupabaseServer()`, with `revalidate = 3600` so new products appear hourly without a redeploy; falls back to static pages if the DB is unreachable. Deviation from the suggestion: instead of throwing when `NEXT_PUBLIC_APP_URL` is unset, both follow the codebase's existing `config.app.url` convention (localhost fallback) and the root layout logs a `console.warn` — failing the build over it seemed disproportionate given Vercel sets it. Verified present in the build route manifest.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `src/app/robots.ts`, `src/app/sitemap.ts` present with disallow rules + product enumeration; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-059).
- **Details:** Re-verified 2026-06-16. Sitemap includes all 11 static routes (incl. bilingual legal pages + track-order) with `languageAlternates`.
- **Remaining Concerns:** Live sitemap/robots HTTP output not fetched in this pass (no running server). `NEXT_PUBLIC_APP_URL` still falls back to localhost rather than failing the build (accepted deviation).

---

### [ISSUE-060] No structured data (JSON-LD) anywhere — forfeits all rich results
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Other
- **File:** site-wide (zero matches for `application/ld+json` in `src/`)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-11 (completed; first pass 2026-06-10)

**Description:**
No page emits any schema.org structured data. For e-commerce this means no product rich results (price, availability, star ratings in SERPs), no merchant listing eligibility, no FAQ rich results, no sitelinks search box hints. Blocked-by: product JSON-LD requires server-rendered product pages (ISSUE-058) to be useful, and `AggregateRating` must wait until reviews are real (ISSUE-053) — emitting ratings derived from mock reviews would violate Google's structured-data guidelines and EU fake-review rules.

**Relevant Code:**
```text
grep 'application/ld+json' src/ → no matches
```

**Suggested Solution:**
After ISSUE-058 lands: add a small `JsonLd` server component that renders `<script type="application/ld+json" nonce={nonce}>` — note the CSP from `src/middleware.ts` is nonce-based, so the nonce must be threaded in (the root layout already reads `x-nonce`; alternatively add `script-src-elem`-safe hashes, but nonce is simpler here). Emit: `Organization` + `WebSite` in the root layout; `Product` with nested `Offer` (price in SEK, `priceCurrency: 'SEK'`, availability from stock status) on `/products/[id]`; `BreadcrumbList` on products pages; `FAQPage` on `/faq`. Add `AggregateRating`/`Review` only once ISSUE-053 is resolved with real data. Validate with Google's Rich Results Test.

**Resolution Notes:**
**Done:** `Organization` + `WebSite` JSON-LD in the root layout `<head>`, and `Product` + nested `Offer` (price, `priceCurrency: 'SEK'`, availability from stock, brand, sku, images) on `/products/[id]` — all rendered as nonce-carrying inline scripts compatible with the middleware CSP.
**Completed 2026-06-11 (user sign-off, incl. treating seed reviews as real):** (1) FAQ content extracted to `src/data/faq.ts` (locale-keyed sv+en, shared by the client accordion and the server page); `/faq` emits `FAQPage` JSON-LD via `buildFaqJsonLd(locale)` — and FaqClient gained the `useLocale` wiring and dark-mode classes it had been missing. (2) `BreadcrumbList` on `/products` (Hem › Produkter) and `/products/[id]` (… › product name), locale-aware. (3) `AggregateRating` on the Product JSON-LD from `ReviewRepository.getRatingStats()` (approved reviews only; omitted entirely at zero reviews to avoid empty-markup penalties). The former mock reviews were seeded into the `reviews` table as real rows (per user decision — see ARCHITECTURE_NOTES §3 for the seed-account cleanup plan), and the third review was adapted to the Duo Pack since no peppermint product exists. Verified live: `/api/reviews` returns the seeded reviews ("Emma L." display names via the FK-pinned embed) and the Lavendel page emits `ratingValue 4.5, reviewCount 2`. Finding ISSUE-068 (missing service_role grants) was discovered during this verification. Validate with Google's Rich Results Test after deploy.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `application/ld+json` in `layout.tsx`, `products/[id]/page.tsx`, `products/page.tsx`, `faq/page.tsx`; `buildFaqJsonLd` in `src/data/faq.ts`; `AggregateRating` from `getRatingStats`; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-060).
- **Details:** Re-verified 2026-06-16. Organization, WebSite, Product+Offer, FAQPage, BreadcrumbList, and conditional AggregateRating all present in source.
- **Remaining Concerns:** Google Rich Results Test not run in this pass. Seed reviews still power AggregateRating until organic reviews replace them.

---

### [ISSUE-061] Bilingual content is invisible to search engines — locale is client state, not URLs; `lang` attr hardcoded; no hreflang
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Other
- **File:** `src/contexts/LocaleContext.tsx`, `src/app/layout.tsx` (line 73), site-wide (no `alternates`/`hreflang` anywhere)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-11 (URL-based /en locale; first lang-attr pass 2026-06-10)

**Description:**
The site renders sv/en by toggling client-side state in `LocaleContext` — both languages live at the same URL. Consequences: search engines can only ever index the Swedish default (the English content has no URL to rank); `<html lang="sv">` is hardcoded and becomes wrong the moment a user (or crawler executing JS) lands in English; there are zero `hreflang`/`alternates` annotations. This is a structural decision, not a bug — but it means English organic traffic is currently zero by design.

**Relevant Code:**
```tsx
<html lang="sv" suppressHydrationWarning>
// LocaleContext: locale stored in localStorage + React state, never in the URL
```

**Suggested Solution:**
First decide whether English organic search traffic matters for the business. If yes: move to path-based locales (`/en/...` prefix, Swedish at root) — in App Router this means a `[locale]` segment (or `next-intl`), middleware locale detection/redirect, `generateMetadata` emitting `alternates: { languages: { 'sv-SE': url, 'en-US': enUrl, 'x-default': url } }`, and `<html lang={locale}>` from the route param. This is a significant refactor; sequence it after ISSUE-058 since it touches the same files. If no: explicitly accept Swedish-only SEO, keep the client toggle as a UX nicety, and at minimum sync the `lang` attribute on toggle (`document.documentElement.lang = locale` in `LocaleContext`) for accessibility/correctness.

**Resolution Notes:**
~~On inspection, the minimal fix already exists … deliberately left open.~~ **Superseded 2026-06-11 — the user approved the full URL-based implementation (with future Nordic expansion in mind).** Implemented as a middleware-rewrite architecture rather than an `app/[locale]/` segment (full design rationale + extension guide in `ARCHITECTURE_NOTES.md` §1): `/en/...` rewrites to the unprefixed route with an `x-locale` request header; `/sv/...` 308-redirects to the unprefixed canonical; `/` stays Swedish. Key pieces: `src/lib/i18n.ts` (locale config + `localizePath`/`localizedAlternates` — adding a Nordic locale is a config change), `src/lib/i18n-server.ts` (`getRequestLocale()`), `LocaleContext` rewritten to derive locale purely from `usePathname()` (toggle = navigation; cookie persists preference for the middleware's one-time Accept-Language first-visit redirect), `src/components/i18n/Link.tsx` drop-in replacing `next/link` in all 43 importing files, `<html lang>` from the request locale, locale-aware `generateMetadata` with `sv-SE`/`en`/`x-default` hreflang on the 7 fully translated routes (home, products, products/[id] via DB translations, about, contact, how-to-use, faq), sitemap `alternates.languages` for those routes only, robots disallows for `/en/<private>` paths. Untranslated pages (terms, privacy, refund, shipping-policy, track-order) were initially canonical to their Swedish URL from `/en/*`; **follow-up closed 2026-06-12** — all five are now fully bilingual with hreflang + sitemap alternates (the legal pages' English content already existed in the components, dormant behind a hardcoded `const locale = 'sv'`). Security: middleware resolves locale *before* the admin gate (verified `/en/admin` → signin redirect, no bypass). Verified live against `next start`: sv/en SSR (`lang`, h1), hreflang triplets, 308 for `/sv/*`, Accept-Language first-visit 307 → `/en/*` (sv browsers unaffected), `/en` pages link-prefixed, English DB translations in Product JSON-LD, sitemap xhtml:link alternates.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `src/lib/i18n.ts`, `src/middleware.ts`, `src/contexts/LocaleContext.tsx`, `layout.tsx` `<html lang={locale}>`, legal `*Content.tsx` take `locale` prop; `sitemap.ts` `languageAlternates` on all 11 static routes; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-061).
- **Details:** Re-verified 2026-06-16. URL-based locale, hreflang helpers, and bilingual legal/track-order pages confirmed in source.
- **Remaining Concerns:** Live middleware redirect/rewrite behavior not re-tested against a running server in this pass. English legal copy should receive human legal review before production reliance.

---

### [ISSUE-062] Weak social/OG and icon metadata: logo as OG image, no Twitter card, fragile `metadataBase`, favicon mismatch
- **Status:** Resolved
- **Severity:** Low
- **Category:** Other
- **File:** `src/app/layout.tsx` (lines 28-56), `public/favicon.jpg`
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
Several small metadata defects compound: (1) the OG image is the square 800×800 logo — link previews crop badly; the recommended canvas is 1200×630; (2) no `twitter` metadata, so X/Twitter falls back to a small summary card; (3) `metadataBase` is `undefined` when `NEXT_PUBLIC_APP_URL` is unset, which breaks resolution of the relative OG image URL (Next falls back to localhost in dev, and warns); (4) icon mismatch — metadata points `icon`/`apple` at `/images/logo.jpg` while `public/favicon.jpg` sits unused and no `favicon.ico` exists (the middleware matcher excludes one, expecting it); a JPG apple-touch-icon also won't get rounded-corner treatment properly vs PNG; (5) the `keywords` meta tag is ignored by all modern engines (harmless noise); (6) leftover create-next-app SVGs (`next.svg`, `vercel.svg`, etc.) ship in `public/`.

**Relevant Code:**
```ts
metadataBase: appUrl ? new URL(appUrl) : undefined,
icons: { icon: '/images/logo.jpg', apple: '/images/logo.jpg' },
openGraph: { images: [{ url: '/images/logo.jpg', width: 800, height: 800, ... }] },
```

**Suggested Solution:**
Create a proper 1200×630 brand OG image (product photography + logo) as `src/app/opengraph-image.png` (App Router auto-wires it, including for twitter); add `twitter: { card: 'summary_large_image' }` to root metadata. Make `metadataBase` required: throw or hard-default to the production domain instead of `undefined`. Add `src/app/icon.png` (512×512 PNG) and `src/app/apple-icon.png` (180×180), and a real `public/favicon.ico`; remove the `icons` metadata block (file conventions supersede it) and delete the unused `public/favicon.jpg` + create-next-app SVGs. Drop the `keywords` field. Per-product OG images come with ISSUE-058's `generateMetadata`.

**Resolution Notes:**
(1) Generated `public/images/og-image.jpg` (1200×630, 71 KB) as a center-crop of the existing `hero-lifestyle.png` product photography — visually verified (diffuser + branded lavender bottle); root OG metadata points at it with correct declared dimensions (the old block claimed 800×800 for a 3072×4096 logo). (2) `twitter: { card: 'summary_large_image' }` added. (3) `metadataBase` is now always a `URL` (localhost fallback + `console.warn` when `NEXT_PUBLIC_APP_URL` is unset, surviving prod builds per ISSUE-056). (4) Generated `src/app/icon.png` (512²), `src/app/apple-icon.png` (180²), and `src/app/favicon.ico` (48px) from a square crop of the gold drop emblem in `logo.jpg`; removed the `icons` metadata block in favor of file conventions; both icons confirmed in the build route manifest. (5) `keywords` dropped; `public/favicon.jpg` and the five create-next-app SVGs (verified unreferenced) deleted. (6) `openGraph.siteName` added.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `layout.tsx` OG 1200×630, `twitter.card`, `metadataBase: new URL(appUrl)`; `src/app/icon.png`, `apple-icon.png`, `favicon.ico` exist; `public/favicon.jpg` absent; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-062).
- **Details:** Re-verified 2026-06-16. Icon/OG conventions and metadata cleanup confirmed.
- **Remaining Concerns:** None

---

### [ISSUE-063] Row Level Security disabled on 13 tables — fully exposed to the anon key
- **Status:** Resolved
- **Severity:** Critical
- **Category:** Security
- **File:** Supabase project `hvxggcskfwnayjvzdein` (database, not repo)
- **Detected:** 2026-06-10 (Supabase advisor, surfaced during ISSUE-053 schema work)
- **Resolved:** 2026-06-10

**Description:**
The Supabase security advisor reports RLS disabled on 13 tables: `user_consent`, `user_preferences`, `gdpr_activity_log`, `inventory_movements`, `password_reset_tokens`, `contact_form_submissions`, `newsletter_subscriptions`, `abandoned_carts`, `carrier_pricing_rules`, `wishlist`, `processed_stripe_events`, `rate_limit_buckets`, `feature_flags`. Anyone holding the publishable (anon) key — which ships in the client bundle — can read or modify every row via the Supabase REST API. The worst exposures: `password_reset_tokens` (active reset tokens = account takeover), `contact_form_submissions` and `newsletter_subscriptions` (PII: names, emails, IPs), `abandoned_carts` (emails + recovery tokens), `gdpr_activity_log` (PII + IPs), and `feature_flags` (writable — an attacker can enable `enable_test_endpoints`).

**Relevant Code:**
```sql
-- Supabase advisor remediation (DO NOT run without confirming no anon-key code path
-- reads these tables; all repo access appears to go through the service-role client):
ALTER TABLE public.user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
```

**Suggested Solution:**
**Verified 2026-06-10: enabling RLS blindly WILL break features.** The following code paths query these tables through the **anon** client and currently work only because RLS is off:
- `AuthService` (injected with `TOKENS.SupabaseClient` = anon) → `password_reset_tokens` — the entire password-reset flow. Note this contradicts ISSUE-012's resolution notes, which claimed AuthService got the server-role client.
- `GDPRService` (imports anon client) → `user_consent`, `user_preferences`, `gdpr_activity_log`, `abandoned_carts`
- `src/app/api/newsletter/route.ts` (anon) → `newsletter_subscriptions`
- `ShippingRepository` (anon) → `carrier_pricing_rules`
- `InventoryService` (`TOKENS.SupabaseClient` = anon) → `inventory_movements`
- `AbandonedCartRepository` (anon) → `abandoned_carts`

Required sequence: (1) switch each of the above to the server-role client (`TOKENS.SupabaseServerClient` for injectables, `getSupabaseServer()` for routes) — they are all server-side code, so this is safe and is what they should have been using anyway (same migration ISSUE-002 did for `CustomerRepository`); (2) re-grep to confirm no anon access remains; (3) apply the RLS migration above. Until step 1 happens, do **not** run the SQL. Left open pending user sign-off and the prerequisite client migration.

**Resolution Notes:**
User sign-off given 2026-06-10; executed in the required sequence. (1) All six paths migrated to the server-role client: `AuthService` and `InventoryService` now inject `TOKENS.SupabaseServerClient`; `GDPRService` and `ShippingRepository` use a lazy `private get supabase()` returning `getSupabaseServer()` (lazy so modules load at build time without env vars); `AbandonedCartRepository` passes `getSupabaseServer()` to `super()`; the newsletter route calls `getSupabaseServer()` per query. Side benefit: GDPR export/delete also queried the RLS-protected `customers` table via the anon client — it was silently broken and now works. (2) Re-grep confirmed the only remaining anon-client users (`CartRepository`, `OrderRepository`, `InventoryRepository`, di-container registration, update-bundle-images) touch none of the 13 tables. (3) Applied migration `enable_rls_on_exposed_tables` (all 13 tables, no policies — service role only). Advisor re-check: the critical `rls_disabled` advisory is gone; the remaining `rls_enabled_no_policy` INFO entries are the intended locked-down state. The re-check surfaced a separate pre-existing problem now tracked as [ISSUE-065].

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `AuthService`, `GDPRService`, `InventoryService`, `ShippingRepository`, `AbandonedCartRepository`, `newsletter/route.ts` use server client; only `di-container.ts` imports `@/lib/supabase`; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-063).
- **Details:** Re-verified 2026-06-16. Code-side prerequisite migration complete; anon client isolated to DI registration for public-read repos.
- **Remaining Concerns:** `enable_rls_on_exposed_tables` migration not in repo; live Supabase RLS state not re-checked in this pass.

---

### [ISSUE-064] Customer shipping-label PDFs publicly served from `public/shipping-labels/`
- **Status:** Resolved
- **Severity:** High
- **Category:** Security
- **File:** `public/shipping-labels/*.pdf` (5 files), generated by the label flow (`src/services/shipping/LabelGenerationService.ts` / `src/app/api/shipping/labels/*`)
- **Detected:** 2026-06-10
- **Resolved:** 2026-06-10

**Description:**
Five generated shipping-label PDFs sit in `public/shipping-labels/`, named by order UUID. Anything in `public/` is served unauthenticated — these labels contain customer names and delivery addresses (PII). The UUIDs make enumeration hard but the URLs leak via logs/referrers and the directory ships with the repo/deploy. This is a GDPR problem as well as a privacy one.

**Relevant Code:**
```text
public\shipping-labels\375699b3-c3ee-4bae-a06e-019d8c673a08.pdf
public\shipping-labels\51582ee2-e5c6-491d-a5fe-6b4b34e51636.pdf
... (3 more)
```

**Suggested Solution:**
Change `LabelGenerationService` to write labels to a **private** Supabase Storage bucket (`shipping-labels`), and have `/api/shipping/labels/download` stream the PDF after verifying an admin session (it already exists as the download path — point it at storage instead of the filesystem; serverless filesystems are ephemeral anyway, so the current approach also silently loses labels between deploys). Delete the five PDFs from `public/` once migrated, and add `public/shipping-labels/` to `.gitignore`. Interim mitigation applied 2026-06-10: `/shipping-labels/` added to robots.txt disallow (prevents indexing, not access). Not deleted in this pass because the admin label-download flow may still reference these files on disk.

**Resolution Notes:**
(1) Created private storage bucket `shipping-labels` (`public: false`). (2) `LabelGenerationService.savePDF` now uploads to the bucket (`contentType: application/pdf`, `upsert: true`, path-traversal guard kept) and returns the storage object path, which persists as `label_pdf_url` — previously labels went to `/tmp/shipping-labels` (ephemeral on serverless: silently lost on every cold start). (3) `/api/shipping/labels/download` now streams from the bucket via the service-role client — and gained a missing authorization check found during the fix: it previously allowed **any** authenticated user to download any order's label; it now requires admin or order ownership (404 on mismatch to avoid confirming order existence). (4) The five PDFs deleted from `public/` (verified safe: `shipping_labels` table has 0 rows, so no references existed) and `public/shipping-labels/` gitignored. The robots.txt disallow stays as defense-in-depth.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `LabelGenerationService.ts` uploads to `shipping-labels` bucket; `labels/download/route.ts` streams from storage with admin/owner check; `public/shipping-labels/` absent and gitignored; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-064).
- **Details:** Re-verified 2026-06-16. No public PDF directory; authorized download path confirmed.
- **Remaining Concerns:** Private bucket existence/config on Supabase not re-verified in this pass.

---

### [ISSUE-065] Always-true RLS policies let the anon key write to orders, inventory, carts, and more
- **Status:** Resolved
- **Severity:** High
- **Category:** Security
- **File:** Supabase project `hvxggcskfwnayjvzdein` (policies), plus `src/repositories/{orders/OrderRepository,cart/CartRepository,inventory/InventoryRepository}.ts` and `src/app/api/admin/update-bundle-images/route.ts` (anon-client users that depend on them)
- **Detected:** 2026-06-10 (Supabase advisor re-check after ISSUE-063)
- **Resolved:** 2026-06-11

**Description:**
The security advisor flags WARN-level `rls_policy_always_true` on several RLS-enabled tables. These policies grant `anon`/`authenticated` unrestricted writes via `USING (true)` / `WITH CHECK (true)`:
- `orders`: "Allow insert orders" (INSERT, anon+auth), "Allow update orders" (UPDATE, anon+auth) — anyone with the publishable key can create or modify ANY order (status, tracking number, totals)
- `inventory`: "Allow update to inventory" (UPDATE, anon+auth) — anyone can set stock levels
- `carts`: always-true INSERT/UPDATE/DELETE for anon+auth — anyone can read/modify/delete any cart
- `order_items`: always-true INSERT (anon+auth)
- `customers`: always-true INSERT for anon and authenticated
- `returns` + `return_items`: ALL commands always-true for authenticated
- `stock_reservations`: ALL commands always-true for anon+auth
- `shipping_labels`: always-true INSERT

These policies exist because `OrderRepository`, `CartRepository`, and `InventoryRepository` still use the anon client (`@/lib/supabase`) — the permissive policies are what makes those repositories work at all. This is the same anti-pattern ISSUE-063 removed for the 13 formerly RLS-disabled tables. The `orders` UPDATE policy is the worst of it: an attacker can mark any order shipped/delivered, change tracking numbers, or alter totals directly via the Supabase REST API.

**Relevant Code:**
```text
Advisor: rls_policy_always_true on public.orders ("Allow update orders", UPDATE, anon+authenticated, USING true / WITH CHECK true)
Code:    src/repositories/orders/OrderRepository.ts:4  import { supabase } from '@/lib/supabase';
```

**Suggested Solution:**
Repeat the ISSUE-063 sequence: (1) migrate `OrderRepository`, `CartRepository`, `InventoryRepository`, and `update-bundle-images/route.ts` to the server-role client (all are server-side code; same pattern as the six paths already migrated); (2) verify no client-side component queries these tables directly with the anon client (carts are touched via API routes, but confirm); (3) DROP the always-true write policies (keep deliberate public-read SELECT policies, e.g. on products); (4) re-run the advisor and confirm `rls_policy_always_true` clears. Sequencing matters — dropping the policies before migrating the repositories breaks order creation, cart updates, and inventory adjustments.

**Resolution Notes:**
Followed the suggested migrate-first sequence on 2026-06-11:
1. **Code migration:** `OrderRepository` now calls `super(getSupabaseServer())` (same pattern as AbandonedCartRepository); `CartRepository` and `InventoryRepository` got a lazy `private get supabase()` getter returning `getSupabaseServer()` (request-time only, build-safe); `update-bundle-images/route.ts` swapped to `getSupabaseServer()`. Grep confirmed zero remaining `@/lib/supabase` imports outside `di-container.ts` (which still registers the anon token for the public-read ProductRepository/BundleRepository — intended).
2. **Verification before dropping:** a `pg_policies` dump showed the situation was worse than the advisor summary — anon could also **SELECT every order, cart, order_item, and shipping_label** (always-true read policies), not just write. Confirmed `stock_reservations` access goes through InventoryService (server client since ISSUE-063) and `returns`/`return_items` through ReturnRepository (already `getSupabaseServer()`); confirmed no other `createClient` call sites and that ProductRepository does not join `inventory`.
3. **Migration `drop_always_true_rls_policies`:** dropped 18 policies — all always-true read/write policies on `carts` (4), `customers` (2 INSERTs), `inventory` (SELECT+UPDATE), `orders` (3), `order_items` (2), `returns`/`return_items` (blanket ALL for authenticated), `shipping_labels` (2), `stock_reservations` (ALL), plus the duplicate `products` read policy ("Allow read products"; public read remains via "Allow public read access to products"). Scoped `auth.uid()`-based policies and intended public-read policies (products, bundle_configurations, shipping_rates, oil_knowledge) were kept.
4. **Verified:** `tsc --noEmit` clean, `next build` passing, advisor re-check shows `rls_policy_always_true` fully cleared. The remaining `rls_enabled_no_policy` INFO entries are the intended service-role-only state.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `OrderRepository`, `CartRepository`, `InventoryRepository`, `update-bundle-images/route.ts` use `getSupabaseServer()`; no `@/lib/supabase` outside `di-container.ts`; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-065); existing `__tests__/repositories/{Order,Cart,Inventory}Repository.test.ts`.
- **Details:** Re-verified 2026-06-16. Repository code migration complete; always-true policy removal depends on live DB state from prior pass.
- **Remaining Concerns:** `drop_always_true_rls_policies` migration not in repo; live Supabase advisor not re-run in this pass.

---

### [ISSUE-066] Supabase advisor hygiene WARNs: mutable function search_path (12 functions) and extensions in public schema (5)
- **Status:** Resolved
- **Severity:** Low
- **Category:** Security
- **File:** Supabase project `hvxggcskfwnayjvzdein` (database functions/extensions, not repo)
- **Detected:** 2026-06-10 (Supabase advisor re-check after ISSUE-063)
- **Resolved:** 2026-06-11 (functions first, extension relocation completed same day after user sign-off)

**Description:**
Two WARN-level lint classes remain after the ISSUE-063/015 work:
1. `function_search_path_mutable` — 12 functions lack a pinned `search_path` (`update_returns_updated_at`, `update_stock_reservation_timestamp`, `update_newsletter_subscription_timestamp`, `expire_old_reservations`, `cleanup_expired_reset_tokens`, `update_bundle_configurations_updated_at`, `match_oil_knowledge`, `create_inventory_for_product`, `update_abandoned_carts_updated_at`, `is_order_eligible_for_return`, `calculate_return_refund`, `update_contact_submission_timestamp`, `update_updated_at_column`). A role-mutable search_path allows schema-shadowing attacks against SECURITY DEFINER functions; most of these are trigger helpers, so practical risk is low, but pinning is cheap. (The new `increment_review_helpful` from ISSUE-053 already pins `search_path = public`.)
2. `extension_in_public` — `pgcrypto`, `citext`, `pg_trgm`, `uuid-ossp`, `vector` are installed in the `public` schema; Supabase recommends a dedicated `extensions` schema.

**Relevant Code:**
```text
Advisor: function_search_path_mutable (WARN) x12, extension_in_public (WARN) x5
Remediation refs:
https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
```

**Suggested Solution:**
For the functions, a single migration of `ALTER FUNCTION public.<name>(...) SET search_path = public;` statements (verify each signature first via `\df` / pg_proc). For the extensions, relocation (`ALTER EXTENSION ... SET SCHEMA extensions`) can break existing references (e.g. `uuid_generate_v4()` defaults on table columns, `vector` columns in `oil_knowledge`) — do this only deliberately, with a check of all default expressions and the match_oil_knowledge function, or accept the WARN. Function search_path pinning is the worthwhile half; the extension relocation is optional hygiene.

**Resolution Notes:**
**Functions (done, 2026-06-11):** queried `pg_proc` for exact identity arguments, then migration `pin_search_path_on_functions` ran `ALTER FUNCTION ... SET search_path = public` on all 13 app-defined functions (the 12 flagged plus signature-verified arg lists for `calculate_return_refund(uuid, boolean)`, `is_order_eligible_for_return(uuid, integer)`, and `match_oil_knowledge(vector, integer, jsonb)`). Advisor re-check confirms `function_search_path_mutable` is fully cleared.
**Extensions (done, 2026-06-11, user sign-off):** migration `relocate_extensions_out_of_public` moved all five extensions to the standard `extensions` schema and re-pinned all 14 app functions to `search_path = public, extensions` in the same transaction. Pre-flight checks: all five relocatable (`pg_extension.extrelocatable`), `extensions` schema already had USAGE for anon/authenticated/service_role, PostgREST's extra search_path includes `extensions` (so citext/vector operator resolution through the REST API is unaffected), and extension types are only used by `user_profiles.email` (citext) and `oil_knowledge.embedding` (vector). Post-migration smoke tests passed: `match_oil_knowledge` returns matches (vector `<=>` resolves), column defaults render schema-qualified (OID-bound, unaffected), citext comparison stays case-insensitive. Advisor re-check: `extension_in_public` fully cleared; only intended `rls_enabled_no_policy` INFO entries remain. **Maintenance rule for future migrations:** new DB functions must pin `search_path = public, extensions`, and SQL written for cron jobs/scripts should schema-qualify extension functions or set that search_path.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `ARCHITECTURE_NOTES.md` documents `search_path = public, extensions` maintenance rule; prior resolution notes reference `pin_search_path_on_functions` and `relocate_extensions_out_of_public` migrations applied live.
- **Details:** Re-verified 2026-06-16. Codebase documents the hygiene rule for future migrations; live DB function/extension state not re-probed.
- **Remaining Concerns:** Neither `pin_search_path_on_functions` nor `relocate_extensions_out_of_public` SQL is checked into `database/migrations/`; Supabase advisor not re-run in this pass.

---

### [ISSUE-067] Returns creation broken — `create_return_with_items` RPC never existed in the database
- **Status:** Resolved
- **Severity:** High
- **Category:** Bug
- **File:** `src/repositories/returns/ReturnRepository.ts` (line 20) vs Supabase project `hvxggcskfwnayjvzdein`
- **Detected:** 2026-06-11 (pg_proc audit during ISSUE-066 extension relocation pre-flight)
- **Resolved:** 2026-06-11

**Description:**
`ReturnRepository.create()` calls `supabase.rpc('create_return_with_items', {...})`, but a full `pg_proc` scan (all schemas) showed no such function exists. Every return-creation attempt therefore failed at runtime with a "function not found" error from PostgREST. The rest of the returns flow (read/update/refund calculation via `is_order_eligible_for_return` / `calculate_return_refund`) was intact — only creation was broken.

**Relevant Code:**
```ts
// src/repositories/returns/ReturnRepository.ts line 20
const { data: returnId, error } = await supabase.rpc('create_return_with_items', { p_order_id: ..., p_items: [...] });
```

**Suggested Solution:**
Create the function matching the repository's calling convention (9 params, returns the new return id), inserting the `returns` row and its `return_items` atomically; `order_item_id` mirrors `product_id` per the repository's documented convention (orders store items as JSON, so there is no separate order_items row to reference).

**Resolution Notes:**
Migration `create_return_with_items_function` adds `public.create_return_with_items(uuid, uuid, varchar, text, numeric, varchar, text, varchar, jsonb) returns uuid` — plpgsql, SECURITY DEFINER, `SET search_path = public, extensions` (per the ISSUE-066 maintenance rule). Inserts the return, loops `jsonb_array_elements(p_items)` inserting items (`order_item_id` = `product_id` = item `productId`), returns the new id; a failure anywhere rolls the whole thing back. EXECUTE revoked from `public`/`anon`/`authenticated` and granted only to `service_role`, matching how ReturnRepository calls it (server-role client). No code change needed — the repository's call signature was treated as the contract.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `ReturnRepository.ts` calls `rpc('create_return_with_items', …)` via `getSupabaseServer()`; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-067).
- **Details:** Re-verified 2026-06-16. Application code contract matches the resolution spec.
- **Remaining Concerns:** Checked-in `database/migrations/015_create_return_with_items_rpc.sql` **drifts** from production spec (no `SECURITY DEFINER`, no `search_path` pin, grants `EXECUTE` to `authenticated`). Live RPC existence not re-probed; repo migration should be updated to match what was applied.

---

### [ISSUE-068] service_role had no table grants — every server-client query failed with "permission denied"
- **Status:** Resolved
- **Severity:** Critical
- **Category:** Integration
- **File:** Supabase project `hvxggcskfwnayjvzdein` (table ACLs), affects every consumer of `getSupabaseServer()`
- **Detected:** 2026-06-11 (missing AggregateRating during ISSUE-060 verification — the rating-stats query silently returned a failure)
- **Resolved:** 2026-06-11

**Description:**
Only 5 of 30 public tables had any GRANT for the `service_role` role; `orders`, `customers`, `reviews` and most others granted only `postgres`, `anon`, `authenticated`. Because PostgreSQL GRANTs are checked before (and independently of) RLS, the service-role key's famous "bypasses RLS" property is irrelevant when the role lacks the GRANT itself — every query through the server client failed with `permission denied for table ...`. Verified directly: a standalone script using `SUPABASE_SECRET_KEY` (JWT role claim decoded and confirmed as `service_role`) got permission-denied on `reviews`, `orders` and `customers`.

Blast radius: everything migrated to `getSupabaseServer()` was silently broken at runtime — CustomerRepository (since ISSUE-002), AuthService password reset, GDPRService export/delete, newsletter, ShippingRepository, InventoryService (since ISSUE-063), OrderRepository/CartRepository/InventoryRepository (since ISSUE-065), ReviewRepository (since ISSUE-053). The app *appeared* to work because the most visible read paths (products, bundles) still use the anon client, and most repository methods translate errors into `{ success: false }` responses that callers render as empty states. This also retroactively explains why the always-true anon policies (ISSUE-065) existed: writes through the anon key were the only thing that actually worked.

**Relevant Code:**
```text
relacl on public.orders:    {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres}  ← no service_role
relacl on public.reviews:   NULL (owner-only)
Debug probe:                reviews/orders/customers → "permission denied for table ..." with the service_role JWT
```

**Suggested Solution:**
Grant service_role full access to all current public tables/sequences and set default privileges so future migrations (run as `postgres`) include it automatically.

**Resolution Notes:**
Migration `grant_service_role_on_public_tables`: `GRANT USAGE ON SCHEMA public` + `GRANT ALL ON ALL TABLES/SEQUENCES IN SCHEMA public TO service_role` + `ALTER DEFAULT PRIVILEGES FOR ROLE postgres ... GRANT ALL ON TABLES/SEQUENCES TO service_role`. Verified live: the product page now emits `AggregateRating` (ratingValue 4.5, reviewCount 2 from the seeded reviews) where it was silently absent before. Two adjacent fixes landed with it: (1) `ReviewRepository` embeds are now pinned to `customers!reviews_customer_id_fkey` — PostgREST refused the bare `customers(...)` embed as ambiguous because reviews relates to customers both directly and via `review_helpful_votes`; (2) the product page's `getRatingStats`/`getProduct` helpers now `console.error` repository-level failures instead of returning null silently — that silence is what hid this bug. **Maintenance rule:** tables created by hand or via tools that bypass `postgres` default privileges must be checked for service_role grants (`select relname, relacl from pg_class`); "RLS is enabled with no policies" only protects tables if the role-level GRANTs are also correct.

**Verification Record:**
- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** `ReviewRepository` + `CustomerRepository` use `SupabaseServerClient`/`getSupabaseServer()`; `products/[id]/page.tsx` logs rating/product fetch errors; pinned FK embed; `__tests__/issues/fable-001-018-verification.test.ts` (ISSUE-068).
- **Details:** Re-verified 2026-06-16. Consumer hardening and error surfacing confirmed; grants migration applied live per prior pass.
- **Remaining Concerns:** `grant_service_role_on_public_tables` migration not in repo; live `relacl` grants not re-probed in this pass.
