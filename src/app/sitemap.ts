import type { MetadataRoute } from 'next';
import { getSupabaseServer } from '@/lib/supabase-server';
import { hreflangValues, localizePath } from '@/lib/i18n';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Re-generate at most hourly so new products appear without a redeploy.
export const revalidate = 3600;

/**
 * Language alternates for a fully translated path (FABLE-011). Untranslated
 * pages are listed only at their Swedish URL — their /en variant canonicals
 * back to the Swedish original and must not be advertised in the sitemap.
 */
function languageAlternates(path: string) {
  return {
    languages: {
      [hreflangValues.sv]: `${appUrl}${path === '/' ? '/' : path}`,
      [hreflangValues.en]: `${appUrl}${localizePath(path, 'en')}`,
      'x-default': `${appUrl}${path === '/' ? '/' : path}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // All static pages carry complete sv+en translations (legal pages and
  // track-order were translated 2026-06-12, closing the FABLE-011 follow-up).
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${appUrl}/`, changeFrequency: 'daily', priority: 1, alternates: languageAlternates('/') },
    { url: `${appUrl}/products`, changeFrequency: 'daily', priority: 0.9, alternates: languageAlternates('/products') },
    { url: `${appUrl}/about`, changeFrequency: 'monthly', priority: 0.5, alternates: languageAlternates('/about') },
    { url: `${appUrl}/how-to-use`, changeFrequency: 'monthly', priority: 0.6, alternates: languageAlternates('/how-to-use') },
    { url: `${appUrl}/faq`, changeFrequency: 'monthly', priority: 0.6, alternates: languageAlternates('/faq') },
    { url: `${appUrl}/contact`, changeFrequency: 'yearly', priority: 0.4, alternates: languageAlternates('/contact') },
    { url: `${appUrl}/track-order`, changeFrequency: 'yearly', priority: 0.3, alternates: languageAlternates('/track-order') },
    { url: `${appUrl}/shipping-policy`, changeFrequency: 'yearly', priority: 0.3, alternates: languageAlternates('/shipping-policy') },
    { url: `${appUrl}/terms`, changeFrequency: 'yearly', priority: 0.2, alternates: languageAlternates('/terms') },
    { url: `${appUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2, alternates: languageAlternates('/privacy') },
    { url: `${appUrl}/refund`, changeFrequency: 'yearly', priority: 0.2, alternates: languageAlternates('/refund') },
  ];

  // Product URLs come from the database; if it is unreachable (e.g. env vars
  // absent at build time) fall back to the static pages rather than failing.
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('products')
      .select('id, updated_at')
      .eq('is_active', true);

    if (error) {
      console.error('[sitemap] failed to list products:', error.message);
      return staticPages;
    }

    // Product content is localized from DB translations, so both locales exist.
    const productPages: MetadataRoute.Sitemap = (data ?? []).map(product => ({
      url: `${appUrl}/products/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: languageAlternates(`/products/${product.id}`),
    }));

    return [...staticPages, ...productPages];
  } catch (err) {
    console.error('[sitemap] product enumeration failed:', err);
    return staticPages;
  }
}
