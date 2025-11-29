'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const locale = 'sv'; // Would come from context in real app

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error(locale === 'sv' ? 'Ange en giltig e-postadress' : 'Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        toast.success(
          locale === 'sv'
            ? 'Återställningslänk skickad! Kontrollera din e-post.'
            : 'Reset link sent! Check your email.'
        );
      } else {
        toast.error(data.error || (locale === 'sv' ? 'Något gick fel' : 'Something went wrong'));
      }
    } catch (error) {
      toast.error(locale === 'sv' ? 'Kunde inte skicka återställningslänk' : 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Back Link */}
        <Link
          href="/auth/signin"
          className="inline-flex items-center text-forest-600 hover:text-sage-700 transition-colors mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          <span className="font-medium">
            {locale === 'sv' ? 'Tillbaka till inloggning' : 'Back to sign in'}
          </span>
        </Link>

        <div className="bg-white rounded-3xl shadow-soft p-8 lg:p-10">
          {!emailSent ? (
            <>
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sage-100 flex items-center justify-center">
                <EnvelopeIcon className="h-8 w-8 text-sage-600" />
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-forest-800 mb-3">
                  {locale === 'sv' ? 'Glömt lösenord?' : 'Forgot Password?'}
                </h1>
                <p className="text-forest-600">
                  {locale === 'sv'
                    ? 'Ange din e-postadress så skickar vi dig en länk för att återställa ditt lösenord.'
                    : "Enter your email address and we'll send you a link to reset your password."
                  }
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-forest-700 mb-2">
                    {locale === 'sv' ? 'E-postadress' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
                    placeholder={locale === 'sv' ? 'din@email.se' : 'your@email.com'}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? (locale === 'sv' ? 'Skickar...' : 'Sending...')
                    : (locale === 'sv' ? 'Skicka återställningslänk' : 'Send Reset Link')
                  }
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sage-100 flex items-center justify-center">
                  <svg className="h-8 w-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h2 className="text-2xl font-serif font-bold text-forest-800 mb-3">
                  {locale === 'sv' ? 'Kontrollera din e-post' : 'Check Your Email'}
                </h2>
                <p className="text-forest-600 mb-6">
                  {locale === 'sv'
                    ? `Vi har skickat en återställningslänk till ${email}. Klicka på länken i e-postmeddelandet för att återställa ditt lösenord.`
                    : `We've sent a reset link to ${email}. Click the link in the email to reset your password.`
                  }
                </p>

                <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-forest-700">
                    {locale === 'sv'
                      ? 'Hittar du inte e-postmeddelandet? Kontrollera din skräppost.'
                      : "Can't find the email? Check your spam folder."
                    }
                  </p>
                </div>

                <button
                  onClick={() => setEmailSent(false)}
                  className="text-sage-700 hover:text-sage-800 font-medium hover:underline transition-colors"
                >
                  {locale === 'sv' ? 'Skicka igen' : 'Resend Email'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-forest-600">
          {locale === 'sv' ? 'Har du inget konto?' : "Don't have an account?"}{' '}
          <Link href="/auth/signup" className="text-sage-700 font-semibold hover:text-sage-800 hover:underline transition-colors">
            {locale === 'sv' ? 'Skapa konto' : 'Sign Up'}
          </Link>
        </p>
      </div>
    </div>
  );
}
