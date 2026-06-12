export const dynamic = 'force-dynamic';
import '@/config/di-init';
import type { Metadata } from 'next';
import { container, TOKENS } from '@/config/di-container';
import type { IProductService } from '@/interfaces';
import type { Product } from '@/types';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import HomeClient from './HomeClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    description: locale === 'sv'
      ? 'Naturliga eteriska oljor för det moderna livet. Premium kvalitet, 100% ekologiskt och fri frakt över 500 kr i hela Sverige.'
      : 'Natural essential oils for modern life. Premium quality, 100% organic and free shipping over 500 SEK across Sweden.',
    alternates: localizedAlternates('/', locale),
  };
}

// Featured products are fetched server-side so the homepage HTML ships with
// product content (FABLE-008); HomeClient falls back to the API on failure.
async function getFeaturedProducts(): Promise<Product[] | null> {
  try {
    const productService = container.resolve<IProductService>(TOKENS.IProductService);
    const result = await productService.getFeaturedProducts();
    return result.success && result.data ? result.data : null;
  } catch (error) {
    console.error('[home-page] server-side featured products fetch failed:', error);
    return null;
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return <HomeClient initialProducts={featuredProducts} />;
}
