export const dynamic = 'force-dynamic';
import '@/config/di-init';
import type { Metadata } from 'next';
import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { container, TOKENS } from '@/config/di-container';
import type { IProductService } from '@/interfaces';
import type { IReviewRepository, RatingStats } from '@/repositories/reviews/ReviewRepository';
import type { Locale, Product } from '@/types';
import { localizedAlternates, localizePath } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import ProductDetailClient from './ProductDetailClient';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Deduped across generateMetadata and the page render within one request.
const getProduct = cache(async (id: string, locale: Locale): Promise<{ product: Product | null; missing: boolean }> => {
  try {
    const productService = container.resolve<IProductService>(TOKENS.IProductService);
    const result = await productService.getProductWithLocalization(id, locale);
    if (result.success && result.data) {
      return { product: result.data, missing: false };
    }
    if (result.error !== 'Product not found') {
      console.error('[product-page] product fetch returned error:', result.error);
    }
    return { product: null, missing: result.error === 'Product not found' };
  } catch (error) {
    // On infrastructure failure, fall through to the client-side fetch rather
    // than 404ing a product that exists.
    console.error('[product-page] server-side product fetch failed:', error);
    return { product: null, missing: false };
  }
});

const getRatingStats = cache(async (id: string): Promise<RatingStats | null> => {
  try {
    const reviewRepository = container.resolve<IReviewRepository>(TOKENS.IReviewRepository);
    const result = await reviewRepository.getRatingStats(id);
    if (!result.success) {
      // A silent null here once masked missing service_role grants (FABLE-018).
      console.error('[product-page] rating stats returned error:', result.error);
    }
    return result.success && result.data ? result.data : null;
  } catch (error) {
    console.error('[product-page] rating stats fetch failed:', error);
    return null;
  }
});

interface PageProps {
  params: Promise<{ id: string }>;
}

function localizedProductFields(product: Product, locale: Locale) {
  const translation = product.translations?.[locale];
  return {
    name: translation?.name || product.name,
    description: translation?.description || product.description || '',
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const locale = await getRequestLocale();
  const { product } = await getProduct(id, locale);

  if (!product) {
    return { title: locale === 'sv' ? 'Produkt' : 'Product' };
  }

  const { name, description } = localizedProductFields(product, locale);
  const image = product.images?.[0];

  return {
    title: name,
    description: description.slice(0, 160),
    alternates: localizedAlternates(`/products/${id}`, locale),
    openGraph: {
      title: name,
      description: description.slice(0, 160),
      type: 'website',
      url: localizePath(`/products/${id}`, locale),
      images: image ? [{ url: image, alt: name }] : undefined,
    },
  };
}

function buildProductJsonLd(product: Product, locale: Locale, ratingStats: RatingStats | null) {
  const { name, description } = localizedProductFields(product, locale);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    sku: product.sku,
    image: product.images?.length ? product.images : undefined,
    brand: { '@type': 'Brand', name: 'Fortune Essence' },
    // Only emitted with actual review data — empty/fabricated rating markup
    // risks a rich-result penalty.
    aggregateRating: ratingStats && ratingStats.count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: ratingStats.average,
          reviewCount: ratingStats.count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: `${appUrl}${localizePath(`/products/${product.id}`, locale)}`,
      price: product.price,
      priceCurrency: 'SEK',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
}

function buildBreadcrumbJsonLd(product: Product, locale: Locale) {
  const { name } = localizedProductFields(product, locale);
  const homePath = localizePath('/', locale);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'sv' ? 'Hem' : 'Home',
        item: homePath === '/' ? appUrl : `${appUrl}${homePath}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'sv' ? 'Produkter' : 'Products',
        item: `${appUrl}${localizePath('/products', locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: `${appUrl}${localizePath(`/products/${product.id}`, locale)}`,
      },
    ],
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const { product, missing } = await getProduct(id, locale);

  if (missing) {
    notFound();
  }

  const ratingStats = product ? await getRatingStats(id) : null;

  // The CSP is nonce-based (src/middleware.ts) — inline JSON-LD must carry the nonce.
  const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <>
      {product && (
        <>
          <script
            type="application/ld+json"
            nonce={nonce}
            dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductJsonLd(product, locale, ratingStats)) }}
          />
          <script
            type="application/ld+json"
            nonce={nonce}
            dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(product, locale)) }}
          />
        </>
      )}
      <ProductDetailClient productId={id} initialProduct={product} />
    </>
  );
}
