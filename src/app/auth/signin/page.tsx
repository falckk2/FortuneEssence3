'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/contexts/LocaleContext';

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { signIn } = useAuth();
  const { locale } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn(formData.email, formData.password);

      if (!result.success) {
        setError(locale === 'sv'
          ? 'Fel e-postadress eller lösenord. Försök igen.'
          : 'Invalid email or password. Please try again.'
        );
        return;
      }

      router.push('/');
    } catch (err) {
      setError(locale === 'sv'
        ? 'Ett oväntat fel uppstod. Försök igen.'
        : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-yellow-50 dark:from-[#1a1f1e] dark:via-[#242a28] dark:to-[#1a1f1e] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">FE</span>
            </div>
            <span className="text-2xl font-bold text-forest-900 dark:text-[#E8EDE8]">Fortune Essence</span>
          </Link>
          
          <h2 className="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8] mb-2">
            {locale === 'sv' ? 'Logga In' : 'Sign In'}
          </h2>
          <p className="text-forest-600 dark:text-[#B8C5B8]">
            {locale === 'sv'
              ? 'Välkommen tillbaka! Logga in på ditt konto.'
              : 'Welcome back! Sign in to your account.'
            }
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-2">
                {locale === 'sv' ? 'E-postadress' : 'Email address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-forest-400 dark:text-[#6B7B6B]" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-cream-300 dark:border-[#4a5552] rounded-lg bg-white dark:bg-[#2a3330] dark:text-[#E8EDE8] dark:placeholder-[#6B7B6B] focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  placeholder={locale === 'sv' ? 'din@email.se' : 'your@email.com'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-2">
                {locale === 'sv' ? 'Lösenord' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-forest-400 dark:text-[#6B7B6B]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-cream-300 dark:border-[#4a5552] rounded-lg bg-white dark:bg-[#2a3330] dark:text-[#E8EDE8] dark:placeholder-[#6B7B6B] focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  placeholder={locale === 'sv' ? 'Ditt lösenord' : 'Your password'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-forest-400 dark:text-[#6B7B6B] hover:text-forest-600 dark:hover:text-[#B8C5B8]" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-forest-400 dark:text-[#6B7B6B] hover:text-forest-600 dark:hover:text-[#B8C5B8]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-sage-600 focus:ring-sage-500 border-cream-300 dark:border-[#4a5552] rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-forest-700 dark:text-[#C5D4C5]">
                {locale === 'sv' ? 'Kom ihåg mig' : 'Remember me'}
              </label>
            </div>

            <Link
              href="/auth/forgot-password"
              className="text-sm text-sage-600 hover:text-sage-500 transition-colors"
            >
              {locale === 'sv' ? 'Glömt lösenord?' : 'Forgot password?'}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {locale === 'sv' ? 'Loggar in...' : 'Signing in...'}
              </>
            ) : (
              <>
                {locale === 'sv' ? 'Logga In' : 'Sign In'}
                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-forest-600 dark:text-[#B8C5B8]">
              {locale === 'sv' ? 'Inget konto ännu?' : "Don't have an account?"}{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-sage-600 hover:text-sage-500 transition-colors"
              >
                {locale === 'sv' ? 'Skapa konto' : 'Sign up'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}