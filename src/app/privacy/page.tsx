import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import PrivacyContent from './PrivacyContent';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Integritetspolicy',
        description:
          'Så behandlar Fortune Essence dina personuppgifter — GDPR, cookies, datalagring och dina rättigheter.',
        alternates: localizedAlternates('/privacy', locale),
      }
    : {
        title: 'Privacy Policy',
        description:
          'How Fortune Essence processes your personal data — GDPR, cookies, data retention and your rights.',
        alternates: localizedAlternates('/privacy', locale),
      };
}

export default async function PrivacyPage() {
  return <PrivacyContent locale={await getRequestLocale()} />;
}
