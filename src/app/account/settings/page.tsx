'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CogIcon,
  UserIcon,
  MapPinIcon,
  KeyIcon,
  CheckCircleIcon,
  BellIcon,
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

export default function AccountSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const locale = 'sv';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/account/settings');
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/account/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setErrorMessage('');
    } else {
      setErrorMessage(message);
      setSuccessMessage('');
    }
    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 4000);
  };

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
        showMessage('success', locale === 'sv' ? 'Profilen har uppdaterats' : 'Profile updated successfully');
      } else {
        showMessage('error', data.error || (locale === 'sv' ? 'Kunde inte uppdatera profilen' : 'Failed to update profile'));
      }
    } catch (error) {
      showMessage('error', locale === 'sv' ? 'Något gick fel' : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changingPassword) return;

    if (newPassword !== confirmPassword) {
      showMessage('error', locale === 'sv' ? 'Lösenorden matchar inte' : 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', locale === 'sv' ? 'Lösenordet måste vara minst 8 tecken' : 'Password must be at least 8 characters');
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
        showMessage('success', locale === 'sv' ? 'Lösenordet har ändrats' : 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage('error', data.error || (locale === 'sv' ? 'Kunde inte ändra lösenord' : 'Failed to change password'));
      }
    } catch (error) {
      showMessage('error', locale === 'sv' ? 'Något gick fel' : 'Something went wrong');
    } finally {
      setChangingPassword(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">
              {locale === 'sv' ? 'Laddar...' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {locale === 'sv' ? 'Tillbaka till konto' : 'Back to account'}
          </Link>

          <div className="flex items-center space-x-3">
            <CogIcon className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {locale === 'sv' ? 'Kontoinställningar' : 'Account Settings'}
              </h1>
              <p className="text-gray-600 mt-2">
                {locale === 'sv'
                  ? 'Hantera dina personuppgifter och lösenord'
                  : 'Manage your personal information and password'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <CheckCircleIcon className="h-5 w-5" />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <form onSubmit={handleProfileSubmit}>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <UserIcon className="h-6 w-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {locale === 'sv' ? 'Personuppgifter' : 'Personal Information'}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'sv' ? 'Förnamn' : 'First name'}
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'sv' ? 'Efternamn' : 'Last name'}
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'sv' ? 'E-post' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {locale === 'sv' ? 'E-post kan inte ändras' : 'Email cannot be changed'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'sv' ? 'Telefon' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="mt-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <MapPinIcon className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {locale === 'sv' ? 'Adress' : 'Address'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'sv' ? 'Gatuadress' : 'Street address'}
                      </label>
                      <input
                        type="text"
                        value={profile.address.street}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: { ...profile.address, street: e.target.value },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'sv' ? 'Postnummer' : 'Postal code'}
                      </label>
                      <input
                        type="text"
                        value={profile.address.postalCode}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: { ...profile.address, postalCode: e.target.value },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'sv' ? 'Stad' : 'City'}
                      </label>
                      <input
                        type="text"
                        value={profile.address.city}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: { ...profile.address, city: e.target.value },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'sv' ? 'Land' : 'Country'}
                      </label>
                      <select
                        value={profile.address.country}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: { ...profile.address, country: e.target.value },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="Sweden">{locale === 'sv' ? 'Sverige' : 'Sweden'}</option>
                        <option value="Norway">{locale === 'sv' ? 'Norge' : 'Norway'}</option>
                        <option value="Denmark">{locale === 'sv' ? 'Danmark' : 'Denmark'}</option>
                        <option value="Finland">{locale === 'sv' ? 'Finland' : 'Finland'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'sv' ? 'Region' : 'Region'}
                      </label>
                      <input
                        type="text"
                        value={profile.address.region}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: { ...profile.address, region: e.target.value },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="mt-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <BellIcon className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {locale === 'sv' ? 'Kommunikation' : 'Communication'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {locale === 'sv' ? 'Nyhetsbrev & erbjudanden' : 'Newsletter & offers'}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-purple-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <KeyIcon className="h-6 w-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {locale === 'sv' ? 'Ändra lösenord' : 'Change Password'}
                  </h2>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'sv' ? 'Nuvarande lösenord' : 'Current password'}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'sv' ? 'Nytt lösenord' : 'New password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {locale === 'sv' ? 'Minst 8 tecken' : 'At least 8 characters'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'sv' ? 'Bekräfta nytt lösenord' : 'Confirm new password'}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-purple-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm">{profile.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {locale === 'sv' ? 'Snabblänkar' : 'Quick links'}
              </h3>
              <div className="space-y-3">
                <Link
                  href="/account/orders"
                  className="block w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Mina beställningar' : 'My orders'}
                </Link>
                <Link
                  href="/account/privacy"
                  className="block w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'GDPR & Integritet' : 'GDPR & Privacy'}
                </Link>
                <Link
                  href="/contact"
                  className="block w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Kontakta oss' : 'Contact us'}
                </Link>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gradient-to-r from-purple-50 to-yellow-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {locale === 'sv' ? 'Behöver du hjälp?' : 'Need help?'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {locale === 'sv'
                  ? 'Kontakta oss om du har frågor om ditt konto.'
                  : 'Contact us if you have questions about your account.'}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                {locale === 'sv' ? 'Kontakta support' : 'Contact support'}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
