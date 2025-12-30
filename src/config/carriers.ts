/**
 * Carrier Configuration
 *
 * Centralized configuration for all Swedish shipping carriers.
 * Each carrier has services, features, and metadata.
 */

import { CarrierInfo } from '@/types';

export const CARRIERS: Record<string, CarrierInfo> = {
  POSTNORD: {
    code: 'POSTNORD',
    name: 'PostNord',
    logoUrl: '/images/carriers/postnord.svg',
    colorScheme: '#FFDB00',
    trackingPrefix: 'PN',
    services: [
      {
        type: 'STANDARD',
        name: 'PostNord Standard',
        description: 'Standard leverans inom Sverige',
        estimatedDays: 3,
        maxWeight: 10,
        minWeight: 0,
        features: ['Spårning', 'Försäkring upp till 1000 SEK'],
        isEcoFriendly: false,
      },
      {
        type: 'PAKET',
        name: 'PostNord Paket',
        description: 'Paketleverans med spårning',
        estimatedDays: 2,
        maxWeight: 35,
        minWeight: 0,
        features: ['Spårning', 'Försäkring', 'Leveransavi'],
        isEcoFriendly: false,
      },
      {
        type: 'EXPRESS',
        name: 'PostNord Express',
        description: 'Expressleverans nästa arbetsdag',
        estimatedDays: 1,
        maxWeight: 35,
        minWeight: 0,
        features: ['Spårning', 'Försäkring', 'Leveransavi', 'Express'],
        isEcoFriendly: false,
      },
    ],
  },

  DHL: {
    code: 'DHL',
    name: 'DHL',
    logoUrl: '/images/carriers/dhl.svg',
    colorScheme: '#FFCC00',
    trackingPrefix: 'DHL',
    services: [
      {
        type: 'STANDARD',
        name: 'DHL Standard',
        description: 'Standard paketleverans',
        estimatedDays: 2,
        maxWeight: 31.5,
        minWeight: 0,
        features: ['Spårning', 'Försäkring', 'SMS-avisering'],
        isEcoFriendly: false,
      },
      {
        type: 'EXPRESS',
        name: 'DHL Express',
        description: 'Expressleverans före kl 12:00',
        estimatedDays: 1,
        maxWeight: 31.5,
        minWeight: 0,
        features: ['Spårning', 'Försäkring', 'SMS-avisering', 'Express', 'Signaturkrav'],
        isEcoFriendly: false,
      },
    ],
  },

  BRING: {
    code: 'BRING',
    name: 'Bring',
    logoUrl: '/images/carriers/bring.svg',
    colorScheme: '#00B2A9',
    trackingPrefix: 'BR',
    services: [
      {
        type: 'HOME_DELIVERY',
        name: 'Bring Hemleverans',
        description: 'Leverans direkt hem till dörren',
        estimatedDays: 2,
        maxWeight: 35,
        minWeight: 0,
        features: ['Spårning', 'Hemleverans', 'SMS-avisering'],
        isEcoFriendly: false,
      },
      {
        type: 'SERVICEPOINT',
        name: 'Bring Servicepoint',
        description: 'Leverans till närmaste servicepunkt',
        estimatedDays: 2,
        maxWeight: 35,
        minWeight: 0,
        features: ['Spårning', 'Servicepunkt', 'SMS-avisering', 'Förlängd uthämtningstid'],
        isEcoFriendly: false,
      },
      {
        type: 'PICKUP',
        name: 'Bring Pickup',
        description: 'Upphämtning vid utlämningsställe',
        estimatedDays: 3,
        maxWeight: 35,
        minWeight: 0,
        features: ['Spårning', 'Servicepunkt', 'Billigaste alternativet'],
        isEcoFriendly: false,
      },
    ],
  },

  DB_SCHENKER: {
    code: 'DB_SCHENKER',
    name: 'DB Schenker',
    logoUrl: '/images/carriers/db-schenker.svg',
    colorScheme: '#EC0016',
    trackingPrefix: 'DBS',
    services: [
      {
        type: 'HOME_DELIVERY',
        name: 'DB Schenker Home Delivery',
        description: 'Hemleverans med tidsfönster',
        estimatedDays: 2,
        maxWeight: 35,
        minWeight: 0,
        features: ['Spårning', 'Hemleverans', 'Tidsfönster', 'SMS-avisering'],
        isEcoFriendly: false,
      },
      {
        type: 'PARCEL_BOX',
        name: 'DB Schenker Parcel Box',
        description: 'Leverans till paketbox',
        estimatedDays: 2,
        maxWeight: 20,
        minWeight: 0,
        features: ['Spårning', 'Paketbox', '24/7 tillgång'],
        isEcoFriendly: false,
      },
      {
        type: 'SERVICEPOINT',
        name: 'DB Schenker Servicepoint',
        description: 'Leverans till servicepunkt',
        estimatedDays: 2,
        maxWeight: 35,
        minWeight: 0,
        features: ['Spårning', 'Servicepunkt', 'Förlängd uthämtningstid'],
        isEcoFriendly: false,
      },
    ],
  },

  INSTABEE: {
    code: 'INSTABEE',
    name: 'Instabee',
    logoUrl: '/images/carriers/instabee.svg',
    colorScheme: '#FF6B6B',
    trackingPrefix: 'IB',
    services: [
      {
        type: 'HOME_DELIVERY',
        name: 'Instabee Home Delivery',
        description: 'Snabb hemleverans samma dag',
        estimatedDays: 0,
        maxWeight: 20,
        minWeight: 0,
        features: ['Spårning', 'Samma dag', 'SMS-avisering', 'Live-tracking'],
        isEcoFriendly: false,
      },
      {
        type: 'EVENING_DELIVERY',
        name: 'Instabee Evening Delivery',
        description: 'Kvällsleverans 17-21',
        estimatedDays: 0,
        maxWeight: 20,
        minWeight: 0,
        features: ['Spårning', 'Kvällsleverans', 'SMS-avisering', 'Live-tracking'],
        isEcoFriendly: false,
      },
    ],
  },

  BUDBEE: {
    code: 'BUDBEE',
    name: 'Budbee',
    logoUrl: '/images/carriers/budbee.svg',
    colorScheme: '#00D9A5',
    trackingPrefix: 'BD',
    services: [
      {
        type: 'HOME_DELIVERY',
        name: 'Budbee Home Delivery',
        description: 'Hemleverans nästa arbetsdag',
        estimatedDays: 1,
        maxWeight: 20,
        minWeight: 0,
        features: ['Spårning', 'SMS-avisering', 'Tidsfönster', 'Miljövänlig'],
        isEcoFriendly: true,
      },
      {
        type: 'BOX',
        name: 'Budbee Box',
        description: 'Leverans till Budbee Box',
        estimatedDays: 1,
        maxWeight: 20,
        minWeight: 0,
        features: ['Spårning', 'SMS-avisering', '24/7 tillgång', 'Miljövänlig'],
        isEcoFriendly: true,
      },
      {
        type: 'LOCKER',
        name: 'Budbee Locker',
        description: 'Leverans till paketskåp',
        estimatedDays: 1,
        maxWeight: 15,
        minWeight: 0,
        features: ['Spårning', 'SMS-avisering', '24/7 tillgång', 'Billigaste alternativet', 'Miljövänlig'],
        isEcoFriendly: true,
      },
    ],
  },

  INSTABOX: {
    code: 'INSTABOX',
    name: 'Instabox',
    logoUrl: '/images/carriers/instabox.svg',
    colorScheme: '#6C5CE7',
    trackingPrefix: 'IX',
    services: [
      {
        type: 'LOCKER',
        name: 'Instabox Locker',
        description: 'Leverans till paketskåp',
        estimatedDays: 1,
        maxWeight: 20,
        minWeight: 0,
        features: ['Spårning', 'SMS-avisering', '24/7 tillgång', 'Billigaste alternativet'],
        isEcoFriendly: false,
      },
      {
        type: 'SERVICEPOINT',
        name: 'Instabox Servicepoint',
        description: 'Leverans till servicepunkt',
        estimatedDays: 1,
        maxWeight: 20,
        minWeight: 0,
        features: ['Spårning', 'SMS-avisering', 'Förlängd uthämtningstid'],
        isEcoFriendly: false,
      },
    ],
  },

  EARLY_BIRD: {
    code: 'EARLY_BIRD',
    name: 'Early Bird',
    logoUrl: '/images/carriers/early-bird.svg',
    colorScheme: '#4CAF50',
    trackingPrefix: 'EB',
    services: [
      {
        type: 'ECO_STANDARD',
        name: 'Early Bird Eco Standard',
        description: 'Klimatneutral standardleverans',
        estimatedDays: 3,
        maxWeight: 20,
        minWeight: 0,
        features: ['Spårning', 'Klimatneutral', 'Fossilfri transport', 'Kompenserar CO2'],
        isEcoFriendly: true,
      },
      {
        type: 'ECO_EXPRESS',
        name: 'Early Bird Eco Express',
        description: 'Klimatneutral expressleverans',
        estimatedDays: 1,
        maxWeight: 20,
        minWeight: 0,
        features: ['Spårning', 'Klimatneutral', 'Fossilfri transport', 'Express', 'Kompenserar CO2'],
        isEcoFriendly: true,
      },
    ],
  },
};

/**
 * Get carrier by code
 */
export function getCarrierByCode(code: string): CarrierInfo | undefined {
  return CARRIERS[code];
}

/**
 * Get all carriers
 */
export function getAllCarriers(): CarrierInfo[] {
  return Object.values(CARRIERS);
}

/**
 * Get eco-friendly carriers
 */
export function getEcoFriendlyCarriers(): CarrierInfo[] {
  return Object.values(CARRIERS).filter(carrier =>
    carrier.services.some(service => service.isEcoFriendly)
  );
}

/**
 * Get carriers that can handle specific weight
 */
export function getCarriersByWeight(weight: number): CarrierInfo[] {
  return Object.values(CARRIERS).filter(carrier =>
    carrier.services.some(service => weight >= service.minWeight && weight <= service.maxWeight)
  );
}

/**
 * Get tracking prefix for carrier
 */
export function getTrackingPrefix(carrierCode: string): string {
  const carrier = CARRIERS[carrierCode];
  return carrier?.trackingPrefix || 'FE'; // Fortune Essence default
}

/**
 * Get carrier name for tracking number
 */
export function getCarrierFromTracking(trackingNumber: string): string | undefined {
  for (const carrier of Object.values(CARRIERS)) {
    if (trackingNumber.startsWith(carrier.trackingPrefix)) {
      return carrier.code;
    }
  }
  return undefined;
}

/**
 * Free shipping threshold in SEK
 */
export const FREE_SHIPPING_THRESHOLD = 500;

/**
 * Sender address (your company address for shipping labels)
 * Uses environment variables or falls back to defaults
 */
export const SENDER_ADDRESS = {
  firstName: process.env.COMPANY_NAME || 'Fortune Essence',
  lastName: process.env.COMPANY_LEGAL_SUFFIX || 'AB',
  street: process.env.COMPANY_STREET || 'Kungsgatan 12',
  city: process.env.COMPANY_CITY || 'Stockholm',
  postalCode: process.env.COMPANY_POSTAL_CODE || '11143',
  country: process.env.COMPANY_COUNTRY || 'Sweden',
};
