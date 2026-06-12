import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import AboutClient from './AboutClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Om oss',
        description:
          'Lär känna Fortune Essence — vår historia, våra värderingar och vårt engagemang för rena, naturliga och etiskt framställda eteriska oljor.',
        alternates: localizedAlternates('/about', locale),
      }
    : {
        title: 'About us',
        description:
          'Get to know Fortune Essence — our story, our values and our commitment to pure, natural and ethically sourced essential oils.',
        alternates: localizedAlternates('/about', locale),
      };
}

export default function AboutPage() {
  return <AboutClient />;
}
