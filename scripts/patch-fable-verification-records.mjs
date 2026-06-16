/**
 * Fill empty Verification Record sections for ISSUE-051..068.
 * Run: node scripts/patch-fable-verification-records.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const issuesPath = resolve(__dirname, '..', 'issues.md');

const RECORDS = {
  '051': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`src/app/orders/track/page.tsx\` absent; \`TrackOrderClient.tsx\` sends \`orderId\`+ \`email\`; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-051); cross-check \`__tests__/issues/issue-021-030-verification.test.ts\` (ISSUE-022).
- **Details:** Re-verified 2026-06-16. ISSUE-022 second-factor guard lives on \`/api/orders/track\`; old \`/orders/track\` page and \`track-by-order\` action are gone.
- **Remaining Concerns:** None`,
  '052': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`src/app/api/orders/track/route.ts\` — DI wiring, \`orderService.trackOrder\`/\`getOrder\`, no \`mockOrderTracking\`, no \`.or(\` interpolation; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-052).
- **Details:** Re-verified 2026-06-16. Endpoint is production-ready against real services; mock block fully removed.
- **Remaining Concerns:** None`,
  '053': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`src/app/api/reviews/route.ts\`, \`src/app/api/reviews/[id]/helpful/route.ts\`, \`src/repositories/reviews/ReviewRepository.ts\` — no \`mockReviews\`, uses \`SupabaseServerClient\`, pinned FK embed; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-053).
- **Details:** Re-verified 2026-06-16. GET/POST/helpful routes wired to \`ReviewRepository\`; helpful vote requires session (401).
- **Remaining Concerns:** \`create_reviews_tables\` migration not checked into \`database/migrations/\` (applied directly to Supabase); live DB schema not re-probed in this pass. Reviews remain auto-approved; seed reviews still present per ARCHITECTURE_NOTES §3.`,
  '054': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`next.config.ts\` permanent redirect; internal links grep to \`/track-order\` only; \`TrackOrderClient.tsx\` handles \`?tracking=\`; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-054).
- **Details:** Re-verified 2026-06-16. Single canonical page and API; old page file absent.
- **Remaining Concerns:** None`,
  '055': `- **Date:** 2026-06-16
- **Method:** Automated Test
- **Verdict:** Resolved
- **Evidence:** \`next.config.ts\` — conditional \`apiCorsBlock\`, no \`|| '*'\` fallback; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-055).
- **Details:** Re-verified 2026-06-16. Fail-closed CORS behavior confirmed in config.
- **Remaining Concerns:** None`,
  '056': `- **Date:** 2026-06-16
- **Method:** Automated Test
- **Verdict:** Resolved
- **Evidence:** \`next.config.ts\` \`exclude: ['error', 'warn']\`; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-056).
- **Details:** Re-verified 2026-06-16. Production builds retain \`console.warn\` for ops signals (ISSUE-007, rate-limiter, layout env warning).
- **Remaining Concerns:** None`,
  '057': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`agent/agent/nodes.py\` uses \`JSONDecoder().raw_decode\`; \`agent/__tests__/test_extract_json.py\` (4 tests, braces-in-strings + fence stripping); \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-057 source check).
- **Details:** Re-verified 2026-06-16. Parser correctly handles \`{\`/\`}\` inside JSON string values; non-object JSON rejected.
- **Remaining Concerns:** None`,
  '058': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** Public/marketing \`page.tsx\` files export \`generateMetadata\` without \`'use client'\`; \`src/app/products/[id]/page.tsx\` server-fetches via \`getProductWithLocalization\`; only \`admin/\`, \`checkout/\`, \`wishlist/\`, \`test-orders/\` remain client \`page.tsx\`; \`layout.tsx\` has \`title.template\`; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-058).
- **Details:** Re-verified 2026-06-16. Intentional client-only pages limited to admin/checkout/wishlist/test per resolution scope.
- **Remaining Concerns:** None`,
  '059': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`src/app/robots.ts\`, \`src/app/sitemap.ts\` present with disallow rules + product enumeration; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-059).
- **Details:** Re-verified 2026-06-16. Sitemap includes all 11 static routes (incl. bilingual legal pages + track-order) with \`languageAlternates\`.
- **Remaining Concerns:** Live sitemap/robots HTTP output not fetched in this pass (no running server). \`NEXT_PUBLIC_APP_URL\` still falls back to localhost rather than failing the build (accepted deviation).`,
  '060': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`application/ld+json\` in \`layout.tsx\`, \`products/[id]/page.tsx\`, \`products/page.tsx\`, \`faq/page.tsx\`; \`buildFaqJsonLd\` in \`src/data/faq.ts\`; \`AggregateRating\` from \`getRatingStats\`; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-060).
- **Details:** Re-verified 2026-06-16. Organization, WebSite, Product+Offer, FAQPage, BreadcrumbList, and conditional AggregateRating all present in source.
- **Remaining Concerns:** Google Rich Results Test not run in this pass. Seed reviews still power AggregateRating until organic reviews replace them.`,
  '061': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`src/lib/i18n.ts\`, \`src/middleware.ts\`, \`src/contexts/LocaleContext.tsx\`, \`layout.tsx\` \`<html lang={locale}>\`, legal \`*Content.tsx\` take \`locale\` prop; \`sitemap.ts\` \`languageAlternates\` on all 11 static routes; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-061).
- **Details:** Re-verified 2026-06-16. URL-based locale, hreflang helpers, and bilingual legal/track-order pages confirmed in source.
- **Remaining Concerns:** Live middleware redirect/rewrite behavior not re-tested against a running server in this pass. English legal copy should receive human legal review before production reliance.`,
  '062': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`layout.tsx\` OG 1200×630, \`twitter.card\`, \`metadataBase: new URL(appUrl)\`; \`src/app/icon.png\`, \`apple-icon.png\`, \`favicon.ico\` exist; \`public/favicon.jpg\` absent; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-062).
- **Details:** Re-verified 2026-06-16. Icon/OG conventions and metadata cleanup confirmed.
- **Remaining Concerns:** None`,
  '063': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`AuthService\`, \`GDPRService\`, \`InventoryService\`, \`ShippingRepository\`, \`AbandonedCartRepository\`, \`newsletter/route.ts\` use server client; only \`di-container.ts\` imports \`@/lib/supabase\`; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-063).
- **Details:** Re-verified 2026-06-16. Code-side prerequisite migration complete; anon client isolated to DI registration for public-read repos.
- **Remaining Concerns:** \`enable_rls_on_exposed_tables\` migration not in repo; live Supabase RLS state not re-checked in this pass.`,
  '064': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`LabelGenerationService.ts\` uploads to \`shipping-labels\` bucket; \`labels/download/route.ts\` streams from storage with admin/owner check; \`public/shipping-labels/\` absent and gitignored; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-064).
- **Details:** Re-verified 2026-06-16. No public PDF directory; authorized download path confirmed.
- **Remaining Concerns:** Private bucket existence/config on Supabase not re-verified in this pass.`,
  '065': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`OrderRepository\`, \`CartRepository\`, \`InventoryRepository\`, \`update-bundle-images/route.ts\` use \`getSupabaseServer()\`; no \`@/lib/supabase\` outside \`di-container.ts\`; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-065); existing \`__tests__/repositories/{Order,Cart,Inventory}Repository.test.ts\`.
- **Details:** Re-verified 2026-06-16. Repository code migration complete; always-true policy removal depends on live DB state from prior pass.
- **Remaining Concerns:** \`drop_always_true_rls_policies\` migration not in repo; live Supabase advisor not re-run in this pass.`,
  '066': `- **Date:** 2026-06-16
- **Method:** Code Inspection
- **Verdict:** Resolved
- **Evidence:** \`ARCHITECTURE_NOTES.md\` documents \`search_path = public, extensions\` maintenance rule; prior resolution notes reference \`pin_search_path_on_functions\` and \`relocate_extensions_out_of_public\` migrations applied live.
- **Details:** Re-verified 2026-06-16. Codebase documents the hygiene rule for future migrations; live DB function/extension state not re-probed.
- **Remaining Concerns:** Neither \`pin_search_path_on_functions\` nor \`relocate_extensions_out_of_public\` SQL is checked into \`database/migrations/\`; Supabase advisor not re-run in this pass.`,
  '067': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`ReturnRepository.ts\` calls \`rpc('create_return_with_items', …)\` via \`getSupabaseServer()\`; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-067).
- **Details:** Re-verified 2026-06-16. Application code contract matches the resolution spec.
- **Remaining Concerns:** Checked-in \`database/migrations/015_create_return_with_items_rpc.sql\` **drifts** from production spec (no \`SECURITY DEFINER\`, no \`search_path\` pin, grants \`EXECUTE\` to \`authenticated\`). Live RPC existence not re-probed; repo migration should be updated to match what was applied.`,
  '068': `- **Date:** 2026-06-16
- **Method:** Combined
- **Verdict:** Resolved
- **Evidence:** \`ReviewRepository\` + \`CustomerRepository\` use \`SupabaseServerClient\`/\`getSupabaseServer()\`; \`products/[id]/page.tsx\` logs rating/product fetch errors; pinned FK embed; \`__tests__/issues/fable-001-018-verification.test.ts\` (ISSUE-068).
- **Details:** Re-verified 2026-06-16. Consumer hardening and error surfacing confirmed; grants migration applied live per prior pass.
- **Remaining Concerns:** \`grant_service_role_on_public_tables\` migration not in repo; live \`relacl\` grants not re-probed in this pass.`,
};

let content = readFileSync(issuesPath, 'utf8');

for (const [num, record] of Object.entries(RECORDS)) {
  const id = `ISSUE-${num}`;
  const emptyPattern = new RegExp(
    `(### \\[${id}\\][\\s\\S]*?\\*\\*Verification Record:\\*\\*)\\s*(?=\\n---|\\n### \\[ISSUE-|\\s*$)`,
    'm'
  );
  const match = content.match(emptyPattern);
  if (!match) {
    if (content.includes(`### [${id}]`) && content.includes(`**Verification Record:**\n- **Date:**`)) {
      continue;
    }
    console.error(`Could not patch ${id}`);
    process.exit(1);
  }
  content = content.replace(emptyPattern, `$1\n${record}\n`);
}

writeFileSync(issuesPath, content, 'utf8');
console.log('Patched Verification Record for ISSUE-051..068');