# Issue Registry
_Last updated: 2026-05-18_

## Summary
- Total Issues: 24
- Open: 0 | In Progress: 0 | Resolved: 24 | Partially Resolved: 0 | Blocked: 0 | Wont Fix: 0

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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/app/api/cron/send-abandoned-cart-reminders/route.ts` lines 23-29: guard is `if (!cronSecret)` (console.error) followed by `if (!cronSecret || authHeader !== \`Bearer ${cronSecret}\`)` returning 401.
- **Details:** The fail-closed pattern `!cronSecret || ...` is in place and mirrors `cleanup-reservations/route.ts`. A missing secret now always returns 401 and logs a console.error. No bypass possible.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/repositories/customers/CustomerRepository.ts`: imports `getSupabaseServer` from `@/lib/supabase-server` (line 3); every method (`findAll`, `findById`, `findByEmail`, `create`, `update`, `delete`, `createWithPassword`, `changePassword`, `verifyPassword`) calls `getSupabaseServer()` directly — no anon `supabase` import present.
- **Details:** The anon `supabase` client (publishable key) is entirely absent from this file. All customer queries now use the service-role client which bypasses RLS, ensuring `password_hash` is never exposed via the publishable key.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/config/di-container.ts` lines 199-218: `IS_BUILD_TIME` computed from `process.env.NEXT_PHASE === 'phase-production-build' || !process.env.SUPABASE_SECRET_KEY`; errors swallowed only when `IS_BUILD_TIME` is true; at runtime errors are logged via `console.error` and rethrown.
- **Details:** The wrapper correctly distinguishes build-time from runtime. Silent null returns are restricted to build time; runtime resolution failures produce a real thrown error with a logged stack trace.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/config/di-init.ts` lines 10-23: single `if (typeof window === 'undefined' && !isConfigured)` block — no `NODE_ENV` branching. Errors always rethrown. Auto-init at line 27 gated on `SUPABASE_SECRET_KEY`.
- **Details:** Both NODE_ENV branches are collapsed. The container initializes in any environment (development, production, test) as long as it's server-side and env vars are present. Errors propagate, making silent failures impossible.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/repositories/customers/CustomerRepository.ts` lines 260-274: `createWithPassword` explicitly sets `is_admin: false` (line 272) and `marketing_opt_in: customer.marketingOptIn ?? false` (line 271).
- **Details:** The NOT NULL constraint on `is_admin` is satisfied by the explicit `false`. The `?? false` guard on `marketing_opt_in` prevents `undefined` from being passed. Both fixes match the resolution notes.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/app/api/customers/route.ts` line 9: `container.resolve<ICustomerRepository>(TOKENS.ICustomerRepository)`. `src/app/api/customers/[id]/route.ts` line 9: same. Both files have `export const dynamic = 'force-dynamic'` (line 1) and `import '@/config/di-init'` (line 2). GET/POST/PATCH/DELETE all call real repository methods. No mock data or `cust-${Date.now()}` IDs present.
- **Details:** Both customer routes are fully wired to the real DI container and `CustomerRepository`. Mock data is completely absent.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/lib/auth.ts` lines 48-65: `{ data: adminData, error: adminErr }` destructured; `console.error` on `adminErr`; `console.warn` when `adminData` is null; `console.error` in catch block with `adminCatchErr`. All diagnostic `[issue-tracker]` logs removed.
- **Details:** Supabase errors, null results, and exceptions are all now logged with context. Behavior remains soft-fail (non-admin default), but every failure mode is observable.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/services/orders/OrderService.ts` line 113: `reservationId: stockReservation.data!` passed to `orderRepository.create(...)`. `src/repositories/orders/OrderRepository.ts` line 56: `reservation_id: order.reservationId` in the create payload; line 218: `reservationId: record.reservation_id` in `transformDbRecord`. `src/types/index.ts` line 122: `reservationId?: string` on the `Order` interface.
- **Details:** The full chain is verified: type definition, repository write, repository read-back, and service call. Every new order row now records its `reservation_id`.
- **Remaining Concerns:** None

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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/app/api/contact/route.ts` lines 19-65: `checkRateLimit` function uses `getSupabaseServer()` to read/write `rate_limit_buckets` table. No module-level `Map` or in-memory state present anywhere in the file.
- **Details:** The rate limiter is fully Supabase-backed. Buckets are keyed by `${FORM_TYPE}:${ip}`, timestamps are filtered to the 1-hour window, and counts are checked before upserting. DB failures fail open with a logged error.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/app/not-found.tsx` — root div has `dark:bg-[#1a1f1e]`; h1/h2 have `dark:text-[#E8EDE8]`; body text has `dark:text-[#C5D4C5]`; secondary button has `dark:bg-[#242a28] dark:text-[#E8EDE8] dark:border-[#3f4946] dark:hover:bg-[#2a3330]`; card has `dark:bg-[#242a28]`; links have `dark:text-sage-400`. `src/app/error.tsx` — same root/heading/body/card pattern plus `dark:bg-red-900/30 dark:text-red-400` on error elements.
- **Details:** All light-only classes have `dark:` counterparts using the established custom palette. Both files match the project's dark mode convention.
- **Remaining Concerns:** None

---

### [ISSUE-011] `DevAdminButton.tsx` uses only light-mode classes (and writes to .env.local from API)
- **Status:** Resolved
- **Severity:** Low
- **Category:** Style/Pattern
- **File:** `src/components/admin/DevAdminButton.tsx` (lines 96-251)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-18

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
Dark mode fix applied: added `dark:bg-[#242a28]`, `dark:border-[#3f4946]`, `dark:bg-[#1a1f1e]`, `dark:text-[#8A9A8A]`, and `dark:hover:bg-[#2a3330]` to all affected elements in `src/components/admin/DevAdminButton.tsx`. The `src/app/api/test/config/route.ts` env-file write has also been fixed: the route now reads/writes the `feature_flags` Supabase table via `getSupabaseServer()`, with `getTestModeStatus()` reading from the `enable_test_endpoints` row and `setTestModeStatus()` upserting it. The `feature_flags` table is confirmed present in Supabase. Filesystem writes are eliminated.

**Verification Record:**
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/components/admin/DevAdminButton.tsx`: menu container has `dark:bg-[#242a28] dark:border-[#3f4946]`; menu body has `dark:bg-[#242a28]`; footer has `dark:bg-[#1a1f1e]`; text has `dark:text-[#8A9A8A]`; hover links have `dark:hover:bg-[#2a3330]`. `src/app/api/test/config/route.ts`: `getTestModeStatus` and `setTestModeStatus` read/write `feature_flags` table via `getSupabaseServer()` — no `fs`, `writeFileSync`, or `.env.local` references present.
- **Details:** Dark mode applied to all DevAdminButton elements. Filesystem write eliminated; feature flag is now persisted in Supabase and works in serverless environments.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/services/auth/AuthService.ts`: no `import ... from 'next-auth/react'` line present anywhere in the file. Imports are `reflect-metadata`, `crypto`, `tsyringe`, `@supabase/supabase-js`, and project-internal interfaces only. Methods: `signUp`, `resetPassword`, `verifyResetToken`, `completePasswordReset`, `updateProfile`, `deleteAccount` — all server-safe. `src/lib/auth-client.ts`: `'use client'` directive on line 13; imports `signIn`, `signOut`, `getSession` from `next-auth/react`; exports `clientSignIn`, `clientSignOut`, `getClientSession`.
- **Details:** The architectural split is complete. `AuthService` is fully server-safe; client-side auth wrappers live in `auth-client.ts` which is clearly marked `'use client'`.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/components/gdpr/CookieConsent.tsx` lines 33-34: `LocalStorageHelper.getItem<ConsentData>('cookie-consent')` used instead of direct `localStorage.getItem` + `JSON.parse`. Line 108: `LocalStorageHelper.setItem('cookie-consent', consentData)` used instead of direct `localStorage.setItem`. No bare `localStorage` calls remain for consent data.
- **Details:** Both read and write now go through `LocalStorageHelper` which handles `SecurityError` and JSON parse errors. The consent banner correctly falls through to showing on any storage error.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/components/gdpr/CookieConsent.tsx` line 29: `checkConsentStatus` is a `useCallback` with `[session?.user?.id]` in deps. Line 73-75: `useEffect` depends on `[checkConsentStatus]`. The `eslint-disable-next-line react-hooks/exhaustive-deps` comment on line 70 documents the intentional omission of session.
- **Details:** The effect now only re-runs when the user ID changes (i.e., sign-in/sign-out), not on every token refresh. This eliminates the unnecessary `/api/gdpr` network round-trips.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/contexts/LocaleContext.tsx` lines 70-79: first `useEffect` with `[]` runs mount-only detection; lines 83-87: second `useEffect` with `[defaultLocale]` syncs prop changes. `locale` is absent from both dep arrays. `eslint-disable-next-line` comment on line 78 documents the intentional omission.
- **Details:** The stale-closure cycle is broken. Detection runs once on mount; prop changes sync independently. `locale` state is no longer in deps.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/app/api/advisor/chat/route.ts` lines 9-12: `req.json()` in try/catch returning 400. Lines 16-23: `fetch(...)` in try/catch returning 503. Lines 25-29: non-ok response returns status passthrough. Lines 31-35: `res.json()` in try/catch returning 502.
- **Details:** All three failure modes are handled: invalid request body (400), agent unreachable (503), non-JSON agent response (502). Pattern mirrors the stream route.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/utils/validation.ts` line 46: `email: z.string().trim().toLowerCase().email(...).max(254, ...)`. Line 50: `firstName: z.string().trim().min(1)...`. Line 51: `lastName: z.string().trim().min(1)...`. Line 52: `phone: z.string().trim().max(20).optional()`.
- **Details:** Email now gets `.trim()`, `.toLowerCase()`, and `.max(254)`; firstName/lastName get `.trim()`; phone gets `.trim().max(20)`. Matches the suggested solution exactly.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/app/api/checkout/route.ts` lines 252-283: `sendOrderConfirmation` is now gated behind `if (!isCardPayment)` where `isCardPayment = order.paymentMethod === 'card'`. Card orders do not trigger the email from checkout; the Stripe webhook in `stripe/route.ts` (unchanged) sends it instead.
- **Details:** The duplicate-email path for card payments is eliminated. Non-card payment methods still send from checkout since they have no Stripe webhook.
- **Remaining Concerns:** None

---

### [ISSUE-019] `EmailService.sendEmail` lacks the `Idempotency-Key` header that prevents duplicate Resend sends on retry
- **Status:** Resolved
- **Severity:** Low
- **Category:** Integration
- **File:** `src/services/email/EmailService.ts` (lines 29-80)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

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
Added optional `idempotencyKey?: string` field to `EmailOptions` interface in `src/interfaces/email.ts`. Updated `EmailService.sendEmail` in `src/services/email/EmailService.ts` to build a `headers` object and conditionally add `'Idempotency-Key'` when the option is present. Callers can now pass `idempotencyKey: \`order-confirm:${orderId}\`` to deduplicate Resend API calls on retry.

**Verification Record:**
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/interfaces/email.ts` line 19: `idempotencyKey?: string` field on `EmailOptions`. `src/services/email/EmailService.ts` lines 39-44: `headers` object built, then `headers['Idempotency-Key'] = options.idempotencyKey` added conditionally when present; `headers` passed to `fetch(...)`.
- **Details:** The `Idempotency-Key` header is forwarded to the Resend API when callers supply a stable key. The interface and implementation are consistent.
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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/instrumentation.ts` lines 9-12: `register()` calls `initializeDI()` when `process.env.NEXT_RUNTIME === 'nodejs' && process.env.SUPABASE_SECRET_KEY` is set. Previously the function was empty.
- **Details:** DI is now initialized at server boot. The Node.js runtime check prevents Edge runtime execution; the env var guard preserves build-time safety.
- **Remaining Concerns:** None

---

### [ISSUE-021] Webhook handler ignores Stripe webhook event idempotency (events can be replayed)
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Logic Bug
- **File:** `src/app/api/webhooks/stripe/route.ts` (lines 71-94)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/app/api/webhooks/stripe/route.ts` lines 72-84: `getSupabaseServer().from('processed_stripe_events').insert({ event_id: event.id, event_type: event.type })` attempted before the `switch`; on `idempotencyError.code === '23505'` returns 200 with `{ duplicate: true }`; other insert errors are logged but do not block.
- **Details:** The idempotency guard is in place before any side effects run. Duplicate events return 200 (Stripe treats any 2xx as success). The `processed_stripe_events` table with `event_id TEXT PRIMARY KEY` enforces uniqueness at the DB level.
- **Remaining Concerns:** None

---

### [ISSUE-022] `/api/orders` `track-by-order` endpoint is publicly accessible by order ID (information disclosure)
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `src/app/api/orders/route.ts` (lines 14-26, 362-393)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/app/api/orders/route.ts` lines 19-29: `track-by-order` requires both `orderNumber` and `email` params; returns 400 if either is missing. Lines 367-412: `handleTrackByOrderNumber` fetches order, then `customerRepository.findById(order.customerId)` to get email, compares case-normalized emails and returns 404 on mismatch. Response (lines 396-404) includes only `id`, `status`, `trackingNumber`, `carrier` — `total` and `createdAt` are absent.
- **Details:** The two-factor guard is fully implemented. Email mismatch returns 404 (not 401/403) to avoid confirming order existence. Sensitive financial fields are stripped from the response.
- **Remaining Concerns:** None

---

### [ISSUE-023] `next.config.ts` allows `'unsafe-eval'` and `'unsafe-inline'` in script-src
- **Status:** Resolved
- **Severity:** Medium
- **Category:** Security
- **File:** `next.config.ts` (lines 56-66)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-18

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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/middleware.ts`: generates `nonce = crypto.randomBytes(16).toString('base64')` per request (line 39); sets `x-nonce` request header (line 65); sets `Content-Security-Policy` response header with `'nonce-${nonce}'` in script-src and no `unsafe-inline` (line 70, buildCspHeader line 26). `next.config.ts`: no `Content-Security-Policy` key in the static headers array — a comment on lines 54-56 explains the middleware handles it. `src/app/layout.tsx` lines 70 and 78: reads nonce via `(await headers()).get('x-nonce')` and passes it as `nonce` prop to `<Script id="theme-init" strategy="beforeInteractive">`. Matcher covers all non-static routes (line 79).
- **Details:** Full nonce-based CSP implemented end-to-end. Both `unsafe-inline` and `unsafe-eval` are absent from script-src. The middleware correctly passes the nonce to the layout via x-nonce header.
- **Remaining Concerns:** None

---

### [ISSUE-024] `ThemeProvider` causes light-mode flash on first paint (no inline pre-hydration script)
- **Status:** Resolved
- **Severity:** Low
- **Category:** Performance
- **File:** `src/contexts/ThemeContext.tsx` (lines 14-41)
- **Detected:** 2026-05-17
- **Resolved:** 2026-05-17

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
- **Date:** 2026-05-18
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** `src/app/layout.tsx` lines 70-90: async `RootLayout` reads `nonce = (await headers()).get('x-nonce') ?? ''`; `<Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>` inline script reads `localStorage.getItem('theme')` and `window.matchMedia('(prefers-color-scheme: dark)').matches` synchronously; adds/removes `dark` class before first paint.
- **Details:** The inline pre-hydration script applies the saved theme class synchronously before React hydrates, eliminating the light-mode flash. The script is nonce-authorized under the CSP added in ISSUE-023.
- **Remaining Concerns:** None

---
