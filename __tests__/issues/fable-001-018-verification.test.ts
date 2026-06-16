import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', '..');

function readSrc(relativePath: string): string {
  return fs.readFileSync(path.join(root, 'src', relativePath), 'utf8');
}

function readRoot(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(root, relativePath));
}

function listPageFiles(): string[] {
  const appDir = path.join(root, 'src', 'app');
  const results: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === 'page.tsx') {
        results.push(full);
      }
    }
  }

  walk(appDir);
  return results;
}

describe('FABLE-001 through FABLE-018 code verification', () => {
  describe('FABLE-001 /orders/track regression (ISSUE-022 follow-up)', () => {
    it('removes the broken /orders/track page', () => {
      expect(fileExists('src/app/orders/track/page.tsx')).toBe(false);
    });

    it('requires orderId and email on the canonical track endpoint', () => {
      const source = readSrc('app/api/orders/track/route.ts');
      expect(source).toContain('orderId');
      expect(source).toContain('email');
      expect(source).toMatch(/customerEmail !== suppliedEmail/);
      expect(source).not.toMatch(/total:\s*order\.total/);
    });

    it('collects email on the track-order client and passes it to the API', () => {
      const source = readSrc('app/track-order/TrackOrderClient.tsx');
      expect(source).toContain('orderId=');
      expect(source).toContain('&email=');
      expect(source).toMatch(/searchType === 'order' && !email\.trim\(\)/);
      expect(source).toMatch(/order number and email/i);
    });
  });

  describe('FABLE-002 real tracking endpoint', () => {
    it('rewires /api/orders/track to DI services without mock data', () => {
      const source = readSrc('app/api/orders/track/route.ts');
      expect(source).toContain("export const dynamic = 'force-dynamic'");
      expect(source).toContain("import '@/config/di-init'");
      expect(source).toContain('IOrderService');
      expect(source).toContain('orderService.trackOrder');
      expect(source).toContain('orderService.getOrder');
      expect(source).not.toContain('mockOrderTracking');
      expect(source).not.toMatch(/\.or\(`id\.eq\./);
    });
  });

  describe('FABLE-003 real reviews API', () => {
    it('uses ReviewRepository instead of mock reviews', () => {
      const route = readSrc('app/api/reviews/route.ts');
      const helpful = readSrc('app/api/reviews/[id]/helpful/route.ts');
      const repo = readSrc('repositories/reviews/ReviewRepository.ts');

      expect(route).toContain('IReviewRepository');
      expect(route).toContain('reviewRepository.findByProductId');
      expect(route).not.toContain('mockReviews');
      expect(route).not.toContain('TODO: Fetch from database');
      expect(helpful).toContain('reviewRepository.markHelpful');
      expect(helpful).toContain('getServerSession(authOptions)');
      expect(helpful).toContain('status: 401');
      expect(repo).toContain('SupabaseServerClient');
      expect(repo).toContain('customers!reviews_customer_id_fkey');
    });
  });

  describe('FABLE-004 consolidated tracking pages', () => {
    it('redirects /orders/track to /track-order and updates internal links', () => {
      const config = readRoot('next.config.ts');
      expect(config).toContain("source: '/orders/track'");
      expect(config).toContain("destination: '/track-order'");
      expect(config).toContain('permanent: true');

      const footer = readSrc('components/layout/Footer.tsx');
      expect(footer).toContain("href: '/track-order'");
      expect(footer).not.toContain('/orders/track');
    });

    it('auto-searches when ?tracking= is present', () => {
      const source = readSrc('app/track-order/TrackOrderClient.tsx');
      expect(source).toContain("searchParams.get('tracking')");
      expect(source).toContain("performSearch('tracking'");
    });
  });

  describe('FABLE-005 CORS fail-closed', () => {
    it('omits CORS headers when NEXT_PUBLIC_APP_URL is unset', () => {
      const source = readRoot('next.config.ts');
      expect(source).toContain('const corsOrigin = process.env.NEXT_PUBLIC_APP_URL');
      expect(source).toContain('const apiCorsBlock = corsOrigin');
      expect(source).not.toMatch(/\|\|\s*'\*'/);
    });
  });

  describe('FABLE-006 removeConsole preserves warn', () => {
    it('keeps console.warn in production builds', () => {
      const source = readRoot('next.config.ts');
      expect(source).toMatch(/exclude:\s*\['error',\s*'warn'\]/);
    });
  });

  describe('FABLE-007 _extract_json brace handling', () => {
    it('uses JSONDecoder.raw_decode instead of manual brace counting', () => {
      const source = fs.readFileSync(
        path.join(root, 'agent', 'agent', 'nodes.py'),
        'utf8'
      );
      expect(source).toContain('json.JSONDecoder().raw_decode(text[start:])');
      expect(source).not.toMatch(/depth\s*[+\-]=\s*1/);
    });
  });

  describe('FABLE-008 server-rendered public pages', () => {
    it('converts marketing/product pages to server wrappers with metadata', () => {
      const serverPages = [
        'app/page.tsx',
        'app/products/page.tsx',
        'app/products/[id]/page.tsx',
        'app/about/page.tsx',
        'app/faq/page.tsx',
        'app/contact/page.tsx',
        'app/track-order/page.tsx',
      ];

      for (const page of serverPages) {
        const source = readSrc(page);
        expect(source).not.toContain("'use client'");
        expect(source).toMatch(/generateMetadata|export const metadata/);
      }
    });

    it('keeps interactive admin/checkout pages as client components with noindex', () => {
      const privatePages = [
        'app/auth/signin/page.tsx',
        'app/account/page.tsx',
        'app/checkout/page.tsx',
      ];

      for (const page of privatePages) {
        const source = readSrc(page);
        if (page.includes('checkout')) {
          expect(source).toContain("'use client'");
        } else {
          expect(source).toContain('robots: { index: false, follow: false }');
        }
      }
    });

    it('ships product content from the server on /products/[id]', () => {
      const source = readSrc('app/products/[id]/page.tsx');
      expect(source).toContain('getProductWithLocalization');
      expect(source).toContain('ProductDetailClient');
      expect(source).toContain('initialProduct');
    });
  });

  describe('FABLE-009 sitemap and robots', () => {
    it('adds robots.ts and sitemap.ts with private-route disallows', () => {
      const robots = readSrc('app/robots.ts');
      const sitemap = readSrc('app/sitemap.ts');

      expect(robots).toContain("disallow:");
      expect(robots).toContain("'/admin'");
      expect(robots).toContain("'/api/'");
      expect(robots).toContain("sitemap:");
      expect(sitemap).toContain('getSupabaseServer');
      expect(sitemap).toContain('languageAlternates');
      expect(sitemap).toContain('/track-order');
    });
  });

  describe('FABLE-010 structured data', () => {
    it('emits JSON-LD for organization, product, FAQ, and breadcrumbs', () => {
      const layout = readSrc('app/layout.tsx');
      const product = readSrc('app/products/[id]/page.tsx');
      const products = readSrc('app/products/page.tsx');
      const faq = readSrc('app/faq/page.tsx');
      const faqData = readSrc('data/faq.ts');

      expect(layout).toContain("type=\"application/ld+json\"");
      expect(layout).toContain('@type\': \'Organization\'');
      expect(product).toContain('AggregateRating');
      expect(product).toContain('BreadcrumbList');
      expect(products).toContain('BreadcrumbList');
      expect(faq).toContain('buildFaqJsonLd');
      expect(faqData).toContain('FAQPage');
    });
  });

  describe('FABLE-011 URL-based bilingual SEO', () => {
    it('uses middleware locale rewrite and hreflang helpers', () => {
      const i18n = readSrc('lib/i18n.ts');
      const middleware = readSrc('middleware.ts');
      const localeContext = readSrc('contexts/LocaleContext.tsx');
      const terms = readSrc('app/terms/TermsContent.tsx');

      expect(i18n).toContain('localizePath');
      expect(i18n).toContain('localizedAlternates');
      expect(middleware).toContain('LOCALE_HEADER');
      expect(middleware).toContain('splitLocaleFromPath');
      expect(localeContext).toContain('splitLocaleFromPath');
      expect(localeContext).toContain('document.documentElement.lang = locale');
      expect(terms).toContain("locale === 'sv' ? 'Allmänna villkor' : 'Terms & Conditions'");
    });
  });

  describe('FABLE-012 social/icon metadata', () => {
    it('uses proper OG image, twitter card, and app-router icon conventions', () => {
      const layout = readSrc('app/layout.tsx');

      expect(layout).toContain("metadataBase: new URL(appUrl)");
      expect(layout).toContain("url: '/images/og-image.jpg'");
      expect(layout).toContain('width: 1200');
      expect(layout).toContain('height: 630');
      expect(layout).toContain("card: 'summary_large_image'");
      expect(layout).not.toContain('keywords:');
      expect(fileExists('src/app/icon.png')).toBe(true);
      expect(fileExists('src/app/apple-icon.png')).toBe(true);
      expect(fileExists('src/app/favicon.ico')).toBe(true);
      expect(fileExists('public/favicon.jpg')).toBe(false);
    });
  });

  describe('FABLE-013 anon-client migration for RLS tables', () => {
    it('migrates sensitive services to the server-role client', () => {
      const auth = readSrc('services/auth/AuthService.ts');
      const gdpr = readSrc('services/gdpr/GDPRService.ts');
      const inventory = readSrc('services/inventory/InventoryService.ts');
      const shipping = readSrc('repositories/shipping/ShippingRepository.ts');
      const abandoned = readSrc('repositories/cart/AbandonedCartRepository.ts');
      const newsletter = readSrc('app/api/newsletter/route.ts');

      expect(auth).toContain('SupabaseServerClient');
      expect(gdpr).toContain('getSupabaseServer()');
      expect(inventory).toContain('SupabaseServerClient');
      expect(shipping).toContain('getSupabaseServer()');
      expect(abandoned).toContain('getSupabaseServer()');
      expect(newsletter).toContain('getSupabaseServer()');
    });

    it('limits @/lib/supabase imports to the DI container', () => {
      const srcDir = path.join(root, 'src');
      const offenders: string[] = [];

      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
          } else if (/\.(ts|tsx)$/.test(entry.name)) {
            const content = fs.readFileSync(full, 'utf8');
            if (content.includes("from '@/lib/supabase'")) {
              offenders.push(path.relative(root, full));
            }
          }
        }
      }

      walk(srcDir);
      expect(offenders).toEqual(['src\\config\\di-container.ts'].map(p => p.replace(/\\/g, path.sep)));
    });
  });

  describe('FABLE-014 private shipping-label storage', () => {
    it('stores labels in a private bucket with authorized download', () => {
      const labelService = readSrc('services/shipping/LabelGenerationService.ts');
      const download = readSrc('app/api/shipping/labels/download/route.ts');
      const gitignore = readRoot('.gitignore');

      expect(labelService).toContain("storageBucket = 'shipping-labels'");
      expect(labelService).toContain('.storage');
      expect(labelService).not.toContain('public/shipping-labels');
      expect(download).toContain("from('shipping-labels')");
      expect(download).toContain('!session.user.isAdmin');
      expect(gitignore).toContain('public/shipping-labels/');
      expect(fileExists('public/shipping-labels')).toBe(false);
    });
  });

  describe('FABLE-015 repository server-client migration', () => {
    it('migrates order/cart/inventory repositories off the anon client', () => {
      const orderRepo = readSrc('repositories/orders/OrderRepository.ts');
      const cartRepo = readSrc('repositories/cart/CartRepository.ts');
      const inventoryRepo = readSrc('repositories/inventory/InventoryRepository.ts');
      const bundleRoute = readSrc('app/api/admin/update-bundle-images/route.ts');

      expect(orderRepo).toContain('getSupabaseServer()');
      expect(orderRepo).not.toContain("from '@/lib/supabase'");
      expect(cartRepo).toContain('getSupabaseServer()');
      expect(inventoryRepo).toContain('getSupabaseServer()');
      expect(bundleRoute).toContain('getSupabaseServer()');
    });
  });

  describe('FABLE-016 database hygiene', () => {
    it('documents search_path pinning in architecture notes', () => {
      const notes = readRoot('ARCHITECTURE_NOTES.md');
      expect(notes).toMatch(/search_path/i);
      expect(notes).toMatch(/extensions/i);
    });
  });

  describe('FABLE-017 create_return_with_items RPC contract', () => {
    it('calls the atomic return-creation RPC from the server client', () => {
      const repo = readSrc('repositories/returns/ReturnRepository.ts');
      expect(repo).toContain("rpc('create_return_with_items'");
      expect(repo).toContain('getSupabaseServer()');
    });
  });

  describe('FABLE-018 service_role consumer hardening', () => {
    it('uses server client in repositories that need table grants', () => {
      const reviewRepo = readSrc('repositories/reviews/ReviewRepository.ts');
      const customerRepo = readSrc('repositories/customers/CustomerRepository.ts');
      const productPage = readSrc('app/products/[id]/page.tsx');

      expect(reviewRepo).toContain('SupabaseServerClient');
      expect(customerRepo).toContain('getSupabaseServer()');
      expect(productPage).toContain('console.error');
      expect(productPage).toContain('getRatingStats');
    });
  });

  describe('Cross-check ISSUE-022 track-order consolidation', () => {
    it('aligns with issue-021-030 verification expectations', () => {
      const trackRoute = readSrc('app/api/orders/route.ts');
      expect(trackRoute).not.toContain('track-by-order');
      expect(trackRoute).toContain('Unauthenticated guest tracking lives at /api/orders/track');
    });
  });

  describe('Regression guard: public marketing pages are not all client components', () => {
    it('leaves only intentional client-only page.tsx files', () => {
      const clientOnlyPrefixes = [
        '/admin/',
        '/checkout/',
        '/wishlist/',
        '/test-orders/',
      ];

      const clientPages = listPageFiles().filter((file) => {
        const source = fs.readFileSync(file, 'utf8');
        return source.includes("'use client'");
      });

      for (const file of clientPages) {
        const rel = path.relative(path.join(root, 'src', 'app'), file).replace(/\\/g, '/');
        const allowed = clientOnlyPrefixes.some((prefix) => rel.startsWith(prefix.replace(/^\//, '')));
        expect({ rel, allowed }).toEqual({ rel, allowed: true });
      }
    });
  });
});