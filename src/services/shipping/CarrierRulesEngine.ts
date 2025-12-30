/**
 * Carrier Rules Engine
 *
 * Smart filtering and sorting logic for shipping carriers
 * based on order weight, value, destination, and preferences
 */

import { injectable } from 'tsyringe';
import { CarrierInfo, ShippingRate } from '@/types';
import { getAllCarriers, getCarriersByWeight, getEcoFriendlyCarriers } from '@/config/carriers';

export interface FilterCriteria {
  weight: number;
  orderValue: number;
  destination: string;
  postalCode?: string;
  preferences?: {
    speed?: 'fastest' | 'standard';
    eco?: boolean;
    price?: 'cheapest' | 'premium';
  };
}

@injectable()
export class CarrierRulesEngine {
  /**
   * Apply smart filters to carriers based on criteria
   */
  applySmartFilters(carriers: CarrierInfo[], criteria: FilterCriteria): CarrierInfo[] {
    let filtered = carriers;

    // Weight filter (hard constraint)
    filtered = this.filterByWeight(filtered, criteria.weight);

    // High-value orders get premium carriers prioritized
    if (criteria.orderValue > 1000) {
      filtered = this.prioritizePremiumCarriers(filtered);
    }

    // Destination-based filtering
    if (criteria.postalCode) {
      filtered = this.filterByDestination(filtered, criteria.postalCode);
    }

    // Apply user preferences
    if (criteria.preferences?.eco) {
      filtered = this.prioritizeEcoFriendly(filtered);
    }

    if (criteria.preferences?.speed === 'fastest') {
      filtered = this.sortBySpeed(filtered);
    } else if (criteria.preferences?.price === 'cheapest') {
      // This will be applied to rates, not carriers
      // But we can deprioritize premium carriers
      filtered = this.deprioritizePremiumCarriers(filtered);
    }

    return filtered;
  }

  /**
   * Filter carriers by package weight
   */
  filterByWeight(carriers: CarrierInfo[], weight: number): CarrierInfo[] {
    return carriers.filter(carrier =>
      carrier.services.some(service =>
        weight >= service.minWeight && weight <= service.maxWeight
      )
    );
  }

  /**
   * Filter carriers by destination (postal code zones)
   */
  filterByDestination(carriers: CarrierInfo[], postalCode: string): CarrierInfo[] {
    // All carriers support Sweden for now
    // In the future, could filter by specific zones or regions
    const zone = this.getSwedishZone(postalCode);

    // Some carriers might not deliver to remote areas
    if (zone === 'Norrland') {
      // Filter out same-day carriers for Norrland
      return carriers.filter(carrier =>
        carrier.code !== 'INSTABEE' // Instabee doesn't deliver to Norrland
      );
    }

    return carriers;
  }

  /**
   * Prioritize premium carriers for high-value orders
   */
  prioritizePremiumCarriers(carriers: CarrierInfo[]): CarrierInfo[] {
    const premiumCarriers = ['DHL', 'BUDBEE', 'INSTABEE'];

    return carriers.sort((a, b) => {
      const aIsPremium = premiumCarriers.includes(a.code);
      const bIsPremium = premiumCarriers.includes(b.code);

      if (aIsPremium && !bIsPremium) return -1;
      if (!aIsPremium && bIsPremium) return 1;
      return 0;
    });
  }

  /**
   * Deprioritize premium carriers (for budget-conscious customers)
   */
  deprioritizePremiumCarriers(carriers: CarrierInfo[]): CarrierInfo[] {
    const premiumCarriers = ['DHL', 'INSTABEE'];

    return carriers.sort((a, b) => {
      const aIsPremium = premiumCarriers.includes(a.code);
      const bIsPremium = premiumCarriers.includes(b.code);

      if (aIsPremium && !bIsPremium) return 1;
      if (!aIsPremium && bIsPremium) return -1;
      return 0;
    });
  }

  /**
   * Prioritize eco-friendly carriers
   */
  prioritizeEcoFriendly(carriers: CarrierInfo[]): CarrierInfo[] {
    return carriers.sort((a, b) => {
      const aHasEco = a.services.some(s => s.isEcoFriendly);
      const bHasEco = b.services.some(s => s.isEcoFriendly);

      if (aHasEco && !bHasEco) return -1;
      if (!aHasEco && bHasEco) return 1;
      return 0;
    });
  }

  /**
   * Sort carriers by delivery speed (fastest first)
   */
  sortBySpeed(carriers: CarrierInfo[]): CarrierInfo[] {
    return carriers.sort((a, b) => {
      const aFastest = Math.min(...a.services.map(s => s.estimatedDays));
      const bFastest = Math.min(...b.services.map(s => s.estimatedDays));
      return aFastest - bFastest;
    });
  }

  /**
   * Sort shipping rates by price (cheapest first)
   */
  sortByPrice(rates: ShippingRate[]): ShippingRate[] {
    return rates.sort((a, b) => a.price - b.price);
  }

  /**
   * Sort shipping rates by speed (fastest first)
   */
  sortRatesBySpeed(rates: ShippingRate[]): ShippingRate[] {
    return rates.sort((a, b) => a.estimatedDays - b.estimatedDays);
  }

  /**
   * Filter rates by eco-friendly only
   */
  filterEcoFriendlyRates(rates: ShippingRate[]): ShippingRate[] {
    return rates.filter(rate => rate.isEcoFriendly);
  }

  /**
   * Get recommended carrier based on criteria
   */
  getRecommendedRate(rates: ShippingRate[], criteria: FilterCriteria): ShippingRate | undefined {
    if (rates.length === 0) return undefined;

    // For high-value orders, recommend faster delivery
    if (criteria.orderValue > 1000) {
      const sortedBySpeed = this.sortRatesBySpeed([...rates]);
      return sortedBySpeed[0];
    }

    // For eco-preference, recommend eco-friendly options
    if (criteria.preferences?.eco) {
      const ecoRates = this.filterEcoFriendlyRates(rates);
      if (ecoRates.length > 0) {
        return this.sortByPrice(ecoRates)[0]; // Cheapest eco option
      }
    }

    // Default: cheapest option
    return this.sortByPrice([...rates])[0];
  }

  /**
   * Get Swedish postal code zone
   */
  private getSwedishZone(postalCode: string): string {
    const code = postalCode.replace(/\s/g, '');
    const firstTwo = parseInt(code.substring(0, 2));

    // Uppsala region (check first to avoid overlap with Stockholm)
    if (firstTwo === 75) {
      return 'Uppsala';
    }

    // Stockholm region
    if ((firstTwo >= 10 && firstTwo <= 19) || (firstTwo >= 76 && firstTwo <= 77)) {
      return 'Stockholm';
    }

    // Göteborg region
    if ((firstTwo >= 40 && firstTwo <= 44) || (firstTwo >= 50 && firstTwo <= 54)) {
      return 'Göteborg';
    }

    // Malmö region
    if ((firstTwo >= 20 && firstTwo <= 26) || (firstTwo >= 27 && firstTwo <= 28)) {
      return 'Malmö';
    }

    // Norrland (northern Sweden)
    if (firstTwo >= 80 && firstTwo <= 98) {
      return 'Norrland';
    }

    // Rest of Sweden
    return 'Övriga Sverige';
  }

  /**
   * Calculate zone-based price multiplier
   */
  getZoneMultiplier(postalCode: string): number {
    const zone = this.getSwedishZone(postalCode);

    const multipliers: Record<string, number> = {
      'Stockholm': 1.0,
      'Göteborg': 1.0,
      'Malmö': 1.0,
      'Uppsala': 1.1,
      'Norrland': 1.3,
      'Övriga Sverige': 1.15,
    };

    return multipliers[zone] || 1.0;
  }

  /**
   * Filter rates that exceed weight limit
   */
  filterByWeightLimit(rates: ShippingRate[], weight: number): ShippingRate[] {
    return rates.filter(rate => {
      const minWeight = rate.minWeight || 0;
      const maxWeight = rate.maxWeight;
      return weight >= minWeight && weight <= maxWeight;
    });
  }

  /**
   * Group rates by carrier
   */
  groupByCarrier(rates: ShippingRate[]): Record<string, ShippingRate[]> {
    return rates.reduce((groups, rate) => {
      const carrier = rate.carrierCode || 'unknown';
      if (!groups[carrier]) {
        groups[carrier] = [];
      }
      groups[carrier].push(rate);
      return groups;
    }, {} as Record<string, ShippingRate[]>);
  }

  /**
   * Get fastest rate for each carrier
   */
  getFastestRatePerCarrier(rates: ShippingRate[]): ShippingRate[] {
    const grouped = this.groupByCarrier(rates);
    const fastest: ShippingRate[] = [];

    for (const carrierRates of Object.values(grouped)) {
      const sorted = this.sortRatesBySpeed(carrierRates);
      if (sorted.length > 0) {
        fastest.push(sorted[0]);
      }
    }

    return fastest;
  }

  /**
   * Get cheapest rate for each carrier
   */
  getCheapestRatePerCarrier(rates: ShippingRate[]): ShippingRate[] {
    const grouped = this.groupByCarrier(rates);
    const cheapest: ShippingRate[] = [];

    for (const carrierRates of Object.values(grouped)) {
      const sorted = this.sortByPrice(carrierRates);
      if (sorted.length > 0) {
        cheapest.push(sorted[0]);
      }
    }

    return cheapest;
  }
}
