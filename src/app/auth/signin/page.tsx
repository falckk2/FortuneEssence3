import type { Metadata } from 'next';
import SigninClient from './SigninClient';

export const metadata: Metadata = {
  title: 'Logga in',
  robots: { index: false, follow: false },
};

export default function SigninPage() {
  return <SigninClient />;
}
