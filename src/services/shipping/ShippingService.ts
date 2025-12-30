import { injectable, inject } from 'tsyringe';
import type { IShippingService, IShippingRepository, IProductRepository, Shipment, TrackingInfo } from '@/interfaces';
import type { ShippingRate, CartItem, ApiResponse, CarrierInfo, ShippingLabel, ShippingLabelGenerationRequest, Order } from '@/types';
import { PriceCalculator } from '@/utils/helpers';
import { TOKENS } from '@/config/di-container';
import { CarrierRulesEngine, FilterCriteria } from './CarrierRulesEngine';
import { LabelGenerationService } from './LabelGenerationService';
import { getAllCarriers, getTrackingPrefix, FREE_SHIPPING_THRESHOLD } from '@/config/carriers';

/**
 * Shipping Service
 *
 * Now follows Dependency Inversion Principle:
 * - All dependencies are injected through constructor
 * - Depends on abstractions (interfaces), not concrete implementations
 */
@injectable()
export class ShippingService implements IShippingService {
  constructor(
    @inject(TOKENS.IShippingRepository) private readonly shippingRepository: IShippingRepository,
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository,
    @inject(TOKENS.CarrierRulesEngine) private readonly carrierRulesEngine: CarrierRulesEngine,
    @inject(TOKENS.LabelGenerationService) private readonly labelGenerationService: LabelGenerationService
  ) {}

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
      // Determine carrier from tracking number format
      const carrier = this.getCarrierFromTrackingNumber(trackingNumber);

      // Try to get real tracking data from carrier APIs
      let trackingInfo: TrackingInfo | null = null;

      if (carrier === 'PostNord') {
        const postNordResult = await this.trackWithPostNord(trackingNumber);
        if (postNordResult.success && postNordResult.data) {
          trackingInfo = postNordResult.data;
        }
      } else if (carrier === 'DHL') {
        const dhlResult = await this.trackWithDHL(trackingNumber);
        if (dhlResult.success && dhlResult.data) {
          trackingInfo = dhlResult.data;
        }
      }

      // If real tracking failed or carrier not supported, fall back to mock data
      if (!trackingInfo) {
        trackingInfo = this.generateMockTrackingInfo(trackingNumber, carrier);
      }

      return {
        success: true,
        data: trackingInfo,
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

  /**
   * Track shipment with PostNord API
   * Uses PostNord Tracking REST API
   */
  private async trackWithPostNord(trackingNumber: string): Promise<ApiResponse<TrackingInfo>> {
    try {
      const config = (await import('@/config')).config;
      const apiKey = config?.shipping?.postnord?.apiKey;
      const baseUrl = config?.shipping?.postnord?.baseUrl || 'https://api2.postnord.com/rest';

      // Validate API key is configured and not empty
      if (!apiKey || apiKey.trim() === '') {
        console.warn('PostNord API key not configured, falling back to mock tracking');
        return {
          success: false,
          error: 'PostNord API key not configured',
        };
      }

      // Make request to PostNord Tracking API
      const url = `${baseUrl}/businesslocation/v5/findByIdentifier.json?id=${trackingNumber}&apikey=${apiKey}&locale=sv`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `PostNord API error: ${response.status}`,
        };
      }

      const data = await response.json();

      // Parse PostNord response
      if (!data.TrackingInformationResponse?.shipments?.[0]) {
        return {
          success: false,
          error: 'No tracking information found',
        };
      }

      const shipment = data.TrackingInformationResponse.shipments[0];
      const items = shipment.items || [];
      const events = items[0]?.events || [];

      // Map PostNord events to our TrackingEvent format
      const history = events.map((event: any) => ({
        date: new Date(event.eventTime),
        status: this.mapPostNordStatus(event.eventCode),
        location: event.location?.displayName || event.location?.city || 'Unknown',
        description: event.eventDescription || event.status,
      }));

      // Get latest status
      const latestEvent = events[0] || {};
      const status = this.mapPostNordStatus(latestEvent.eventCode) || 'Under transport';
      const location = latestEvent.location?.displayName || latestEvent.location?.city || 'Unknown';

      // Parse estimated delivery
      const estimatedDeliveryStr = shipment.estimatedTimeOfArrival || items[0]?.estimatedTimeOfArrival;
      const estimatedDelivery = estimatedDeliveryStr
        ? new Date(estimatedDeliveryStr)
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Default to 2 days from now

      return {
        success: true,
        data: {
          trackingNumber,
          status,
          location,
          estimatedDelivery,
          history,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `PostNord tracking failed: ${error}`,
      };
    }
  }

  /**
   * Track shipment with DHL API
   * Uses DHL Tracking REST API
   */
  private async trackWithDHL(trackingNumber: string): Promise<ApiResponse<TrackingInfo>> {
    try {
      const config = (await import('@/config')).config;
      const apiKey = config?.shipping?.dhl?.apiKey;
      const baseUrl = config?.shipping?.dhl?.baseUrl || 'https://api-eu.dhl.com';

      // Validate API key is configured and not empty
      if (!apiKey || apiKey.trim() === '') {
        console.warn('DHL API key not configured, falling back to mock tracking');
        return {
          success: false,
          error: 'DHL API key not configured',
        };
      }

      // Make request to DHL Tracking API
      const url = `${baseUrl}/track/shipments?trackingNumber=${trackingNumber}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'DHL-API-Key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `DHL API error: ${response.status}`,
        };
      }

      const data = await response.json();

      // Parse DHL response
      if (!data.shipments?.[0]) {
        return {
          success: false,
          error: 'No tracking information found',
        };
      }

      const shipment = data.shipments[0];
      const events = shipment.events || [];

      // Map DHL events to our TrackingEvent format
      const history = events.map((event: any) => ({
        date: new Date(event.timestamp),
        status: this.mapDHLStatus(event.statusCode),
        location: event.location?.address?.addressLocality || 'Unknown',
        description: event.description || event.status,
      }));

      // Get latest status
      const latestStatus = shipment.status?.statusCode || 'transit';
      const status = this.mapDHLStatus(latestStatus);
      const location = shipment.status?.location?.address?.addressLocality || 'Under transport';

      // Parse estimated delivery
      const estimatedDeliveryStr = shipment.estimatedTimeOfDelivery;
      const estimatedDelivery = estimatedDeliveryStr
        ? new Date(estimatedDeliveryStr)
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Default to 2 days from now

      return {
        success: true,
        data: {
          trackingNumber,
          status,
          location,
          estimatedDelivery,
          history,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `DHL tracking failed: ${error}`,
      };
    }
  }

  /**
   * Map PostNord status codes to Swedish status descriptions
   */
  private mapPostNordStatus(eventCode: string): string {
    const statusMap: Record<string, string> = {
      'ED': 'Levererad',
      'HD': 'Levererad',
      'DELIVERED': 'Levererad',
      'IT': 'Under transport',
      'INFORMED': 'Aviserad',
      'NOTIFICATION_SENT': 'Aviserad',
      'COLLECTED': 'Upphämtad',
      'RETURNED': 'Returnerad',
      'DELAYED': 'Försenad',
    };

    return statusMap[eventCode] || 'Under transport';
  }

  /**
   * Map DHL status codes to Swedish status descriptions
   */
  private mapDHLStatus(statusCode: string): string {
    const statusMap: Record<string, string> = {
      'delivered': 'Levererad',
      'transit': 'Under transport',
      'failure': 'Leveransfel',
      'unknown': 'Okänd status',
      'pre-transit': 'Förbereds för transport',
    };

    return statusMap[statusCode.toLowerCase()] || 'Under transport';
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
  }): Promise<ApiResponse<{ valid: boolean; suggestions?: Array<{ street: string; city: string; postalCode: string; country: string }> }>> {
    try {
      // Basic validation
      if (!address.street || !address.city || !address.postalCode || !address.country) {
        return {
          success: true,
          data: { valid: false },
          error: 'Incomplete address information',
        };
      }

      // Validate Swedish postal code format
      if (address.country.toLowerCase() === 'sweden') {
        const postalCodeRegex = /^\d{3}\s?\d{2}$/;
        if (!postalCodeRegex.test(address.postalCode)) {
          return {
            success: true,
            data: { valid: false },
            error: 'Invalid Swedish postal code format',
          };
        }
      }

      return {
        success: true,
        data: { valid: true },
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

  async getSupportedCountries(): Promise<ApiResponse<Array<{ code: string; name: string }>>> {
    try {
      // Return supported countries with names
      const countries = [
        { code: 'SE', name: 'Sweden' },
        { code: 'NO', name: 'Norway' },
        { code: 'DK', name: 'Denmark' },
        { code: 'FI', name: 'Finland' },
      ];

      return {
        success: true,
        data: countries,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get supported countries: ${error}`,
      };
    }
  }

  // Swedish-specific shipping methods
  async validateSwedishPostalCode(postalCode: string): Promise<ApiResponse<{
    valid: boolean;
    city?: string;
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

      const zoneDetails = this.getSwedishZoneDetails(cleanCode);

      return {
        success: true,
        data: {
          valid: true,
          city: zoneDetails.zone,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate postal code: ${error}`,
      };
    }
  }

  private getSwedishZoneDetails(postalCode: string): { zone: string; additionalDays: number } {
    const code = parseInt(postalCode.replace(/\s/g, ''));
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

    return { zone, additionalDays };
  }

  async getSwedishHolidayImpact(date: string): Promise<ApiResponse<{
    isHoliday: boolean;
    estimatedDelay?: number;
  }>> {
    try {
      const deliveryDate = new Date(date);
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

        // Calculate delay in days
        const delayDays = Math.ceil((adjustedDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          success: true,
          data: {
            isHoliday: true,
            estimatedDelay: delayDays,
          },
        };
      }

      return {
        success: true,
        data: {
          isHoliday: false,
          estimatedDelay: 0,
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

      // Get detailed zone info for shipping calculation
      const zoneInfo = this.getSwedishZoneDetails(postalCode);
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

  // ========================================
  // NEW MULTI-CARRIER METHODS
  // ========================================

  /**
   * Get all available shipping options for checkout
   */
  async getAllShippingOptions(
    items: CartItem[],
    country: string,
    postalCode?: string,
    orderValue?: number
  ): Promise<ApiResponse<{
    options: ShippingRate[];
    recommended: ShippingRate;
    freeShippingThreshold: number;
  }>> {
    try {
      // Calculate total weight and order value
      const totalWeight = await this.calculateTotalWeight(items);
      const cartTotal = orderValue || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Get all rates from database
      const ratesResult = await this.shippingRepository.findRatesByCountry(country);
      if (!ratesResult.success) {
        return {
          success: false,
          error: ratesResult.error,
        };
      }

      // Filter by weight
      let availableRates = this.carrierRulesEngine.filterByWeightLimit(ratesResult.data!, totalWeight);

      // Apply smart filtering
      const criteria: FilterCriteria = {
        weight: totalWeight,
        orderValue: cartTotal,
        destination: country,
        postalCode,
      };

      // Apply zone-based pricing if postal code provided
      if (postalCode) {
        const zoneMultiplier = this.carrierRulesEngine.getZoneMultiplier(postalCode);
        availableRates = availableRates.map(rate => ({
          ...rate,
          price: Math.round(rate.price * zoneMultiplier * 100) / 100,
        }));
      }

      // Check for free shipping
      const isFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
      if (isFreeShipping) {
        availableRates = availableRates.map(rate => ({
          ...rate,
          price: 0,
          name: rate.name + ' (Fri frakt)',
        }));
      }

      // Sort by price (cheapest first)
      const sortedRates = this.carrierRulesEngine.sortByPrice([...availableRates]);

      // Get recommended option
      const recommended = this.carrierRulesEngine.getRecommendedRate(sortedRates, criteria) || sortedRates[0];

      return {
        success: true,
        data: {
          options: sortedRates,
          recommended,
          freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get shipping options: ${error}`,
      };
    }
  }

  /**
   * Get available carriers based on smart filtering
   */
  async getAvailableCarriers(
    weight: number,
    orderValue: number,
    country: string,
    postalCode?: string,
    preferences?: FilterCriteria['preferences']
  ): Promise<ApiResponse<CarrierInfo[]>> {
    try {
      const allCarriers = getAllCarriers();

      const criteria: FilterCriteria = {
        weight,
        orderValue,
        destination: country,
        postalCode,
        preferences,
      };

      const filtered = this.carrierRulesEngine.applySmartFilters(allCarriers, criteria);

      return {
        success: true,
        data: filtered,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get available carriers: ${error}`,
      };
    }
  }

  /**
   * Generate shipping label for an order
   */
  async generateShippingLabel(
    order: Order
  ): Promise<ApiResponse<ShippingLabel>> {
    try {
      // Generate tracking number
      const carrierCode = order.carrier || 'POSTNORD';
      const trackingNumber = this.generateCarrierTrackingNumber(carrierCode);

      // Generate label using LabelGenerationService
      const labelResult = await this.labelGenerationService.generateLabel(order, trackingNumber);

      if (!labelResult.success) {
        return labelResult;
      }

      // Save label to repository
      const saveResult = await this.shippingRepository.saveShippingLabel(labelResult.data!);

      return saveResult;
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate shipping label: ${error}`,
      };
    }
  }

  /**
   * Get shipping label for an order
   */
  async getShippingLabel(orderId: string): Promise<ApiResponse<ShippingLabel>> {
    try {
      return await this.shippingRepository.findLabelByOrderId(orderId);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get shipping label: ${error}`,
      };
    }
  }

  /**
   * Generate carrier-specific tracking number
   */
  private generateCarrierTrackingNumber(carrierCode: string): string {
    const prefix = getTrackingPrefix(carrierCode);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const checksum = this.calculateChecksum(`${prefix}${timestamp}${random}`);

    return `${prefix}${timestamp}${random}${checksum}`;
  }

  /**
   * Calculate checksum for tracking number validation
   */
  private calculateChecksum(input: string): string {
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum += input.charCodeAt(i);
    }
    return (sum % 97).toString().padStart(2, '0');
  }

  /**
   * Calculate dynamic pricing based on weight and carrier rules
   */
  async calculateDynamicPrice(
    carrierCode: string,
    serviceType: string,
    weight: number,
    country: string,
    postalCode?: string
  ): Promise<ApiResponse<number>> {
    try {
      // Try to find pricing rule
      const ruleResult = await this.shippingRepository.findPricingRule(
        carrierCode,
        serviceType,
        country,
        weight,
        postalCode
      );

      if (ruleResult.success && ruleResult.data) {
        const rule = ruleResult.data;
        let price = rule.basePrice;

        // Add weight-based pricing
        if (rule.pricePerKg > 0) {
          price += (weight * rule.pricePerKg);
        }

        // Apply zone-based multiplier if postal code provided
        if (postalCode) {
          const zoneMultiplier = this.carrierRulesEngine.getZoneMultiplier(postalCode);
          price *= zoneMultiplier;
        }

        return {
          success: true,
          data: Math.round(price * 100) / 100,
        };
      }

      // Fallback to database rate
      const rates = await this.shippingRepository.findRatesByCarrier(carrierCode);
      if (rates.success && rates.data && rates.data.length > 0) {
        // Filter by country and service type
        const matchingRate = rates.data.find(r =>
          r.serviceType === serviceType && r.country === country
        );
        if (matchingRate) {
          return {
            success: true,
            data: matchingRate.price,
          };
        }
      }

      return {
        success: false,
        error: 'No pricing found for carrier and service type',
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate dynamic price: ${error}`,
      };
    }
  }
}