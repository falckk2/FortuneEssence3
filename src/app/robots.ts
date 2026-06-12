import type { MetadataRoute } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/account',
          '/api/',
          '/auth',
          '/checkout',
          '/wishlist',
          '/test-orders',
          // /en-prefixed variants of the private routes (FABLE-011) — the
          // middleware rewrite makes them reachable under the locale prefix.
          '/en/admin',
          '/en/account',
          '/en/auth',
          '/en/checkout',
          '/en/wishlist',
          '/en/test-orders',
          // Band-aid for FABLE-014: generated label PDFs contain customer
          // addresses and must not be indexed. Real fix is moving them out
          // of public/ entirely.
          '/shipping-labels/',
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
