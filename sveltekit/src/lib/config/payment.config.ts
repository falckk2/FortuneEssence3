// Payment configuration
// Following Open/Closed Principle - new payment methods can be added without modifying existing code

export interface PaymentProviderConfig {
  name: string;
  enabled: boolean;
  currencies: string[];
  countries: string[];
}

export const PAYMENT_PROVIDERS: Record<string, PaymentProviderConfig> = {
  stripe: {
    name: 'Stripe',
    enabled: true,
    currencies: ['SEK', 'EUR', 'USD'],
    countries: ['SE', 'NO', 'DK', 'FI', 'US', 'GB'],
  },
  swish: {
    name: 'Swish',
    enabled: true,
    currencies: ['SEK'],
    countries: ['SE'],
  },
  klarna: {
    name: 'Klarna',
    enabled: true,
    currencies: ['SEK', 'EUR'],
    countries: ['SE', 'NO', 'DK', 'FI', 'DE', 'AT', 'NL'],
  },
};

export const TAX_RATES: Record<string, number> = {
  SE: 0.25, // Sweden: 25% VAT
  NO: 0.25, // Norway: 25% VAT
  DK: 0.25, // Denmark: 25% VAT
  FI: 0.24, // Finland: 24% VAT
  EU: 0.20, // EU default: 20% VAT
  DEFAULT: 0.25,
};

export class TaxCalculator {
  calculateTax(amount: number, countryCode: string): number {
    const rate = TAX_RATES[countryCode] || TAX_RATES.DEFAULT;
    return Math.round(amount * rate * 100) / 100;
  }

  getTaxRate(countryCode: string): number {
    return TAX_RATES[countryCode] || TAX_RATES.DEFAULT;
  }
}
