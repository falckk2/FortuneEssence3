'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ConsentData {
  marketing: boolean;
  analytics: boolean;
  functional: boolean;
  updatedAt: string;
}

interface ProcessingPurpose {
  purpose: string;
  description: string;
  legalBasis: string;
  dataTypes: string[];
}

interface RetentionPolicy {
  dataType: string;
  retentionPeriod: string;
  purpose: string;
}

interface GDPRActivity {
  id: string;
  activity: string;
  description: string;
  timestamp: string;
}

export default function PrivacyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentData | null>(null);
  const [purposes, setPurposes] = useState<ProcessingPurpose[]>([]);
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [activities, setActivities] = useState<GDPRActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const locale = 'sv'; // This would come from context in a real app

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/account/privacy');
      return;
    }
    
    loadPrivacyData();
  }, [session, status, router]);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      
      // Load all GDPR data in parallel
      const [consentRes, purposesRes, policiesRes, activitiesRes] = await Promise.all([
        fetch('/api/gdpr?action=consent-status'),
        fetch('/api/gdpr?action=processing-purposes'),
        fetch('/api/gdpr?action=retention-policies'),
        fetch('/api/gdpr?action=activity-log'),
      ]);

      if (consentRes.ok) {
        const data = await consentRes.json();
        if (data.success) setConsent(data.data);
      }

      if (purposesRes.ok) {
        const data = await purposesRes.json();
        if (data.success) setPurposes(data.data);
      }

      if (policiesRes.ok) {
        const data = await policiesRes.json();
        if (data.success) setPolicies(data.data);
      }

      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        if (data.success) setActivities(data.data);
      }

    } catch (error) {
      console.error('Failed to load privacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (field: keyof Omit<ConsentData, 'updatedAt'>, value: boolean) => {
    if (!consent || updating) return;

    const newConsent = { ...consent, [field]: value };
    setConsent(newConsent);

    try {
      setUpdating(true);
      const response = await fetch('/api/gdpr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-consent',
          marketing: newConsent.marketing,
          analytics: newConsent.analytics,
          functional: newConsent.functional,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update consent');
      }

      // Reload activities to show the update
      const activitiesRes = await fetch('/api/gdpr?action=activity-log');
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        if (data.success) setActivities(data.data);
      }

    } catch (error) {
      console.error('Failed to update consent:', error);
      // Revert the change
      setConsent(consent);
      alert(locale === 'sv' ? 'Kunde inte uppdatera samtycke' : 'Failed to update consent');
    } finally {
      setUpdating(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/gdpr?action=data-portability&format=${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `user-data.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Failed to export data:', error);
      alert(locale === 'sv' ? 'Kunde inte exportera data' : 'Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleting) {
      setDeleting(true);
      try {
        const response = await fetch('/api/gdpr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'request-deletion',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete account');
        }

        alert(locale === 'sv' 
          ? 'Ditt konto har raderats. Du kommer att omdirigeras till startsidan.'
          : 'Your account has been deleted. You will be redirected to the homepage.'
        );
        
        window.location.href = '/';

      } catch (error) {
        console.error('Failed to delete account:', error);
        alert(locale === 'sv' ? 'Kunde inte radera konto' : 'Failed to delete account');
      } finally {
        setDeleting(false);
        setShowDeleteConfirmation(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (!session) {
    return null; // Will redirect
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
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {locale === 'sv' ? 'GDPR & Integritet' : 'GDPR & Privacy'}
              </h1>
              <p className="text-gray-600 mt-2">
                {locale === 'sv' 
                  ? 'Hantera dina data och integritetsinställningar'
                  : 'Manage your data and privacy settings'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Consent Management */}
            {consent && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {locale === 'sv' ? 'Samtyckeshantering' : 'Consent Management'}
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {locale === 'sv' ? 'Marknadsföring' : 'Marketing'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {locale === 'sv' 
                          ? 'Få nyhetsbrev och erbjudanden via e-post'
                          : 'Receive newsletters and offers via email'
                        }
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.marketing}
                        onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                        disabled={updating}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {locale === 'sv' ? 'Analys' : 'Analytics'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {locale === 'sv' 
                          ? 'Hjälp oss förbättra hemsidan genom användningsdata'
                          : 'Help us improve the website through usage data'
                        }
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.analytics}
                        onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                        disabled={updating}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {locale === 'sv' ? 'Funktionella cookies' : 'Functional cookies'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {locale === 'sv' 
                          ? 'Nödvändiga för att hemsidan ska fungera (kan inte avaktiveras)'
                          : 'Necessary for the website to function (cannot be disabled)'
                        }
                      </p>
                    </div>
                    <div className="w-11 h-6 bg-green-500 rounded-full relative">
                      <div className="absolute top-[2px] right-[2px] bg-white rounded-full h-5 w-5 flex items-center justify-center">
                        <CheckCircleIcon className="w-3 h-3 text-green-500" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    {locale === 'sv' 
                      ? `Senast uppdaterat: ${formatDate(consent.updatedAt)}`
                      : `Last updated: ${formatDate(consent.updatedAt)}`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Data Processing Purposes */}
            {purposes.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {locale === 'sv' ? 'Hur vi använder dina data' : 'How we use your data'}
                </h2>
                
                <div className="space-y-4">
                  {purposes.map((purpose, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{purpose.purpose}</h3>
                          <p className="text-sm text-gray-600 mt-1">{purpose.description}</p>
                          <div className="mt-3">
                            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              {purpose.legalBasis}
                            </span>
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">
                                {locale === 'sv' ? 'Datatyper:' : 'Data types:'} {purpose.dataTypes.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GDPR Activity Log */}
            {activities.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {locale === 'sv' ? 'Integritetshändelser' : 'Privacy activity'}
                </h2>
                
                <div className="space-y-3">
                  {activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                      <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Rights */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {locale === 'sv' ? 'Dina rättigheter' : 'Your rights'}
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleExportData('json')}
                  className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-3" />
                  {locale === 'sv' ? 'Exportera data (JSON)' : 'Export data (JSON)'}
                </button>
                
                <button
                  onClick={() => handleExportData('csv')}
                  className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-3" />
                  {locale === 'sv' ? 'Exportera data (CSV)' : 'Export data (CSV)'}
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="w-full flex items-center justify-start px-4 py-3 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  <TrashIcon className="h-5 w-5 mr-3" />
                  {locale === 'sv' ? 'Radera konto' : 'Delete account'}
                </button>
              </div>
            </div>

            {/* Data Retention */}
            {policies.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {locale === 'sv' ? 'Datalagring' : 'Data retention'}
                </h3>
                
                <div className="space-y-3">
                  {policies.map((policy, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium text-gray-900">{policy.dataType}</p>
                      <p className="text-gray-600">{policy.retentionPeriod}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="bg-gradient-to-r from-purple-50 to-yellow-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {locale === 'sv' ? 'Integritetsfrågor?' : 'Privacy questions?'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {locale === 'sv' 
                  ? 'Kontakta oss för frågor om dina personuppgifter.'
                  : 'Contact us for questions about your personal data.'
                }
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                {locale === 'sv' ? 'Kontakta oss' : 'Contact us'}
                <ArrowLeftIcon className="w-4 h-4 ml-1 rotate-180" />
              </Link>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {locale === 'sv' ? 'Radera konto' : 'Delete account'}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                {locale === 'sv' 
                  ? 'Är du säker på att du vill radera ditt konto? Denna åtgärd kan inte ångras och all din data kommer att raderas permanent.'
                  : 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
                }
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {locale === 'sv' ? 'Avbryt' : 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting 
                    ? (locale === 'sv' ? 'Raderar...' : 'Deleting...')
                    : (locale === 'sv' ? 'Radera' : 'Delete')
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}