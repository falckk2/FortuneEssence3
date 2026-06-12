import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { Locale } from '@/types';
import { localizedAlternates, localizePath } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import ProductsClient from './ProductsClient';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Produkter – Eteriska oljor & aromaterapi',
        description:
          'Utforska vårt sortiment av premium eteriska oljor, bäraroljor, diffusers och presentset. Naturligt, ekologiskt och etiskt framställt.',
        alternates: localizedAlternates('/products', locale),
      }
    : {
        title: 'Products – Essential oils & aromatherapy',
        description:
          'Explore our range of premium essential oils, carrier oils, diffusers and gift sets. Natural, organic and ethically sourced.',
        alternates: localizedAlternates('/products', locale),
      };
}

function buildBreadcrumbJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'sv' ? 'Hem' : 'Home',
        item: `${appUrl}${localizePath('/', locale) === '/' ? '' : localizePath('/', locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'sv' ? 'Produkter' : 'Products',
        item: `${appUrl}${localizePath('/products', locale)}`,
      },
    ],
  };
}

export default async function ProductsPage() {
  const locale = await getRequestLocale();
  // The CSP is nonce-based (src/middleware.ts) — inline JSON-LD must carry the nonce.
  const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(locale)) }}
      />
      <ProductsClient />
    </>
  );
}
