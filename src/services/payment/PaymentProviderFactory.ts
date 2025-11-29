// Payment Provider Factory
// Following Open/Closed Principle and Factory Pattern
// New payment providers can be added without modifying existing code

import { injectable, inject, container } from 'tsyringe';
import { IPaymentProvider } from './IPaymentProvider';
import { StripePaymentProvider } from './providers/StripePaymentProvider';
import { SwishPaymentProvider } from './providers/SwishPaymentProvider';
import { KlarnaPaymentProvider } from './providers/KlarnaPaymentProvider';
import { PaymentMethod } from '@/types';

export interface PaymentProviderConfig {
  provider: IPaymentProvider;
  enabled: boolean;
}

@injectable()
export class PaymentProviderFactory {
  private providers: Map<PaymentMethod, PaymentProviderConfig>;

  constructor() {
    this.providers = new Map();
    this.registerProviders();
  }

  private registerProviders(): void {
    // Register all payment providers
    // New providers can be added here without modifying the factory logic
    this.registerProvider('stripe', new StripePaymentProvider(), true);
    this.registerProvider('swish', new SwishPaymentProvider(), true);
    this.registerProvider('klarna', new KlarnaPaymentProvider(), true);
  }

  private registerProvider(
    method: PaymentMethod,
    provider: IPaymentProvider,
    enabled: boolean = true
  ): void {
    this.providers.set(method, { provider, enabled });
  }

  getProvider(method: PaymentMethod): IPaymentProvider | null {
    const config = this.providers.get(method);

    if (!config) {
      return null;
    }

    if (!config.enabled) {
      return null;
    }

    return config.provider;
  }

  getAvailableProviders(): PaymentMethod[] {
    return Array.from(this.providers.entries())
      .filter(([_, config]) => config.enabled)
      .map(([method, _]) => method);
  }

  getSupportedProvidersForCountry(countryCode: string): PaymentMethod[] {
    return Array.from(this.providers.entries())
      .filter(([_, config]) =>
        config.enabled &&
        config.provider.supportedCountries.includes(countryCode)
      )
      .map(([method, _]) => method);
  }

  getSupportedProvidersForCurrency(currency: string): PaymentMethod[] {
    return Array.from(this.providers.entries())
      .filter(([_, config]) =>
        config.enabled &&
        config.provider.supportedCurrencies.includes(currency)
      )
      .map(([method, _]) => method);
  }

  enableProvider(method: PaymentMethod): void {
    const config = this.providers.get(method);
    if (config) {
      config.enabled = true;
    }
  }

  disableProvider(method: PaymentMethod): void {
    const config = this.providers.get(method);
    if (config) {
      config.enabled = false;
    }
  }

  isProviderAvailable(method: PaymentMethod): boolean {
    const config = this.providers.get(method);
    return config ? config.enabled : false;
  }
}
