'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { XMarkIcon, CogIcon } from '@heroicons/react/24/outline';

interface ConsentData {
  marketing: boolean;
  analytics: boolean;
  functional: boolean;
  updatedAt: Date;
}

interface CookieConsentProps {
  locale?: string;
}

export function CookieConsent({ locale = 'sv' }: CookieConsentProps) {
  const { data: session } = useSession();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentData>({
    marketing: false,
    analytics: false,
    functional: true,
    updatedAt: new Date(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConsentStatus();
  }, [session]);

  const checkConsentStatus = async () => {
    // Check localStorage first for non-authenticated users
    const storedConsent = localStorage.getItem('cookie-consent');
    
    if (storedConsent) {
      const parsed = JSON.parse(storedConsent);
      // Check if consent is recent (less than 1 year old)
      const consentDate = new Date(parsed.updatedAt);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (consentDate > oneYearAgo) {
        return; // Don't show banner
      }
    }

    // For authenticated users, check server
    if (session?.user?.id) {
      try {
        const response = await fetch('/api/gdpr?action=consent-status');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Check if consent is recent
            const consentDate = new Date(data.data.updatedAt);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            if (consentDate > oneYearAgo) {
              return; // Don't show banner
            }
          }
        }
      } catch (error) {
        console.error('Failed to check consent status:', error);
      }
    }

    // Show banner if no recent consent found
    setShowBanner(true);
  };

  const handleAcceptAll = async () => {
    const newConsent = {
      marketing: true,
      analytics: true,
      functional: true,
      updatedAt: new Date(),
    };

    await saveConsent(newConsent);
  };

  const handleAcceptSelected = async () => {
    await saveConsent(consent);
  };

  const handleRejectAll = async () => {
    const newConsent = {
      marketing: false,
      analytics: false,
      functional: true, // Always true - essential cookies
      updatedAt: new Date(),
    };

    await saveConsent(newConsent);
  };

  const saveConsent = async (consentData: ConsentData) => {
    setLoading(true);
    
    try {
      // Save to localStorage for all users
      localStorage.setItem('cookie-consent', JSON.stringify(consentData));

      // Save to server for authenticated users
      if (session?.user?.id) {
        await fetch('/api/gdpr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update-consent',
            marketing: consentData.marketing,
            analytics: consentData.analytics,
            functional: consentData.functional,
          }),
        });
      }

      // Apply consent settings
      applyConsentSettings(consentData);
      
      setShowBanner(false);
      setShowDetails(false);

    } catch (error) {
      console.error('Failed to save consent:', error);
      alert(locale === 'sv' ? 'Kunde inte spara inställningar' : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const applyConsentSettings = (consentData: ConsentData) => {
    // Apply analytics consent
    if (consentData.analytics) {
      // Enable analytics (Google Analytics, etc.)
      console.log('Analytics enabled');
    } else {
      // Disable analytics
      console.log('Analytics disabled');
    }

    // Apply marketing consent
    if (consentData.marketing) {
      // Enable marketing cookies (tracking pixels, etc.)
      console.log('Marketing cookies enabled');
    } else {
      // Disable marketing cookies
      console.log('Marketing cookies disabled');
    }

    // Functional cookies are always enabled
  };

  const handleConsentChange = (field: keyof Omit<ConsentData, 'updatedAt'>, value: boolean) => {
    if (field === 'functional') return; // Cannot change functional cookies
    
    setConsent(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date(),
    }));
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <CogIcon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  {locale === 'sv' ? 'Vi använder cookies' : 'We use cookies'}
                </h3>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">
                {locale === 'sv' 
                  ? 'Vi använder cookies för att förbättra din upplevelse på vår webbplats. Du kan välja vilka typer av cookies du godkänner.'
                  : 'We use cookies to improve your experience on our website. You can choose which types of cookies you accept.'
                }
              </p>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAcceptAll}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {locale === 'sv' ? 'Acceptera alla' : 'Accept all'}
                </button>
                
                <button
                  onClick={handleRejectAll}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {locale === 'sv' ? 'Avvisa alla' : 'Reject all'}
                </button>
                
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 border border-purple-300 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
                >
                  {locale === 'sv' ? 'Anpassa' : 'Customize'}
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setShowBanner(false)}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Settings Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {locale === 'sv' ? 'Cookie-inställningar' : 'Cookie settings'}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Functional Cookies */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {locale === 'sv' ? 'Funktionella cookies' : 'Functional cookies'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {locale === 'sv' 
                        ? 'Nödvändiga för att webbplatsen ska fungera korrekt. Dessa cookies kan inte avaktiveras.'
                        : 'Necessary for the website to function properly. These cookies cannot be disabled.'
                      }
                    </p>
                  </div>
                  <div className="w-11 h-6 bg-green-500 rounded-full relative ml-4">
                    <div className="absolute top-[2px] right-[2px] bg-white rounded-full h-5 w-5"></div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {locale === 'sv' ? 'Analytiska cookies' : 'Analytics cookies'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {locale === 'sv' 
                        ? 'Hjälper oss förstå hur besökare interagerar med webbplatsen genom att samla in anonymiserad information.'
                        : 'Help us understand how visitors interact with the website by collecting anonymized information.'
                      }
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {locale === 'sv' ? 'Marknadsföringscookies' : 'Marketing cookies'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {locale === 'sv' 
                        ? 'Används för att spåra besökare över webbplatser för att visa relevanta annonser.'
                        : 'Used to track visitors across websites to display relevant advertisements.'
                      }
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={consent.marketing}
                      onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-8">
                <button
                  onClick={handleAcceptSelected}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading 
                    ? (locale === 'sv' ? 'Sparar...' : 'Saving...')
                    : (locale === 'sv' ? 'Spara inställningar' : 'Save settings')
                  }
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {locale === 'sv' ? 'Avbryt' : 'Cancel'}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  {locale === 'sv' 
                    ? 'Du kan när som helst ändra dessa inställningar i ditt konto under "GDPR & Integritet"'
                    : 'You can change these settings at any time in your account under "GDPR & Privacy"'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}