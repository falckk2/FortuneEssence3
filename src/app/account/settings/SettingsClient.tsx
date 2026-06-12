'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import Link from '@/components/i18n/Link';
import {
  ArrowLeftIcon,
  CogIcon,
  UserIcon,
  MapPinIcon,
  KeyIcon,
  CheckCircleIcon,
  BellIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    region: string;
  };
}

type Message = { type: 'success' | 'error'; text: string } | null;

export default function AccountSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<Message>(null);
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const { locale } = useLocale();

  const showProfileMessage = useCallback((type: 'success' | 'error', text: string) => {
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    setProfileMessage({ type, text });
    profileTimerRef.current = setTimeout(() => setProfileMessage(null), 4000);
  }, []);

  const showPasswordMessage = useCallback((type: 'success' | 'error', text: string) => {
    if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
    setPasswordMessage({ type, text });
    passwordTimerRef.current = setTimeout(() => setPasswordMessage(null), 4000);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/account/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
        } else {
          setFetchError(data.error || 'Failed to load profile');
        }
      } else {
        setFetchError('Failed to load profile');
      }
    } catch {
      setFetchError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/account/settings');
      return;
    }
    fetchProfile();
  }, [session, status, router, fetchProfile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || saving) return;

    setSaving(true);
    try {
      const response = await fetch('/api/account/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          marketingOptIn: profile.marketingOptIn,
          address: profile.address,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showProfileMessage('success', locale === 'sv' ? 'Profilen har uppdaterats' : 'Profile updated successfully');
      } else {
        showProfileMessage('error', data.error || (locale === 'sv' ? 'Kunde inte uppdatera profilen' : 'Failed to update profile'));
      }
    } catch {
      showProfileMessage('error', locale === 'sv' ? 'Något gick fel' : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changingPassword) return;

    if (!currentPassword) {
      showPasswordMessage('error', locale === 'sv' ? 'Ange ditt nuvarande lösenord' : 'Enter your current password');
      return;
    }

    if (newPassword.length < 8) {
      showPasswordMessage('error', locale === 'sv' ? 'Lösenordet måste vara minst 8 tecken' : 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showPasswordMessage('error', locale === 'sv' ? 'Lösenorden matchar inte' : 'Passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      showPasswordMessage('error', locale === 'sv' ? 'Det nya lösenordet måste skilja sig från det nuvarande' : 'New password must differ from current password');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/account/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showPasswordMessage('success', locale === 'sv' ? 'Lösenordet har ändrats' : 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showPasswordMessage('error', data.error || (locale === 'sv' ? 'Kunde inte ändra lösenord' : 'Failed to change password'));
      }
    } catch {
      showPasswordMessage('error', locale === 'sv' ? 'Något gick fel' : 'Something went wrong');
    } finally {
      setChangingPassword(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f5f0] to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5c7a5c] dark:border-[#8aab8a]"></div>
            <span className="ml-3 text-forest-600 dark:text-[#C5D4C5]">
              {locale === 'sv' ? 'Laddar...' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (fetchError || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f5f0] to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-6 py-4 rounded-lg inline-block">
              {fetchError || (locale === 'sv' ? 'Profilen kunde inte laddas' : 'Profile could not be loaded')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f5f0] to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex items-center text-[#5c7a5c] dark:text-[#8aab8a] hover:text-[#4a6a4a] dark:hover:text-[#C5D4C5] mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {locale === 'sv' ? 'Tillbaka till konto' : 'Back to account'}
          </Link>

          <div className="flex items-center space-x-3">
            <CogIcon className="h-8 w-8 text-[#5c7a5c] dark:text-[#8aab8a]" />
            <div>
              <h1 className="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8]">
                {locale === 'sv' ? 'Kontoinställningar' : 'Account Settings'}
              </h1>
              <p className="text-forest-600 dark:text-[#C5D4C5] mt-2">
                {locale === 'sv'
                  ? 'Hantera dina personuppgifter och lösenord'
                  : 'Manage your personal information and password'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <form onSubmit={handleProfileSubmit}>
              <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <UserIcon className="h-6 w-6 text-[#5c7a5c] dark:text-[#8aab8a]" />
                  <h2 className="text-xl font-semibold text-forest-900 dark:text-[#E8EDE8]">
                    {locale === 'sv' ? 'Personuppgifter' : 'Personal Information'}
                  </h2>
                </div>

                {profileMessage && (
                  <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
                    profileMessage.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  }`}>
                    {profileMessage.type === 'success'
                      ? <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                      : <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />}
                    {profileMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                      {locale === 'sv' ? 'Förnamn' : 'First name'}
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      required
                      className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                      {locale === 'sv' ? 'Efternamn' : 'Last name'}
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      required
                      className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                      {locale === 'sv' ? 'E-post' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full border border-cream-200 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-cream-50 dark:bg-[#1a1f1e] text-forest-500 dark:text-[#6B7B6B] cursor-not-allowed"
                    />
                    <p className="text-xs text-forest-500 dark:text-[#6B7B6B] mt-1">
                      {locale === 'sv' ? 'E-post kan inte ändras' : 'Email cannot be changed'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                      {locale === 'sv' ? 'Telefon' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="mt-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <MapPinIcon className="h-6 w-6 text-[#5c7a5c] dark:text-[#8aab8a]" />
                    <h3 className="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8]">
                      {locale === 'sv' ? 'Adress' : 'Address'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                        {locale === 'sv' ? 'Gatuadress' : 'Street address'}
                      </label>
                      <input
                        type="text"
                        value={profile.address.street}
                        onChange={(e) => setProfile({ ...profile, address: { ...profile.address, street: e.target.value } })}
                        className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                        {locale === 'sv' ? 'Postnummer' : 'Postal code'}
                      </label>
                      <input
                        type="text"
                        value={profile.address.postalCode}
                        onChange={(e) => setProfile({ ...profile, address: { ...profile.address, postalCode: e.target.value } })}
                        className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                        {locale === 'sv' ? 'Stad' : 'City'}
                      </label>
                      <input
                        type="text"
                        value={profile.address.city}
                        onChange={(e) => setProfile({ ...profile, address: { ...profile.address, city: e.target.value } })}
                        className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                        {locale === 'sv' ? 'Land' : 'Country'}
                      </label>
                      <select
                        value={profile.address.country}
                        onChange={(e) => setProfile({ ...profile, address: { ...profile.address, country: e.target.value } })}
                        className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                      >
                        <option value="Sweden">{locale === 'sv' ? 'Sverige' : 'Sweden'}</option>
                        <option value="Norway">{locale === 'sv' ? 'Norge' : 'Norway'}</option>
                        <option value="Denmark">{locale === 'sv' ? 'Danmark' : 'Denmark'}</option>
                        <option value="Finland">Finland</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                        {locale === 'sv' ? 'Län / Region' : 'Region'}
                      </label>
                      <input
                        type="text"
                        value={profile.address.region}
                        onChange={(e) => setProfile({ ...profile, address: { ...profile.address, region: e.target.value } })}
                        className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="mt-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <BellIcon className="h-6 w-6 text-[#5c7a5c] dark:text-[#8aab8a]" />
                    <h3 className="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8]">
                      {locale === 'sv' ? 'Kommunikation' : 'Communication'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-cream-200 dark:border-[#3f4946] rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-forest-900 dark:text-[#E8EDE8]">
                          {locale === 'sv' ? 'Nyhetsbrev & erbjudanden' : 'Newsletter & offers'}
                        </h4>
                        <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mt-1">
                          {locale === 'sv'
                            ? 'Få e-post om nya produkter, erbjudanden och nyheter'
                            : 'Receive emails about new products, offers and news'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={profile.marketingOptIn}
                          onChange={(e) => setProfile({ ...profile, marketingOptIn: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#d1d9d1] dark:bg-[#3f4946] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5c7a5c]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5c7a5c] dark:peer-checked:bg-[#8aab8a]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#5c7a5c] dark:bg-[#4a6a4a] text-white font-medium py-2 px-6 rounded-lg hover:bg-[#4a6a4a] dark:hover:bg-[#3a5a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving
                      ? (locale === 'sv' ? 'Sparar...' : 'Saving...')
                      : (locale === 'sv' ? 'Spara ändringar' : 'Save changes')}
                  </button>
                </div>
              </div>
            </form>

            {/* Change Password */}
            <form onSubmit={handlePasswordSubmit}>
              <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <KeyIcon className="h-6 w-6 text-[#5c7a5c] dark:text-[#8aab8a]" />
                  <h2 className="text-xl font-semibold text-forest-900 dark:text-[#E8EDE8]">
                    {locale === 'sv' ? 'Ändra lösenord' : 'Change Password'}
                  </h2>
                </div>

                {passwordMessage && (
                  <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
                    passwordMessage.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  }`}>
                    {passwordMessage.type === 'success'
                      ? <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                      : <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />}
                    {passwordMessage.text}
                  </div>
                )}

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                      {locale === 'sv' ? 'Nuvarande lösenord' : 'Current password'}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                      {locale === 'sv' ? 'Nytt lösenord' : 'New password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                    />
                    <p className="text-xs text-forest-500 dark:text-[#6B7B6B] mt-1">
                      {locale === 'sv' ? 'Minst 8 tecken' : 'At least 8 characters'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                      {locale === 'sv' ? 'Bekräfta nytt lösenord' : 'Confirm new password'}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full border border-cream-300 dark:border-[#3f4946] rounded-lg px-3 py-2 bg-white dark:bg-[#2a3330] text-forest-900 dark:text-[#E8EDE8] focus:ring-2 focus:ring-[#5c7a5c] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-[#5c7a5c] dark:bg-[#4a6a4a] text-white font-medium py-2 px-6 rounded-lg hover:bg-[#4a6a4a] dark:hover:bg-[#3a5a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {changingPassword
                      ? (locale === 'sv' ? 'Ändrar...' : 'Changing...')
                      : (locale === 'sv' ? 'Ändra lösenord' : 'Change password')}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-[#e8ede8] dark:bg-[#2a3330] rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-[#5c7a5c] dark:text-[#8aab8a]" />
                </div>
                <div>
                  <h3 className="font-semibold text-forest-900 dark:text-[#E8EDE8]">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-forest-600 dark:text-[#8A9A8A] text-sm">{profile.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">
                {locale === 'sv' ? 'Snabblänkar' : 'Quick links'}
              </h3>
              <div className="space-y-3">
                <Link
                  href="/account/orders"
                  className="block w-full text-left px-4 py-2 text-[#5c7a5c] dark:text-[#8aab8a] hover:bg-[#e8ede8] dark:hover:bg-[#2a3330] rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Mina beställningar' : 'My orders'}
                </Link>
                <Link
                  href="/account/privacy"
                  className="block w-full text-left px-4 py-2 text-[#5c7a5c] dark:text-[#8aab8a] hover:bg-[#e8ede8] dark:hover:bg-[#2a3330] rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'GDPR & Integritet' : 'GDPR & Privacy'}
                </Link>
                <Link
                  href="/contact"
                  className="block w-full text-left px-4 py-2 text-[#5c7a5c] dark:text-[#8aab8a] hover:bg-[#e8ede8] dark:hover:bg-[#2a3330] rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Kontakta oss' : 'Contact us'}
                </Link>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gradient-to-r from-[#e8ede8] to-[#f0f4f0] dark:from-[#2a3330] dark:to-[#242a28] rounded-xl p-6">
              <h3 className="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-2">
                {locale === 'sv' ? 'Behöver du hjälp?' : 'Need help?'}
              </h3>
              <p className="text-forest-600 dark:text-[#8A9A8A] text-sm mb-4">
                {locale === 'sv'
                  ? 'Kontakta oss om du har frågor om ditt konto.'
                  : 'Contact us if you have questions about your account.'}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center text-[#5c7a5c] dark:text-[#8aab8a] hover:text-[#4a6a4a] dark:hover:text-[#C5D4C5] font-medium text-sm"
              >
                {locale === 'sv' ? 'Kontakta support' : 'Contact support'}
                <ArrowLeftIcon className="w-4 h-4 ml-1 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
