'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const locale = 'sv'; // Would come from context in real app

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      toast.error(locale === 'sv' ? 'Ogiltig återställningslänk' : 'Invalid reset link');
    }
  }, [token, locale]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return locale === 'sv'
        ? 'Lösenordet måste vara minst 8 tecken'
        : 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return locale === 'sv'
        ? 'Lösenordet måste innehålla minst en stor bokstav'
        : 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return locale === 'sv'
        ? 'Lösenordet måste innehålla minst en liten bokstav'
        : 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return locale === 'sv'
        ? 'Lösenordet måste innehålla minst en siffra'
        : 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      toast.error(locale === 'sv' ? 'Lösenorden matchar inte' : 'Passwords do not match');
      return;
    }

    if (!token) {
      toast.error(locale === 'sv' ? 'Ogiltig återställningslänk' : 'Invalid reset link');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          locale === 'sv'
            ? 'Lösenordet har återställts! Du kan nu logga in.'
            : 'Password reset successfully! You can now sign in.'
        );
        router.push('/auth/signin');
      } else {
        toast.error(data.error || (locale === 'sv' ? 'Något gick fel' : 'Something went wrong'));
      }
    } catch (error) {
      toast.error(locale === 'sv' ? 'Kunde inte återställa lösenordet' : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-soft p-8 lg:p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <LockClosedIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-forest-800 mb-3">
              {locale === 'sv' ? 'Ogiltig länk' : 'Invalid Link'}
            </h2>
            <p className="text-forest-600 mb-6">
              {locale === 'sv'
                ? 'Återställningslänken är ogiltig eller har löpt ut. Vänligen begär en ny.'
                : 'The reset link is invalid or has expired. Please request a new one.'
              }
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-block px-8 py-3.5 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg"
            >
              {locale === 'sv' ? 'Begär ny länk' : 'Request New Link'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-soft p-8 lg:p-10">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sage-100 flex items-center justify-center">
            <LockClosedIcon className="h-8 w-8 text-sage-600" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-forest-800 mb-3">
              {locale === 'sv' ? 'Återställ lösenord' : 'Reset Password'}
            </h1>
            <p className="text-forest-600">
              {locale === 'sv'
                ? 'Ange ditt nya lösenord nedan'
                : 'Enter your new password below'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-forest-700 mb-2">
                {locale === 'sv' ? 'Nytt lösenord' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
                  placeholder={locale === 'sv' ? 'Minst 8 tecken' : 'At least 8 characters'}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-forest-500">
                {locale === 'sv'
                  ? 'Minst 8 tecken, en stor bokstav, en liten bokstav och en siffra'
                  : 'At least 8 characters, one uppercase, one lowercase, and one number'
                }
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-forest-700 mb-2">
                {locale === 'sv' ? 'Bekräfta lösenord' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
                  placeholder={locale === 'sv' ? 'Ange lösenordet igen' : 'Enter password again'}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? (locale === 'sv' ? 'Återställer...' : 'Resetting...')
                : (locale === 'sv' ? 'Återställ lösenord' : 'Reset Password')
              }
            </button>
          </form>
        </div>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-forest-600">
          {locale === 'sv' ? 'Kom du ihåg ditt lösenord?' : 'Remember your password?'}{' '}
          <Link href="/auth/signin" className="text-sage-700 font-semibold hover:text-sage-800 hover:underline transition-colors">
            {locale === 'sv' ? 'Logga in' : 'Sign In'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600 mx-auto"></div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
