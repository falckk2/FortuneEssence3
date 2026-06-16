# Architecture Notes — Handoff for Future Agents/Developers

_Last updated: 2026-06-12 (Claude Fable 5 session — FABLE-008/010/011/015/016/017; §5 DI/async-module gotcha)._
_Cross-reference: `issues.md` (ISSUE-001..068) for the full issue registry._

This file documents deliberate architectural decisions made during the June 2026
resolution pass, so that anyone debugging a regression knows what is intentional,
how it works, and where the bodies are buried.

---

## 1. URL-based localization (FABLE-011)

### How it works
- **The URL prefix is the single source of truth for locale.** Swedish (default)
  lives at unprefixed URLs (`/products`); English at `/en/products`. Visiting
  `/sv/...` 308-redirects to the unprefixed canonical.
- **No `app/[locale]/` segment.** Pages stay at their normal locations. Instead,
  `src/middleware.ts` strips the `/en` prefix via `NextResponse.rewrite` and
  forwards the locale in the `x-locale` request header. This works because the
  nonce-based CSP already makes every page dynamically rendered (the root layout
  reads `headers()`), so nothing static was lost.
- **Config lives in `src/lib/i18n.ts`**: `locales`, `defaultLocale`,
  `localizePath`, `splitLocaleFromPath`, `localizedAlternates`, header/cookie
  names. `src/lib/i18n-server.ts` has `getRequestLocale()` (reads `x-locale`,
  server-only). To add a Nordic locale: extend `locales` + `hreflangValues`,
  then add translations (see "Adding a locale" below).
- **Client side:** `LocaleContext` derives the locale from `usePathname()` —
  there is no locale state to get out of sync. `setLocale`/`toggleLocale`
  navigate to the same page under the other prefix and persist a `NEXT_LOCALE`
  cookie. `src/components/i18n/Link.tsx` is a drop-in `next/link` replacement
  that prefixes internal hrefs with the current locale; **all 43 files that
  imported `next/link` were switched to it — new code must import from
  `@/components/i18n/Link`, not `next/link`.**
- **First-visit detection:** middleware redirects a cookie-less GET from an
  `Accept-Language: en*` browser to the `/en` equivalent, once, then sets the
  cookie. Crawlers without Accept-Language are unaffected.
- **Security note:** middleware resolves the locale **before** the admin gate
  and checks the *delocalized* path, so `/en/admin` cannot bypass auth. If you
  reorder middleware logic, keep that ordering.

### SEO wiring
- **Every public page is now fully translated** (follow-up closed 2026-06-12):
  all 12 static routes plus `/products/[id]` emit hreflang alternates
  (`sv-SE`, `en`, `x-default` → sv) via `localizedAlternates()` in their
  `generateMetadata`, and appear in `sitemap.ts` with `alternates.languages`.
- The legal pages (`/terms`, `/privacy`, `/refund`, `/shipping-policy`)
  already contained dormant English content behind a hardcoded
  `const locale = 'sv'`; they are **server components** taking `locale` as a
  prop from their page wrapper (named `*Content.tsx`, not `*Client.tsx`,
  because they have no interactivity). The English legal texts were authored
  earlier in the project's history — **have a human review them against the
  Swedish originals before relying on them legally.**
- `/track-order` UI strings were translated via the standard `useLocale`
  ternary pattern.
- `robots.ts` disallows the `/en/`-prefixed variants of all private routes.

### Known limitations (accepted)
- `router.push('/...')` calls in checkout/account flows are not locale-prefixed.
  Those pages are noindex, and the UI language still follows the URL the user
  was on, so the only effect is the URL dropping the `/en` prefix mid-flow.
- Content translated via inline `locale === 'sv' ? ... : ...` ternaries is the
  established pattern (23+ components). A future migration to message catalogs
  would help the Nordic expansion but was out of scope.

### Adding a locale (e.g. `no`)
1. Add `'no'` to `Locale` in `src/types/index.ts`, `locales` and
   `hreflangValues` in `src/lib/i18n.ts`.
2. Add translations: `src/data/faq.ts` (Record<Locale, string> — compiler will
   point at every missing key), the ternary branches in client components
   (these will NOT be caught by the compiler — grep `locale === 'sv'`), and
   DB product translations (`products.translations` JSON + the
   `getProductWithLocalization` service).
3. Localized metadata in each `generateMetadata` (grep `getRequestLocale`).
4. Done — middleware, Link, sitemap, hreflang all pick the new locale up from
   the config.

---

## 2. Server-component conversions (FABLE-008)

- **Pattern:** every public page is a *server* `page.tsx` (metadata, JSON-LD,
  optional server-side data fetch) rendering a `*Client.tsx` sibling
  (`'use client'`, all interactivity). If you add a page, follow this split.
- **Homepage:** `src/app/page.tsx` (server) fetches featured products via the
  DI container (`IProductService.getFeaturedProducts()`) and passes them to
  `src/app/HomeClient.tsx` as `initialProducts`. If the server fetch returns
  null (infra failure), HomeClient falls back to fetching
  `/api/products/featured` client-side — so a broken DI container degrades to
  the old behavior instead of an empty page. The same fallback pattern exists
  in `products/[id]` (`initialProduct`).
- **Auth/account pages** (`auth/signin|signup|forgot-password|reset-password`,
  `account`, `account/settings|privacy|orders|orders/[id]`): thin server
  wrappers exporting `title` + `robots: { index: false, follow: false }`.
  `reset-password` is wrapped in `<Suspense>` because its client reads
  `useSearchParams`. `OrderDetailClient` uses `useParams()` (not the params
  prop), which is why the rename was safe.
- **JSON-LD convention:** inline `<script type="application/ld+json">` MUST
  carry `nonce={(await headers()).get('x-nonce') ?? ''}` or the CSP will block
  it. Grep `application/ld+json` for examples (layout, faq, products,
  products/[id]).

---

## 3. Reviews & structured data (FABLE-010)

- FAQ content lives in `src/data/faq.ts`, locale-keyed, shared by the client
  accordion and the server page's `FAQPage` JSON-LD (`buildFaqJsonLd(locale)`).
- Product pages emit `Product` (+`AggregateRating` when approved reviews
  exist) and `BreadcrumbList` JSON-LD. Rating stats come from
  `ReviewRepository.getRatingStats()`.
- **The three "reviews" in the DB are seeded** (former mock data, user decision
  2026-06-11 to treat as real until organic reviews arrive). Seed customers are
  `seed.anna|emma|sofia@fortuneessence.se` with password hash
  `SEED-REVIEW-ACCOUNT-LOGIN-DISABLED` (not a valid bcrypt hash → cannot log
  in). **When real reviews accumulate, delete the seed reviews + customers.**

---

## 4. Database conventions (FABLE-013/015/016/017/018)

- **All application reads/writes to RLS-protected tables go through the
  service-role client** (`getSupabaseServer()`), never the anon client
  (`@/lib/supabase`). The anon client remains ONLY for public-read tables
  (products, bundles via `TOKENS.SupabaseClient`). "RLS enabled, no policies"
  INFO advisories on most tables are the *intended* service-role-only state.
- **Extensions live in the `extensions` schema** (not `public`). Because of
  this, **every new DB function must pin `SET search_path = public, extensions`**
  — `public` alone will fail to resolve pgvector's `<=>`, citext operators, or
  `uuid_generate_v4()`. SECURITY DEFINER functions additionally get EXECUTE
  revoked from `public, anon, authenticated` and granted to `service_role`
  (see `increment_review_helpful`, `create_return_with_items`).
- `create_return_with_items` (FABLE-017) is the atomic return-creation RPC;
  its parameter list is a contract with `ReturnRepository.create()` — change
  both together.
- **GRANTs matter even with the service key (FABLE-018).** "service_role
  bypasses RLS" does NOT bypass SQL GRANTs — a table without
  `GRANT ... TO service_role` permission-denies the server client entirely,
  and most repositories swallow that into `{ success: false }` → empty UI
  states, so it fails silently. Default privileges for the `postgres` role now
  auto-grant service_role on new tables, but if a table is created by another
  role, verify with `select relname, relacl from pg_class where relname = '...'`.
- **PostgREST embeds from `reviews` to `customers` must name the FK**
  (`customers!reviews_customer_id_fkey`) — the relationship is ambiguous
  because `review_helpful_votes` provides a second path. The same applies to
  any future table with two join paths.

---

## 5. DI container vs webpack "async modules" (2026-06-12)

- `configureDependencyInjection()` loads every service with a CommonJS-style
  `require()`. If a service module (or anything it statically imports) becomes
  a webpack **async module**, that `require()` silently returns `{}`, the
  registration becomes `useClass: undefined`, and resolving the token throws
  `TypeInfo not known for "undefined"` at runtime — surfacing as an HTML 500
  from any route that resolves the service at module scope (the client then
  reports `Unexpected token '<' … is not valid JSON`).
- What makes a module async: top-level await, or a static import of a package
  that is **externalized as ESM**. That second case is what broke
  `IShippingService`: `bwip-js` is in `serverExternalPackages`
  (next.config.ts) and its `node`+`import` export condition resolves to an
  `.mjs` build, so importing it made `LabelGenerationService` (and everything
  that imports it) async.
- Fix/rule: services registered in the DI container must not statically import
  ESM-externalized packages. Import them lazily inside the method instead —
  see `LabelGenerationService.generateBarcode()` (`await import('bwip-js')`).
  If you add a package to `serverExternalPackages`, check whether its `import`
  condition points at an ESM build before importing it from a DI-registered
  module.

---

## 6. Things that look wrong but aren't

- `next build` warns about multiple lockfiles — known, benign.
- The `sveltekit/` directory is excluded in `tsconfig.json`; don't remove the
  exclusion or type-checking breaks on unrelated code.
- Every page renders dynamically (no SSG) — this is forced by the nonce-based
  CSP and is required for it; don't "fix" pages back to static.
- `/en/account` etc. render (middleware strips the prefix for all non-API
  paths) but are noindex + robots-disallowed. Harmless by design.
