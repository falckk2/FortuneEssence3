# Fable Issue Registry
_Last updated: 2026-06-11_
_Source: project review pass (functional + SEO) by Claude Fable 5. Numbering is FABLE-XXX to avoid colliding with the resolved ISSUE-XXX registry in issues.md._

## Summary
- Total Issues: 18
- Open: 0 | In Progress: 0 | Resolved: 18 | Partially Resolved: 0 | Blocked: 0 | Wont Fix: 0

<!-- Resolution passes completed 2026-06-10 by Claude Fable 5.
     Pass 1: FABLE-001..012 (see individual resolution notes). Pass 2 (user
     sign-off given): FABLE-013 anon-client migration + RLS enablement,
     FABLE-014 private-bucket label storage. Verified by: tsc --noEmit clean,
     successful `next build`, and Supabase security advisor re-check (the
     critical rls_disabled advisory is cleared; remaining "RLS enabled no
     policy" INFO entries are the intended service-role-only state).
     FABLE-015 (always-true RLS policies on orders/inventory/carts/etc.)
     discovered by the advisor re-check — open. -->

### By Severity
- Critical: 2 (FABLE-013, 018 — resolved)
- High: 8 (FABLE-001, 002, 003, 008, 009, 014, 015, 017 — resolved)
- Medium: 4 (FABLE-004, 005, 010, 011 — resolved)
- Low: 4 (FABLE-006, 007, 012, 016 — resolved)

### Still Open / Needs Decision
None — all 18 issues resolved. The FABLE-011 translation follow-up was closed
2026-06-12: the four legal pages had dormant English content behind a hardcoded
`const locale = 'sv'` (now server components taking `locale` as a prop from
their wrappers, renamed `*Content.tsx`), `/track-order` was translated via the
`useLocale` pattern, and all five now emit hreflang alternates and sitemap
language entries — every public route is fully bilingual. Remaining follow-ups
(not defects): human review of the English legal texts before relying on them
legally; delete the seed reviews + seed customers once organic reviews exist
(ARCHITECTURE_NOTES §3). Architecture handoff for future agents:
`ARCHITECTURE_NOTES.md` (i18n design, server/client page conventions, DB
grant + search_path rules).

---

## Issues

### [FABLE-001] `/orders/track` page broken — tracking API now requires `email` param it never sends (regression from ISSUE-022)
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** High
- **Category:** Logic Bug / Regression
- **File:** `src/app/orders/track/page.tsx` (line 43), cross-referenced with `src/app/api/orders/route.ts` (lines 19-29)
- **Detected:** 2026-06-10

**Description:**
The ISSUE-022 fix (2026-05-18) changed `/api/orders?action=track-by-order` to require **both** `orderNumber` and `email` query params, returning 400 when either is missing. The resolution notes explicitly flagged the follow-up: "callers (e.g. the track-order page) will need to start passing `email` as a query parameter." That follow-up never happened. `src/app/orders/track/page.tsx` still sends only `orderNumber`, so every tracking attempt on this page now fails with a 400. The page's form has a single input (order number) — there is no email field to collect the second factor.

**Relevant Code:**
```ts
// src/app/orders/track/page.tsx line 43
const response = await fetch(`/api/orders?action=track-by-order&orderNumber=${encodeURIComponent(orderNumber.trim())}`);
```

**Suggested Solution:**
Add an email input field to the form (state, validation, label in both sv/en via the existing locale pattern) and include it in the request: `&email=${encodeURIComponent(email.trim())}`. Show the API's 404 as a generic "No order found matching that order number and email" message so the existence-hiding behavior of the API is preserved in the UI copy. Consider consolidating with `/track-order` first (see FABLE-004) so the fix is only made once.

**Resolution Notes:**
Resolved via the FABLE-004 consolidation: `/orders/track` was deleted and `/track-order` (now `src/app/track-order/TrackOrderClient.tsx`) is the single tracking page. It has an email input shown in order-number mode and calls `/api/orders/track?orderId=...&email=...`; tracking-number mode needs no email. A 404 surfaces as a generic "no order found with that order number and email" message, preserving existence-hiding. Dark-mode classes were also added to the page (it was light-only, same class of problem as ISSUE-010).

---

### [FABLE-002] `/api/orders/track` returns hardcoded mock tracking data — real implementation commented out
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** High
- **Category:** Dead Code
- **File:** `src/app/api/orders/track/route.ts` (lines 5-66 mock data, 92-193 commented-out real implementation, 195-213 mock lookup)
- **Detected:** 2026-06-10

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

---

### [FABLE-003] `/api/reviews` still returns mock reviews — ISSUE-006 scope was only partially delivered
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** High
- **Category:** Dead Code
- **File:** `src/app/api/reviews/route.ts` (lines 5-58 mock data, 60, 103-104, 164)
- **Detected:** 2026-06-10

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

---

### [FABLE-004] Two parallel order-tracking pages (`/track-order` and `/orders/track`) hitting two different APIs
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** Medium
- **Category:** Style/Pattern
- **File:** `src/app/track-order/page.tsx`, `src/app/orders/track/page.tsx`
- **Detected:** 2026-06-10

**Description:**
The site has two distinct customer-facing tracking pages: `/track-order` (calls `/api/orders/track`, the mock endpoint from FABLE-002, supports orderId or trackingNumber) and `/orders/track` (calls `/api/orders?action=track-by-order`, currently broken per FABLE-001). Two entry points for the same task means double maintenance (this is exactly how FABLE-001 happened — the fix landed against one path and missed the caller of the other), inconsistent UX, and duplicate-content/crawl-confusion for SEO once these pages are indexable.

**Relevant Code:**
```ts
// track-order/page.tsx line 69-70
? `/api/orders/track?orderId=${encodeURIComponent(searchValue)}`
: `/api/orders/track?trackingNumber=${encodeURIComponent(searchValue)}`;
// orders/track/page.tsx line 43
fetch(`/api/orders?action=track-by-order&orderNumber=${...}`);
```

**Suggested Solution:**
Pick one canonical page (suggest `/track-order` — it's the more complete UI) and one canonical API (suggest a single `/api/orders/track` once FABLE-002 rewires it to real data with the ISSUE-022 two-factor guard). Delete the other page and add a `permanent: true` redirect in `next.config.ts` `redirects()` (`/orders/track` → `/track-order`) so old links keep working. Update the Footer/Header/account links to point at the canonical page.

**Resolution Notes:**
`/orders/track` deleted; permanent redirect `/orders/track` → `/track-order` added in `next.config.ts` (query params pass through). All six internal links updated: `Footer.tsx`, `account/orders/page.tsx`, `account/orders/[id]/page.tsx`, `OrderCard.tsx` (also gained `encodeURIComponent`), and two links in `shipping-policy`. `/track-order` now reads the `?tracking=` query param (which the account-page links pass but the old page silently ignored) and auto-searches — the client component is wrapped in a Suspense boundary as `useSearchParams` requires.

---

### [FABLE-005] CORS `Access-Control-Allow-Origin` falls back to `*` for all API routes when `NEXT_PUBLIC_APP_URL` is unset
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** Medium
- **Category:** Security
- **File:** `next.config.ts` (headers() — `/api/(.*)` block)
- **Detected:** 2026-06-10

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

---

### [FABLE-006] `removeConsole` strips the `console.warn` observability added by earlier fixes in production
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** Low
- **Category:** Configuration
- **File:** `next.config.ts` (compiler.removeConsole), cross-referenced with `src/lib/auth.ts` (ISSUE-007 fix)
- **Detected:** 2026-06-10

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

---

### [FABLE-007] `_extract_json` brace counting breaks on braces inside JSON string values
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** Low
- **Category:** Logic Bug
- **File:** `agent/agent/nodes.py` (`_extract_json`, lines 159-186 — currently uncommitted working-tree change)
- **Detected:** 2026-06-10

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

---

### [FABLE-008] All 35 pages are client components — no per-page metadata, content invisible to crawlers
- **Status:** Resolved
- **Resolved:** 2026-06-11 (completed; first pass 2026-06-10)
- **Severity:** High
- **Category:** SEO
- **File:** every `src/app/**/page.tsx` (all carry `'use client'`); only `src/app/layout.tsx` exports metadata
- **Detected:** 2026-06-10

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
Pattern per page: make `page.tsx` an async Server Component that fetches data directly via the service/repository layer (not via HTTP self-fetch), passes it as props to a `'use client'` child component holding the current interactive JSX (cart, wishlist, toasts, locale switching). Add `generateMetadata({ params })` on `/products/[id]` producing per-product `title`, `description`, `openGraph.images` (product photo) from the same fetch (use React `cache()` to dedupe). Static pages just need a `export const metadata` with unique title/description — for those, the quickest fix is a thin server `page.tsx` exporting metadata and rendering the existing client component moved to a sibling file. Also set `title.template: '%s | Fortune Essence'` in the root layout so child titles compose. Admin/account/checkout/auth pages don't need conversion — instead give them `robots: { index: false }` via a small layout-level metadata export (see FABLE-009 for the robots.txt complement).

**Resolution Notes:**
**Done:** (1) `/products/[id]` is now an async Server Component (`force-dynamic` + `di-init`) that fetches the product via `IProductService.getProductWithLocalization` (deduped with React `cache()`), exports `generateMetadata` with per-product title/description/canonical/OG image, calls `notFound()` for genuinely missing products, and passes `initialProduct` to the renamed `ProductDetailClient.tsx` — which skips its own product fetch when server data is present (bundle config and related products still load client-side), so product content is in the server HTML. On infrastructure failure it degrades to the old client-fetch path instead of 404ing. (2) Ten more pages converted to thin server wrappers with unique Swedish metadata + canonicals, client code moved to sibling `*Client.tsx` files: `/products`, `/about`, `/faq`, `/how-to-use`, `/contact`, `/shipping-policy`, `/terms`, `/privacy`, `/refund`, `/track-order`. (3) Root layout has `title.template: '%s | Fortune Essence'`. (4) `tsconfig.json` now excludes the untracked `sveltekit/` directory, which was failing `next build` type-checking before any of this could ship.
**Completed 2026-06-11 (user sign-off for the full fix):** (5) Homepage split into a server `page.tsx` (locale-aware `generateMetadata`, server-side featured-products fetch via `IProductService.getFeaturedProducts()`) and `HomeClient.tsx`; if the server fetch fails, the client falls back to `/api/products/featured`, so the page degrades instead of emptying. (6) All nine auth/account pages (`auth/signin|signup|forgot-password|reset-password`, `account`, `account/settings|privacy|orders|orders/[id]`) converted to thin server wrappers exporting Swedish titles + `robots: { index: false, follow: false }`; `reset-password` wrapped in `<Suspense>` (its client reads `useSearchParams`); `OrderDetailClient` was rename-safe because it uses `useParams()`. Conversion conventions documented in `ARCHITECTURE_NOTES.md` §2 for future agents (per user request).

---

### [FABLE-009] No sitemap and no robots.txt
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** High
- **Category:** SEO
- **File:** `src/app/sitemap.ts` (missing), `src/app/robots.ts` (missing), `public/` (contains neither)
- **Detected:** 2026-06-10

**Description:**
There is no sitemap.xml or robots.txt anywhere — no `src/app/sitemap.ts`/`robots.ts` (App Router conventions) and no static files in `public/`. Crawlers have no product URL inventory (especially harmful while product pages are client-rendered, FABLE-008) and no crawl directives, so `/admin`, `/account`, `/checkout`, `/api`, and `/auth` are all crawlable. The middleware matcher already excludes `favicon.ico` but the file doesn't exist either (see FABLE-012).

**Relevant Code:**
```text
(absent) src/app/sitemap.ts
(absent) src/app/robots.ts
public/: file.svg globe.svg next.svg vercel.svg window.svg favicon.jpg
```

**Suggested Solution:**
Add `src/app/robots.ts` returning `{ rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/checkout', '/api/', '/auth', '/wishlist', '/test-orders', '/orders/track'] }], sitemap: `${appUrl}/sitemap.xml` }`. Add `src/app/sitemap.ts` that queries the products table server-side (via the repository/server client) and returns the static marketing pages plus one entry per product (`/products/${id}`, `lastModified` from `updated_at`). Both files read `NEXT_PUBLIC_APP_URL` — fail loudly (throw) if it's unset at build/runtime rather than emitting relative URLs.

**Resolution Notes:**
`src/app/robots.ts` added — disallows `/admin`, `/account`, `/api/`, `/auth`, `/checkout`, `/wishlist`, `/test-orders`, and `/shipping-labels/` (FABLE-014 band-aid), and points at the sitemap. `src/app/sitemap.ts` added — 11 static pages plus one entry per active product (`lastModified` from `updated_at`) queried via `getSupabaseServer()`, with `revalidate = 3600` so new products appear hourly without a redeploy; falls back to static pages if the DB is unreachable. Deviation from the suggestion: instead of throwing when `NEXT_PUBLIC_APP_URL` is unset, both follow the codebase's existing `config.app.url` convention (localhost fallback) and the root layout logs a `console.warn` — failing the build over it seemed disproportionate given Vercel sets it. Verified present in the build route manifest.

---

### [FABLE-010] No structured data (JSON-LD) anywhere — forfeits all rich results
- **Status:** Resolved
- **Resolved:** 2026-06-11 (completed; first pass 2026-06-10)
- **Severity:** Medium
- **Category:** SEO
- **File:** site-wide (zero matches for `application/ld+json` in `src/`)
- **Detected:** 2026-06-10

**Description:**
No page emits any schema.org structured data. For e-commerce this means no product rich results (price, availability, star ratings in SERPs), no merchant listing eligibility, no FAQ rich results, no sitelinks search box hints. Blocked-by: product JSON-LD requires server-rendered product pages (FABLE-008) to be useful, and `AggregateRating` must wait until reviews are real (FABLE-003) — emitting ratings derived from mock reviews would violate Google's structured-data guidelines and EU fake-review rules.

**Relevant Code:**
```text
grep 'application/ld+json' src/ → no matches
```

**Suggested Solution:**
After FABLE-008 lands: add a small `JsonLd` server component that renders `<script type="application/ld+json" nonce={nonce}>` — note the CSP from `src/middleware.ts` is nonce-based, so the nonce must be threaded in (the root layout already reads `x-nonce`; alternatively add `script-src-elem`-safe hashes, but nonce is simpler here). Emit: `Organization` + `WebSite` in the root layout; `Product` with nested `Offer` (price in SEK, `priceCurrency: 'SEK'`, availability from stock status) on `/products/[id]`; `BreadcrumbList` on products pages; `FAQPage` on `/faq`. Add `AggregateRating`/`Review` only once FABLE-003 is resolved with real data. Validate with Google's Rich Results Test.

**Resolution Notes:**
**Done:** `Organization` + `WebSite` JSON-LD in the root layout `<head>`, and `Product` + nested `Offer` (price, `priceCurrency: 'SEK'`, availability from stock, brand, sku, images) on `/products/[id]` — all rendered as nonce-carrying inline scripts compatible with the middleware CSP.
**Completed 2026-06-11 (user sign-off, incl. treating seed reviews as real):** (1) FAQ content extracted to `src/data/faq.ts` (locale-keyed sv+en, shared by the client accordion and the server page); `/faq` emits `FAQPage` JSON-LD via `buildFaqJsonLd(locale)` — and FaqClient gained the `useLocale` wiring and dark-mode classes it had been missing. (2) `BreadcrumbList` on `/products` (Hem › Produkter) and `/products/[id]` (… › product name), locale-aware. (3) `AggregateRating` on the Product JSON-LD from `ReviewRepository.getRatingStats()` (approved reviews only; omitted entirely at zero reviews to avoid empty-markup penalties). The former mock reviews were seeded into the `reviews` table as real rows (per user decision — see ARCHITECTURE_NOTES §3 for the seed-account cleanup plan), and the third review was adapted to the Duo Pack since no peppermint product exists. Verified live: `/api/reviews` returns the seeded reviews ("Emma L." display names via the FK-pinned embed) and the Lavendel page emits `ratingValue 4.5, reviewCount 2`. Finding FABLE-018 (missing service_role grants) was discovered during this verification. Validate with Google's Rich Results Test after deploy.

---

### [FABLE-011] Bilingual content is invisible to search engines — locale is client state, not URLs; `lang` attr hardcoded; no hreflang
- **Status:** Resolved
- **Resolved:** 2026-06-11 (URL-based /en locale; first lang-attr pass 2026-06-10)
- **Severity:** Medium
- **Category:** SEO
- **File:** `src/contexts/LocaleContext.tsx`, `src/app/layout.tsx` (line 73), site-wide (no `alternates`/`hreflang` anywhere)
- **Detected:** 2026-06-10

**Description:**
The site renders sv/en by toggling client-side state in `LocaleContext` — both languages live at the same URL. Consequences: search engines can only ever index the Swedish default (the English content has no URL to rank); `<html lang="sv">` is hardcoded and becomes wrong the moment a user (or crawler executing JS) lands in English; there are zero `hreflang`/`alternates` annotations. This is a structural decision, not a bug — but it means English organic traffic is currently zero by design.

**Relevant Code:**
```tsx
<html lang="sv" suppressHydrationWarning>
// LocaleContext: locale stored in localStorage + React state, never in the URL
```

**Suggested Solution:**
First decide whether English organic search traffic matters for the business. If yes: move to path-based locales (`/en/...` prefix, Swedish at root) — in App Router this means a `[locale]` segment (or `next-intl`), middleware locale detection/redirect, `generateMetadata` emitting `alternates: { languages: { 'sv-SE': url, 'en-US': enUrl, 'x-default': url } }`, and `<html lang={locale}>` from the route param. This is a significant refactor; sequence it after FABLE-008 since it touches the same files. If no: explicitly accept Swedish-only SEO, keep the client toggle as a UX nicety, and at minimum sync the `lang` attribute on toggle (`document.documentElement.lang = locale` in `LocaleContext`) for accessibility/correctness.

**Resolution Notes:**
~~On inspection, the minimal fix already exists … deliberately left open.~~ **Superseded 2026-06-11 — the user approved the full URL-based implementation (with future Nordic expansion in mind).** Implemented as a middleware-rewrite architecture rather than an `app/[locale]/` segment (full design rationale + extension guide in `ARCHITECTURE_NOTES.md` §1): `/en/...` rewrites to the unprefixed route with an `x-locale` request header; `/sv/...` 308-redirects to the unprefixed canonical; `/` stays Swedish. Key pieces: `src/lib/i18n.ts` (locale config + `localizePath`/`localizedAlternates` — adding a Nordic locale is a config change), `src/lib/i18n-server.ts` (`getRequestLocale()`), `LocaleContext` rewritten to derive locale purely from `usePathname()` (toggle = navigation; cookie persists preference for the middleware's one-time Accept-Language first-visit redirect), `src/components/i18n/Link.tsx` drop-in replacing `next/link` in all 43 importing files, `<html lang>` from the request locale, locale-aware `generateMetadata` with `sv-SE`/`en`/`x-default` hreflang on the 7 fully translated routes (home, products, products/[id] via DB translations, about, contact, how-to-use, faq), sitemap `alternates.languages` for those routes only, robots disallows for `/en/<private>` paths. Untranslated pages (terms, privacy, refund, shipping-policy, track-order) were initially canonical to their Swedish URL from `/en/*`; **follow-up closed 2026-06-12** — all five are now fully bilingual with hreflang + sitemap alternates (the legal pages' English content already existed in the components, dormant behind a hardcoded `const locale = 'sv'`). Security: middleware resolves locale *before* the admin gate (verified `/en/admin` → signin redirect, no bypass). Verified live against `next start`: sv/en SSR (`lang`, h1), hreflang triplets, 308 for `/sv/*`, Accept-Language first-visit 307 → `/en/*` (sv browsers unaffected), `/en` pages link-prefixed, English DB translations in Product JSON-LD, sitemap xhtml:link alternates.

---

### [FABLE-012] Weak social/OG and icon metadata: logo as OG image, no Twitter card, fragile `metadataBase`, favicon mismatch
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** Low
- **Category:** SEO
- **File:** `src/app/layout.tsx` (lines 28-56), `public/favicon.jpg`
- **Detected:** 2026-06-10

**Description:**
Several small metadata defects compound: (1) the OG image is the square 800×800 logo — link previews crop badly; the recommended canvas is 1200×630; (2) no `twitter` metadata, so X/Twitter falls back to a small summary card; (3) `metadataBase` is `undefined` when `NEXT_PUBLIC_APP_URL` is unset, which breaks resolution of the relative OG image URL (Next falls back to localhost in dev, and warns); (4) icon mismatch — metadata points `icon`/`apple` at `/images/logo.jpg` while `public/favicon.jpg` sits unused and no `favicon.ico` exists (the middleware matcher excludes one, expecting it); a JPG apple-touch-icon also won't get rounded-corner treatment properly vs PNG; (5) the `keywords` meta tag is ignored by all modern engines (harmless noise); (6) leftover create-next-app SVGs (`next.svg`, `vercel.svg`, etc.) ship in `public/`.

**Relevant Code:**
```ts
metadataBase: appUrl ? new URL(appUrl) : undefined,
icons: { icon: '/images/logo.jpg', apple: '/images/logo.jpg' },
openGraph: { images: [{ url: '/images/logo.jpg', width: 800, height: 800, ... }] },
```

**Suggested Solution:**
Create a proper 1200×630 brand OG image (product photography + logo) as `src/app/opengraph-image.png` (App Router auto-wires it, including for twitter); add `twitter: { card: 'summary_large_image' }` to root metadata. Make `metadataBase` required: throw or hard-default to the production domain instead of `undefined`. Add `src/app/icon.png` (512×512 PNG) and `src/app/apple-icon.png` (180×180), and a real `public/favicon.ico`; remove the `icons` metadata block (file conventions supersede it) and delete the unused `public/favicon.jpg` + create-next-app SVGs. Drop the `keywords` field. Per-product OG images come with FABLE-008's `generateMetadata`.

**Resolution Notes:**
(1) Generated `public/images/og-image.jpg` (1200×630, 71 KB) as a center-crop of the existing `hero-lifestyle.png` product photography — visually verified (diffuser + branded lavender bottle); root OG metadata points at it with correct declared dimensions (the old block claimed 800×800 for a 3072×4096 logo). (2) `twitter: { card: 'summary_large_image' }` added. (3) `metadataBase` is now always a `URL` (localhost fallback + `console.warn` when `NEXT_PUBLIC_APP_URL` is unset, surviving prod builds per FABLE-006). (4) Generated `src/app/icon.png` (512²), `src/app/apple-icon.png` (180²), and `src/app/favicon.ico` (48px) from a square crop of the gold drop emblem in `logo.jpg`; removed the `icons` metadata block in favor of file conventions; both icons confirmed in the build route manifest. (5) `keywords` dropped; `public/favicon.jpg` and the five create-next-app SVGs (verified unreferenced) deleted. (6) `openGraph.siteName` added.

---

### [FABLE-013] Row Level Security disabled on 13 tables — fully exposed to the anon key
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** Critical
- **Category:** Security
- **File:** Supabase project `hvxggcskfwnayjvzdein` (database, not repo)
- **Detected:** 2026-06-10 (Supabase advisor, surfaced during FABLE-003 schema work)

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
User sign-off given 2026-06-10; executed in the required sequence. (1) All six paths migrated to the server-role client: `AuthService` and `InventoryService` now inject `TOKENS.SupabaseServerClient`; `GDPRService` and `ShippingRepository` use a lazy `private get supabase()` returning `getSupabaseServer()` (lazy so modules load at build time without env vars); `AbandonedCartRepository` passes `getSupabaseServer()` to `super()`; the newsletter route calls `getSupabaseServer()` per query. Side benefit: GDPR export/delete also queried the RLS-protected `customers` table via the anon client — it was silently broken and now works. (2) Re-grep confirmed the only remaining anon-client users (`CartRepository`, `OrderRepository`, `InventoryRepository`, di-container registration, update-bundle-images) touch none of the 13 tables. (3) Applied migration `enable_rls_on_exposed_tables` (all 13 tables, no policies — service role only). Advisor re-check: the critical `rls_disabled` advisory is gone; the remaining `rls_enabled_no_policy` INFO entries are the intended locked-down state. The re-check surfaced a separate pre-existing problem now tracked as [FABLE-015].

---

### [FABLE-014] Customer shipping-label PDFs publicly served from `public/shipping-labels/`
- **Status:** Resolved
- **Resolved:** 2026-06-10
- **Severity:** High
- **Category:** Security
- **File:** `public/shipping-labels/*.pdf` (5 files), generated by the label flow (`src/services/shipping/LabelGenerationService.ts` / `src/app/api/shipping/labels/*`)
- **Detected:** 2026-06-10

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

---

### [FABLE-015] Always-true RLS policies let the anon key write to orders, inventory, carts, and more
- **Status:** Resolved
- **Resolved:** 2026-06-11
- **Severity:** High
- **Category:** Security
- **File:** Supabase project `hvxggcskfwnayjvzdein` (policies), plus `src/repositories/{orders/OrderRepository,cart/CartRepository,inventory/InventoryRepository}.ts` and `src/app/api/admin/update-bundle-images/route.ts` (anon-client users that depend on them)
- **Detected:** 2026-06-10 (Supabase advisor re-check after FABLE-013)

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

These policies exist because `OrderRepository`, `CartRepository`, and `InventoryRepository` still use the anon client (`@/lib/supabase`) — the permissive policies are what makes those repositories work at all. This is the same anti-pattern FABLE-013 removed for the 13 formerly RLS-disabled tables. The `orders` UPDATE policy is the worst of it: an attacker can mark any order shipped/delivered, change tracking numbers, or alter totals directly via the Supabase REST API.

**Relevant Code:**
```text
Advisor: rls_policy_always_true on public.orders ("Allow update orders", UPDATE, anon+authenticated, USING true / WITH CHECK true)
Code:    src/repositories/orders/OrderRepository.ts:4  import { supabase } from '@/lib/supabase';
```

**Suggested Solution:**
Repeat the FABLE-013 sequence: (1) migrate `OrderRepository`, `CartRepository`, `InventoryRepository`, and `update-bundle-images/route.ts` to the server-role client (all are server-side code; same pattern as the six paths already migrated); (2) verify no client-side component queries these tables directly with the anon client (carts are touched via API routes, but confirm); (3) DROP the always-true write policies (keep deliberate public-read SELECT policies, e.g. on products); (4) re-run the advisor and confirm `rls_policy_always_true` clears. Sequencing matters — dropping the policies before migrating the repositories breaks order creation, cart updates, and inventory adjustments.

**Resolution Notes:**
Followed the suggested migrate-first sequence on 2026-06-11:
1. **Code migration:** `OrderRepository` now calls `super(getSupabaseServer())` (same pattern as AbandonedCartRepository); `CartRepository` and `InventoryRepository` got a lazy `private get supabase()` getter returning `getSupabaseServer()` (request-time only, build-safe); `update-bundle-images/route.ts` swapped to `getSupabaseServer()`. Grep confirmed zero remaining `@/lib/supabase` imports outside `di-container.ts` (which still registers the anon token for the public-read ProductRepository/BundleRepository — intended).
2. **Verification before dropping:** a `pg_policies` dump showed the situation was worse than the advisor summary — anon could also **SELECT every order, cart, order_item, and shipping_label** (always-true read policies), not just write. Confirmed `stock_reservations` access goes through InventoryService (server client since FABLE-013) and `returns`/`return_items` through ReturnRepository (already `getSupabaseServer()`); confirmed no other `createClient` call sites and that ProductRepository does not join `inventory`.
3. **Migration `drop_always_true_rls_policies`:** dropped 18 policies — all always-true read/write policies on `carts` (4), `customers` (2 INSERTs), `inventory` (SELECT+UPDATE), `orders` (3), `order_items` (2), `returns`/`return_items` (blanket ALL for authenticated), `shipping_labels` (2), `stock_reservations` (ALL), plus the duplicate `products` read policy ("Allow read products"; public read remains via "Allow public read access to products"). Scoped `auth.uid()`-based policies and intended public-read policies (products, bundle_configurations, shipping_rates, oil_knowledge) were kept.
4. **Verified:** `tsc --noEmit` clean, `next build` passing, advisor re-check shows `rls_policy_always_true` fully cleared. The remaining `rls_enabled_no_policy` INFO entries are the intended service-role-only state.

---

### [FABLE-016] Supabase advisor hygiene WARNs: mutable function search_path (12 functions) and extensions in public schema (5)
- **Status:** Resolved
- **Resolved:** 2026-06-11 (functions first, extension relocation completed same day after user sign-off)
- **Severity:** Low
- **Category:** Security
- **File:** Supabase project `hvxggcskfwnayjvzdein` (database functions/extensions, not repo)
- **Detected:** 2026-06-10 (Supabase advisor re-check after FABLE-013)

**Description:**
Two WARN-level lint classes remain after the FABLE-013/015 work:
1. `function_search_path_mutable` — 12 functions lack a pinned `search_path` (`update_returns_updated_at`, `update_stock_reservation_timestamp`, `update_newsletter_subscription_timestamp`, `expire_old_reservations`, `cleanup_expired_reset_tokens`, `update_bundle_configurations_updated_at`, `match_oil_knowledge`, `create_inventory_for_product`, `update_abandoned_carts_updated_at`, `is_order_eligible_for_return`, `calculate_return_refund`, `update_contact_submission_timestamp`, `update_updated_at_column`). A role-mutable search_path allows schema-shadowing attacks against SECURITY DEFINER functions; most of these are trigger helpers, so practical risk is low, but pinning is cheap. (The new `increment_review_helpful` from FABLE-003 already pins `search_path = public`.)
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

---

### [FABLE-017] Returns creation broken — `create_return_with_items` RPC never existed in the database
- **Status:** Resolved
- **Resolved:** 2026-06-11
- **Severity:** High
- **Category:** Logic Bug / Missing Database Object
- **File:** `src/repositories/returns/ReturnRepository.ts` (line 20) vs Supabase project `hvxggcskfwnayjvzdein`
- **Detected:** 2026-06-11 (pg_proc audit during FABLE-016 extension relocation pre-flight)

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
Migration `create_return_with_items_function` adds `public.create_return_with_items(uuid, uuid, varchar, text, numeric, varchar, text, varchar, jsonb) returns uuid` — plpgsql, SECURITY DEFINER, `SET search_path = public, extensions` (per the FABLE-016 maintenance rule). Inserts the return, loops `jsonb_array_elements(p_items)` inserting items (`order_item_id` = `product_id` = item `productId`), returns the new id; a failure anywhere rolls the whole thing back. EXECUTE revoked from `public`/`anon`/`authenticated` and granted only to `service_role`, matching how ReturnRepository calls it (server-role client). No code change needed — the repository's call signature was treated as the contract.

---

### [FABLE-018] service_role had no table grants — every server-client query failed with "permission denied"
- **Status:** Resolved
- **Resolved:** 2026-06-11
- **Severity:** Critical
- **Category:** Database Configuration / Latent Production Bug
- **File:** Supabase project `hvxggcskfwnayjvzdein` (table ACLs), affects every consumer of `getSupabaseServer()`
- **Detected:** 2026-06-11 (missing AggregateRating during FABLE-010 verification — the rating-stats query silently returned a failure)

**Description:**
Only 5 of 30 public tables had any GRANT for the `service_role` role; `orders`, `customers`, `reviews` and most others granted only `postgres`, `anon`, `authenticated`. Because PostgreSQL GRANTs are checked before (and independently of) RLS, the service-role key's famous "bypasses RLS" property is irrelevant when the role lacks the GRANT itself — every query through the server client failed with `permission denied for table ...`. Verified directly: a standalone script using `SUPABASE_SECRET_KEY` (JWT role claim decoded and confirmed as `service_role`) got permission-denied on `reviews`, `orders` and `customers`.

Blast radius: everything migrated to `getSupabaseServer()` was silently broken at runtime — CustomerRepository (since ISSUE-002), AuthService password reset, GDPRService export/delete, newsletter, ShippingRepository, InventoryService (since FABLE-013), OrderRepository/CartRepository/InventoryRepository (since FABLE-015), ReviewRepository (since FABLE-003). The app *appeared* to work because the most visible read paths (products, bundles) still use the anon client, and most repository methods translate errors into `{ success: false }` responses that callers render as empty states. This also retroactively explains why the always-true anon policies (FABLE-015) existed: writes through the anon key were the only thing that actually worked.

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

---
