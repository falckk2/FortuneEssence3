import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import TermsContent from './TermsContent';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Användarvillkor',
        description: 'Användarvillkor för Fortune Essence — köpvillkor, betalning, leverans och ångerrätt.',
        alternates: localizedAlternates('/terms', locale),
      }
    : {
        title: 'Terms & Conditions',
        description: 'Terms and conditions for Fortune Essence — purchase terms, payment, delivery and right of withdrawal.',
        alternates: localizedAlternates('/terms', locale),
      };
}

export default async function TermsPage() {
  return <TermsContent locale={await getRequestLocale()} />;
}
