import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Integritet & data',
  robots: { index: false, follow: false },
};

export default function AccountPrivacyPage() {
  return <PrivacyClient />;
}
