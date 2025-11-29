import { IShippingService, Shipment, TrackingInfo } from '@/interfaces/services';
import { ShippingRate, CartItem, ApiResponse } from '@/types';
import { ShippingRepository } from '@/repositories/shipping/ShippingRepository';
import { ProductRepository } from '@/repositories/products/ProductRepository';
import { PriceCalculator } from '@/utils/helpers';

export class ShippingService implements IShippingService {
  private shippingRepository: ShippingRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.shippingRepository = new ShippingRepository();
    this.productRepository = new ProductRepository();
  }

  async getShippingRates(country: string, weight: number): Promise<ApiResponse<ShippingRate[]>> {
    try {
      const result = await this.shippingRepository.findRatesByCountry(country);
      
      if (!result.success) {
        return result;
      }

      // Filter rates based on weight capacity
      const availableRates = result.data!.filter(rate => rate.maxWeight >= weight);

      return {
        success: true,
        data: availableRates,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get shipping rates: ${error}`,
      };
    }
  }

  async calculateShipping(items: CartItem[], country: string): Promise<ApiResponse<ShippingRate>> {
    try {
      // Calculate total weight
      const totalWeight = await this.calculateTotalWeight(items);
      
      if (totalWeight === 0) {
        return {
          success: false,
          error: 'Unable to calculate shipping weight',
        };
      }

      // Get the most economical shipping option for this weight
      const result = await this.shippingRepository.calculateShipping(totalWeight, country);
      
      if (!result.success) {
        return result;
      }

      // Check for free shipping eligibility
      const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const freeShippingThreshold = await this.getFreeShippingThreshold(country);
      
      if (freeShippingThreshold.success && freeShippingThreshold.data && cartTotal >= freeShippingThreshold.data) {
        // Apply free shipping if eligible
        return {
          success: true,
          data: {
            ...result.data!,
            price: 0,
            name: result.data!.name + ' (Fri frakt)',
          },
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate shipping: ${error}`,
      };
    }
  }

  async createShipment(orderId: string, shippingRateId: string): Promise<ApiResponse<Shipment>> {
    try {
      // Get shipping rate details
      const rateResult = await this.shippingRepository.findById(shippingRateId);
      
      if (!rateResult.success) {
        return {
          success: false,
          error: 'Shipping rate not found',
        };
      }

      const rate = rateResult.data!;

      // Generate tracking number
      const trackingNumber = this.generateTrackingNumber(rate.name);

      // Calculate estimated delivery date
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + rate.estimatedDays);

      const shipment: Shipment = {
        id: `shipment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        orderId,
        trackingNumber,
        carrier: this.getCarrierFromRate(rate.name),
        status: 'pending',
        estimatedDelivery,
      };

      // In a real implementation, this would integrate with shipping carriers
      // For now, we'll return the mock shipment
      return {
        success: true,
        data: shipment,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create shipment: ${error}`,
      };
    }
  }

  async trackShipment(trackingNumber: string): Promise<ApiResponse<TrackingInfo>> {
    try {
      // In production, this would integrate with carrier tracking APIs
      // For now, we'll simulate tracking information
      
      const carrier = this.getCarrierFromTrackingNumber(trackingNumber);
      const mockTrackingInfo = this.generateMockTrackingInfo(trackingNumber, carrier);

      return {
        success: true,
        data: mockTrackingInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to track shipment: ${error}`,
      };
    }
  }

  private async calculateTotalWeight(items: CartItem[]): Promise<number> {
    try {
      let totalWeight = 0;

      for (const item of items) {
        const productResult = await this.productRepository.findById(item.productId);
        
        if (productResult.success && productResult.data) {
          totalWeight += productResult.data.weight * item.quantity;
        }
      }

      return totalWeight;
    } catch (error) {
      console.error('Failed to calculate total weight:', error);
      return 0;
    }
  }

  private async getFreeShippingThreshold(country: string): Promise<ApiResponse<number | null>> {
    try {
      const result = await this.shippingRepository.getFreeShippingThreshold(country);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get free shipping threshold: ${error}`,
      };
    }
  }

  private generateTrackingNumber(shippingMethod: string): string {
    const prefix = this.getTrackingPrefix(shippingMethod);
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `${prefix}${timestamp}${random}`;
  }

  private getTrackingPrefix(shippingMethod: string): string {
    const method = shippingMethod.toLowerCase();
    
    if (method.includes('postnord')) {
      return 'PN';
    } else if (method.includes('dhl')) {
      return 'DHL';
    } else if (method.includes('express')) {
      return 'EX';
    } else {
      return 'FE'; // Fortune Essence default
    }
  }

  private getCarrierFromRate(rateName: string): string {
    const name = rateName.toLowerCase();
    
    if (name.includes('postnord')) {
      return 'PostNord';
    } else if (name.includes('dhl')) {
      return 'DHL';
    } else {
      return 'Standard';
    }
  }

  private getCarrierFromTrackingNumber(trackingNumber: string): string {
    const prefix = trackingNumber.substring(0, 2);
    
    switch (prefix) {
      case 'PN':
        return 'PostNord';
      case 'DHL':
        return 'DHL';
      case 'EX':
        return 'Express';
      default:
        return 'Standard';
    }
  }

  private generateMockTrackingInfo(trackingNumber: string, carrier: string): TrackingInfo {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    // Generate realistic tracking events based on carrier
    const history = [
      {
        date: twoDaysAgo,
        status: 'Förbereds för transport',
        location: 'Stockholm, Sweden',
        description: 'Paketet har tagits emot och förbereds för transport',
      },
      {
        date: yesterday,
        status: 'Skickad',
        location: 'Stockholm Terminal, Sweden',
        description: 'Paketet har skickats från terminalen',
      },
      {
        date: now,
        status: 'Under transport',
        location: 'På väg till destination',
        description: 'Paketet är på väg till mottagaren',
      },
    ];

    // Estimate delivery (2-3 days from now)
    const estimatedDelivery = new Date(now.getTime() + (2 + Math.random()) * 24 * 60 * 60 * 1000);

    return {
      trackingNumber,
      status: 'Under transport',
      location: 'På väg till destination',
      estimatedDelivery,
      history,
    };
  }

  // Additional utility methods
  async validateDeliveryAddress(address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  }): Promise<ApiResponse<boolean>> {
    try {
      // Basic validation
      if (!address.street || !address.city || !address.postalCode || !address.country) {
        return {
          success: false,
          error: 'Incomplete address information',
        };
      }

      // Validate Swedish postal code format
      if (address.country.toLowerCase() === 'sweden') {
        const postalCodeRegex = /^\d{3}\s?\d{2}$/;
        if (!postalCodeRegex.test(address.postalCode)) {
          return {
            success: false,
            error: 'Invalid Swedish postal code format',
          };
        }
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Address validation failed: ${error}`,
      };
    }
  }

  async getShippingCosts(items: CartItem[], country: string): Promise<ApiResponse<{
    options: ShippingRate[];
    recommended: ShippingRate;
    freeShippingThreshold?: number;
  }>> {
    try {
      const totalWeight = await this.calculateTotalWeight(items);
      const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Get all available shipping options
      const ratesResult = await this.getShippingRates(country, totalWeight);
      
      if (!ratesResult.success) {
        return ratesResult as any;
      }

      const options = ratesResult.data!;
      
      // Find recommended option (usually the most economical)
      const recommended = options.reduce((prev, current) => 
        prev.price < current.price ? prev : current
      );

      // Get free shipping threshold
      const thresholdResult = await this.getFreeShippingThreshold(country);
      
      return {
        success: true,
        data: {
          options,
          recommended,
          freeShippingThreshold: thresholdResult.data || undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get shipping costs: ${error}`,
      };
    }
  }

  async estimateDeliveryDate(shippingRateId: string): Promise<ApiResponse<Date>> {
    try {
      const result = await this.shippingRepository.getEstimatedDeliveryDate(shippingRateId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to estimate delivery date: ${error}`,
      };
    }
  }

  async getSupportedCountries(): Promise<ApiResponse<string[]>> {
    try {
      const result = await this.shippingRepository.getAllCountries();
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get supported countries: ${error}`,
      };
    }
  }

  // Swedish-specific shipping methods
  async validateSwedishPostalCode(postalCode: string): Promise<ApiResponse<{
    isValid: boolean;
    zone: string;
    additionalDays: number;
  }>> {
    try {
      // Remove spaces and validate format
      const cleanCode = postalCode.replace(/\s/g, '');
      const postalCodeRegex = /^\d{5}$/;
      
      if (!postalCodeRegex.test(cleanCode)) {
        return {
          success: false,
          error: 'Invalid Swedish postal code format. Should be 5 digits (e.g., 11122 or 111 22)',
        };
      }

      const code = parseInt(cleanCode);
      let zone = 'Övriga Sverige';
      let additionalDays = 1;

      // Determine zone based on postal code
      if (code >= 10000 && code <= 19999) {
        zone = 'Stockholm';
        additionalDays = 0;
      } else if (code >= 40000 && code <= 49999) {
        zone = 'Göteborg';
        additionalDays = 0;
      } else if (code >= 20000 && code <= 29999) {
        zone = 'Malmö';
        additionalDays = 0;
      } else if (code >= 75000 && code <= 75999) {
        zone = 'Uppsala';
        additionalDays = 1;
      } else if (code >= 90000 && code <= 99999) {
        zone = 'Norrland';
        additionalDays = 2;
      }

      return {
        success: true,
        data: {
          isValid: true,
          zone,
          additionalDays,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate postal code: ${error}`,
      };
    }
  }

  async getSwedishHolidayImpact(deliveryDate: Date): Promise<ApiResponse<{
    isHoliday: boolean;
    holidayName?: string;
    adjustedDate: Date;
  }>> {
    try {
      const year = deliveryDate.getFullYear();
      const month = deliveryDate.getMonth() + 1;
      const day = deliveryDate.getDate();

      // Swedish holidays that affect delivery
      const holidays = [
        { month: 1, day: 1, name: 'Nyårsdagen' },
        { month: 1, day: 6, name: 'Trettondedag jul' },
        { month: 5, day: 1, name: 'Första maj' },
        { month: 6, day: 6, name: 'Sveriges nationaldag' },
        { month: 12, day: 24, name: 'Julafton' },
        { month: 12, day: 25, name: 'Juldagen' },
        { month: 12, day: 26, name: 'Annandag jul' },
      ];

      const holiday = holidays.find(h => h.month === month && h.day === day);
      let adjustedDate = new Date(deliveryDate);

      if (holiday) {
        // Move to next business day
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        
        // Skip weekends
        while (adjustedDate.getDay() === 0 || adjustedDate.getDay() === 6) {
          adjustedDate.setDate(adjustedDate.getDate() + 1);
        }

        return {
          success: true,
          data: {
            isHoliday: true,
            holidayName: holiday.name,
            adjustedDate,
          },
        };
      }

      return {
        success: true,
        data: {
          isHoliday: false,
          adjustedDate,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check holiday impact: ${error}`,
      };
    }
  }

  async calculateSwedishShippingWithZones(
    items: CartItem[], 
    postalCode: string
  ): Promise<ApiResponse<{
    baseRate: ShippingRate;
    adjustedRate: ShippingRate;
    zoneInfo: {
      zone: string;
      additionalDays: number;
    };
  }>> {
    try {
      // Validate postal code and get zone info
      const postalValidation = await this.validateSwedishPostalCode(postalCode);
      if (!postalValidation.success) {
        return {
          success: false,
          error: postalValidation.error,
        };
      }

      const zoneInfo = postalValidation.data!;
      const totalWeight = await this.calculateTotalWeight(items);

      // Get base shipping rate for Sweden
      const baseRateResult = await this.calculateShipping(items, 'Sweden');
      if (!baseRateResult.success) {
        return {
          success: false,
          error: baseRateResult.error,
        };
      }

      const baseRate = baseRateResult.data!;

      // Create adjusted rate with zone-specific delivery time
      const adjustedRate: ShippingRate = {
        ...baseRate,
        estimatedDays: baseRate.estimatedDays + zoneInfo.additionalDays,
        name: `${baseRate.name} (${zoneInfo.zone})`,
      };

      return {
        success: true,
        data: {
          baseRate,
          adjustedRate,
          zoneInfo: {
            zone: zoneInfo.zone,
            additionalDays: zoneInfo.additionalDays,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate Swedish shipping: ${error}`,
      };
    }
  }

  async getSwedishCarrierServices(): Promise<ApiResponse<Array<{
    carrier: string;
    services: Array<{
      name: string;
      description: string;
      estimatedDays: number;
      maxWeight: number;
      features: string[];
    }>;
  }>>> {
    const carriers = [
      {
        carrier: 'PostNord',
        services: [
          {
            name: 'PostNord Varubrev',
            description: 'Standard leverans inom Sverige',
            estimatedDays: 3,
            maxWeight: 2.0,
            features: ['Spårning', 'Försäkring upp till 1000 SEK'],
          },
          {
            name: 'PostNord Paket',
            description: 'Paketleverans med spårning',
            estimatedDays: 2,
            maxWeight: 35.0,
            features: ['Spårning', 'Försäkring', 'Leveransavi'],
          },
          {
            name: 'PostNord Express',
            description: 'Snabb leverans nästa arbetsdag',
            estimatedDays: 1,
            maxWeight: 35.0,
            features: ['Spårning', 'Försäkring', 'Leveransavi', 'Express'],
          },
        ],
      },
      {
        carrier: 'DHL',
        services: [
          {
            name: 'DHL Standard',
            description: 'Standard paketleverans',
            estimatedDays: 2,
            maxWeight: 31.5,
            features: ['Spårning', 'Försäkring', 'SMS-avisering'],
          },
          {
            name: 'DHL Express',
            description: 'Expressleverans före kl 12:00',
            estimatedDays: 1,
            maxWeight: 31.5,
            features: ['Spårning', 'Försäkring', 'SMS-avisering', 'Express', 'Signaturkrav'],
          },
        ],
      },
      {
        carrier: 'Bring',
        services: [
          {
            name: 'Bring Hemleverans',
            description: 'Leverans direkt hem till dörren',
            estimatedDays: 2,
            maxWeight: 35.0,
            features: ['Spårning', 'Hemleverans', 'SMS-avisering'],
          },
          {
            name: 'Bring Servicepoint',
            description: 'Leverans till närmaste servicepunkt',
            estimatedDays: 2,
            maxWeight: 35.0,
            features: ['Spårning', 'Servicepunkt', 'SMS-avisering', 'Förlängd uthämtningstid'],
          },
        ],
      },
    ];

    return {
      success: true,
      data: carriers,
    };
  }

  async calculateEcoShipping(items: CartItem[], country: string): Promise<ApiResponse<{
    standardRate: ShippingRate;
    ecoRate: ShippingRate;
    carbonOffset: {
      kg: number;
      cost: number;
    };
  }>> {
    try {
      const standardResult = await this.calculateShipping(items, country);
      if (!standardResult.success) {
        return {
          success: false,
          error: standardResult.error,
        };
      }

      const standardRate = standardResult.data!;
      const totalWeight = await this.calculateTotalWeight(items);

      // Calculate carbon footprint (simplified calculation)
      const carbonKg = totalWeight * 0.5; // Estimated 0.5kg CO2 per kg shipped
      const offsetCost = carbonKg * 2; // 2 SEK per kg CO2 offset

      // Create eco shipping rate (slightly more expensive, slightly slower, but carbon neutral)
      const ecoRate: ShippingRate = {
        ...standardRate,
        id: standardRate.id + '_eco',
        name: standardRate.name + ' (Klimatneutral)',
        price: standardRate.price + offsetCost,
        estimatedDays: standardRate.estimatedDays + 1, // Slightly slower due to consolidation
      };

      return {
        success: true,
        data: {
          standardRate,
          ecoRate,
          carbonOffset: {
            kg: Math.round(carbonKg * 100) / 100,
            cost: Math.round(offsetCost * 100) / 100,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate eco shipping: ${error}`,
      };
    }
  }
}