'use client';

import { useState, useEffect } from 'react';
import {
  TruckIcon,
  ClockIcon,
  SparklesIcon,
  MapPinIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ShippingRate {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimatedDays: number;
  maxWeight: number;
}

interface ShippingOption {
  carrier: string;
  services: Array<{
    name: string;
    description: string;
    estimatedDays: number;
    maxWeight: number;
    features: string[];
  }>;
}

interface SwedishShippingOptionsProps {
  postalCode: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  onRateSelect: (rate: ShippingRate) => void;
  selectedRateId?: string;
  locale?: string;
}

export function SwedishShippingOptions({ 
  postalCode, 
  items, 
  onRateSelect, 
  selectedRateId,
  locale = 'sv' 
}: SwedishShippingOptionsProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [ecoOptions, setEcoOptions] = useState<any>(null);
  const [zoneInfo, setZoneInfo] = useState<any>(null);
  const [carrierServices, setCarrierServices] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEcoOptions, setShowEcoOptions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (postalCode && items.length > 0) {
      loadShippingOptions();
    }
  }, [postalCode, items]);

  const loadShippingOptions = async () => {
    try {
      setLoading(true);
      setError('');

      // Load regular shipping rates
      const ratesResponse = await fetch('/api/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'calculate-shipping',
          items,
          country: 'Sweden',
          postalCode,
        }),
      });

      if (!ratesResponse.ok) {
        throw new Error('Failed to load shipping rates');
      }

      const ratesData = await ratesResponse.json();
      if (ratesData.success) {
        setRates(ratesData.data.options || []);
        setZoneInfo(ratesData.data.zoneInfo);
      }

      // Load eco shipping options
      const ecoResponse = await fetch('/api/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'calculate-eco-shipping',
          items,
          country: 'Sweden',
        }),
      });

      if (ecoResponse.ok) {
        const ecoData = await ecoResponse.json();
        if (ecoData.success) {
          setEcoOptions(ecoData.data);
        }
      }

      // Load carrier services information
      const servicesResponse = await fetch('/api/shipping?action=carrier-services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        if (servicesData.success) {
          setCarrierServices(servicesData.data);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shipping options');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
    }).format(price);
  };

  const getDeliveryText = (days: number) => {
    if (days === 1) {
      return locale === 'sv' ? 'Nästa arbetsdag' : 'Next business day';
    } else if (days <= 3) {
      return locale === 'sv' ? `${days} arbetsdagar` : `${days} business days`;
    } else {
      return locale === 'sv' ? `${days} arbetsdagar` : `${days} business days`;
    }
  };

  const getZoneDescription = (zone: string) => {
    const descriptions = {
      'Stockholm': locale === 'sv' ? 'Stockholmsområdet' : 'Stockholm area',
      'Göteborg': locale === 'sv' ? 'Göteborgsområdet' : 'Gothenburg area',
      'Malmö': locale === 'sv' ? 'Malmöområdet' : 'Malmö area',
      'Uppsala': locale === 'sv' ? 'Uppsala län' : 'Uppsala county',
      'Norrland': locale === 'sv' ? 'Norra Sverige' : 'Northern Sweden',
      'Övriga Sverige': locale === 'sv' ? 'Övriga Sverige' : 'Rest of Sweden',
    };
    return descriptions[zone as keyof typeof descriptions] || zone;
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-600 text-center">
          <p className="font-medium">
            {locale === 'sv' ? 'Kunde inte ladda leveransalternativ' : 'Could not load shipping options'}
          </p>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={loadShippingOptions}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {locale === 'sv' ? 'Försök igen' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Zone Information */}
      {zoneInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {getZoneDescription(zoneInfo.zone)}
            </span>
          </div>
          {zoneInfo.additionalDays > 0 && (
            <p className="text-sm text-blue-700 mt-1">
              {locale === 'sv' 
                ? `+${zoneInfo.additionalDays} dag(ar) leveranstid på grund av geografiskt läge`
                : `+${zoneInfo.additionalDays} day(s) additional delivery time due to geographic location`
              }
            </p>
          )}
        </div>
      )}

      {/* Standard Shipping Options */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {locale === 'sv' ? 'Leveransalternativ' : 'Shipping options'}
        </h3>
        
        <div className="space-y-3">
          {rates.map((rate) => (
            <label
              key={rate.id}
              className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedRateId === rate.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="shipping-rate"
                    value={rate.id}
                    checked={selectedRateId === rate.id}
                    onChange={() => onRateSelect(rate)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <TruckIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{rate.name}</span>
                    </div>
                    {rate.description && (
                      <p className="text-sm text-gray-600 mt-1">{rate.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {getDeliveryText(rate.estimatedDays)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {locale === 'sv' ? 'Max' : 'Max'} {rate.maxWeight}kg
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {rate.price === 0 ? (
                      <span className="text-green-600">
                        {locale === 'sv' ? 'Gratis' : 'Free'}
                      </span>
                    ) : (
                      formatPrice(rate.price)
                    )}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Eco Shipping Options */}
      {ecoOptions && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {locale === 'sv' ? 'Miljövänlig leverans' : 'Eco-friendly shipping'}
              </h3>
            </div>
            <button
              onClick={() => setShowEcoOptions(!showEcoOptions)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {showEcoOptions 
                ? (locale === 'sv' ? 'Dölj' : 'Hide')
                : (locale === 'sv' ? 'Visa alternativ' : 'Show options')
              }
            </button>
          </div>

          {showEcoOptions && (
            <div className="space-y-3">
              <label
                className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRateId === ecoOptions.ecoRate.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="shipping-rate"
                      value={ecoOptions.ecoRate.id}
                      checked={selectedRateId === ecoOptions.ecoRate.id}
                      onChange={() => onRateSelect(ecoOptions.ecoRate)}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <SparklesIcon className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">{ecoOptions.ecoRate.name}</span>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          CO₂-neutral
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {locale === 'sv' 
                          ? `Klimatkompenserar ${ecoOptions.carbonOffset.kg}kg CO₂`
                          : `Carbon offsets ${ecoOptions.carbonOffset.kg}kg CO₂`
                        }
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {getDeliveryText(ecoOptions.ecoRate.estimatedDays)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(ecoOptions.ecoRate.price)}
                    </span>
                    <p className="text-xs text-green-600">
                      +{formatPrice(ecoOptions.carbonOffset.cost)} {locale === 'sv' ? 'klimatkompensation' : 'carbon offset'}
                    </p>
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Carrier Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {locale === 'sv' ? 'Leverantörsinformation' : 'Carrier information'}
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            <InformationCircleIcon className="w-4 h-4" />
            <span>{showDetails ? (locale === 'sv' ? 'Dölj' : 'Hide') : (locale === 'sv' ? 'Visa detaljer' : 'Show details')}</span>
          </button>
        </div>

        {showDetails && (
          <div className="space-y-4">
            {carrierServices.map((carrier, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{carrier.carrier}</h4>
                <div className="space-y-2">
                  {carrier.services.map((service, serviceIndex) => (
                    <div key={serviceIndex} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{service.name}</span>
                        <span className="text-gray-500">{getDeliveryText(service.estimatedDays)}</span>
                      </div>
                      <p className="text-gray-600">{service.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {service.features.map((feature, featureIndex) => (
                          <span
                            key={featureIndex}
                            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Free Shipping Notice */}
      {rates.some(rate => rate.price === 0) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              {locale === 'sv' 
                ? 'Gratis frakt på beställningar över 500 SEK'
                : 'Free shipping on orders over 500 SEK'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}