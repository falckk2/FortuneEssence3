import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Återställ lösenord',
  robots: { index: false, follow: false },
};

// ResetPasswordClient reads the reset token via useSearchParams, which
// requires a Suspense boundary during prerender.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
