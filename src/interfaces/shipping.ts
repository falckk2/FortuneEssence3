import {
  ShippingRate,
  CartItem,
  ApiResponse,
  CarrierInfo,
  ShippingLabel,
  Order,
  Address
} from '@/types';

/**
 * Shipping Rate Service - Handles all shipping rate calculations
 * Single Responsibility: Calculate and provide shipping rate options
 */
export interface IShippingRateService {
  getShippingRates(country: string, weight: number): Promise<ApiResponse<ShippingRate[]>>;
  calculateShipping(items: CartItem[], country: string): Promise<ApiResponse<ShippingRate>>;
  getShippingCosts(items: CartItem[], country: string): Promise<ApiResponse<{
    options: ShippingRate[];
    recommended: ShippingRate;
    freeShippingThreshold?: number;
  }>>;
  getAllShippingOptions(
    items: CartItem[],
    country: string,
    postalCode?: string,
    orderValue?: number
  ): Promise<ApiResponse<{
    options: ShippingRate[];
    recommended: ShippingRate;
    freeShippingThreshold: number;
  }>>;
  calculateDynamicPrice(
    carrierCode: string,
    serviceType: string,
    weight: number,
    country: string,
    postalCode?: string
  ): Promise<ApiResponse<number>>;
  estimateDeliveryDate(shippingRateId: string): Promise<ApiResponse<Date>>;
  calculateEcoShipping(items: CartItem[], country: string): Promise<ApiResponse<{
    standardRate: ShippingRate;
    ecoRate: ShippingRate;
    carbonOffset: { kg: number; cost: number };
  }>>;
  getAvailableCarriers(
    weight: number,
    orderValue: number,
    country: string,
    postalCode?: string,
    preferences?: {
      speed?: 'fastest' | 'standard';
      eco?: boolean;
      price?: 'cheapest' | 'premium';
    }
  ): Promise<ApiResponse<CarrierInfo[]>>;
}

/**
 * Shipping Label Service - Handles shipping label generation
 * Single Responsibility: Generate and manage shipping labels
 */
export interface IShippingLabelService {
  generateShippingLabel(order: Order): Promise<ApiResponse<ShippingLabel>>;
  getShippingLabel(orderId: string): Promise<ApiResponse<ShippingLabel>>;
}

/**
 * Shipment Tracking Service - Handles shipment creation and tracking
 * Single Responsibility: Track shipments and manage shipment lifecycle
 */
export interface IShipmentTrackingService {
  createShipment(orderId: string, shippingRateId: string): Promise<ApiResponse<Shipment>>;
  trackShipment(trackingNumber: string): Promise<ApiResponse<TrackingInfo>>;
}

/**
 * Address Validation Service - Handles address validation
 * Single Responsibility: Validate delivery addresses
 */
export interface IAddressValidationService {
  validateDeliveryAddress(address: Address): Promise<ApiResponse<{ valid: boolean; suggestions?: Address[] }>>;
  getSupportedCountries(): Promise<ApiResponse<Array<{ code: string; name: string }>>>;
}

/**
 * Swedish Shipping Service - Handles Swedish market-specific shipping logic
 * Single Responsibility: Provide Swedish market-specific shipping features
 */
export interface ISwedishShippingService {
  getSwedishCarrierServices(): Promise<ApiResponse<Array<{
    carrier: string;
    services: Array<{
      name: string;
      description: string;
      estimatedDays: number;
      maxWeight: number;
      features: string[];
    }>;
  }>>>;
  validateSwedishPostalCode(postalCode: string): Promise<ApiResponse<{ valid: boolean; city?: string }>>;
  calculateSwedishShippingWithZones(items: CartItem[], postalCode: string): Promise<ApiResponse<{
    baseRate: ShippingRate;
    adjustedRate: ShippingRate;
    zoneInfo: { zone: string; additionalDays: number };
  }>>;
  getSwedishHolidayImpact(date: string): Promise<ApiResponse<{ isHoliday: boolean; estimatedDelay?: number }>>;
}

// Supporting types
export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'shipped' | 'delivered';
  estimatedDelivery: Date;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  location: string;
  estimatedDelivery: Date;
  history: TrackingEvent[];
}

export interface TrackingEvent {
  date: Date;
  status: string;
  location: string;
  description: string;
}
