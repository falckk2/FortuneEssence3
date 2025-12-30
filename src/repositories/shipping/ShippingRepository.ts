import { IShippingRepository } from '@/interfaces';
import { ShippingRate, ApiResponse, ShippingLabel, CarrierPricingRule } from '@/types';
import { supabase } from '@/lib/supabase';

export class ShippingRepository implements IShippingRepository {
  private readonly tableName = 'shipping_rates';

  async findRatesByCountry(country: string): Promise<ApiResponse<ShippingRate[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('country', country)
        .order('price', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch shipping rates: ${error}`,
      };
    }
  }

  async calculateShipping(weight: number, country: string): Promise<ApiResponse<ShippingRate>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('country', country)
        .gte('max_weight', weight)
        .order('price', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'No shipping option available for this weight and destination',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate shipping: ${error}`,
      };
    }
  }

  private transformDbRecord(record: any): ShippingRate {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      price: record.price,
      estimatedDays: record.estimated_days,
      country: record.country,
      maxWeight: record.max_weight,
      minWeight: record.min_weight,
      carrierCode: record.carrier_code,
      serviceType: record.service_type,
      features: record.features,
      logoUrl: record.logo_url,
      colorScheme: record.color_scheme,
      isEcoFriendly: record.is_eco_friendly,
      zoneBased: record.zone_based,
    };
  }

  private transformLabelRecord(record: any): ShippingLabel {
    return {
      id: record.id,
      orderId: record.order_id,
      trackingNumber: record.tracking_number,
      carrierCode: record.carrier_code,
      labelPdfUrl: record.label_pdf_url,
      barcodeData: record.barcode_data,
      qrCodeData: record.qr_code_data,
      generatedAt: new Date(record.generated_at),
    };
  }

  private transformPricingRuleRecord(record: any): CarrierPricingRule {
    return {
      id: record.id,
      carrierCode: record.carrier_code,
      serviceType: record.service_type,
      country: record.country,
      weightFrom: record.weight_from,
      weightTo: record.weight_to,
      postalCodeFrom: record.postal_code_from,
      postalCodeTo: record.postal_code_to,
      basePrice: record.base_price,
      pricePerKg: record.price_per_kg,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  // Additional shipping methods
  async findById(id: string): Promise<ApiResponse<ShippingRate>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Shipping rate not found',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find shipping rate: ${error}`,
      };
    }
  }

  async create(shippingRate: Omit<ShippingRate, 'id'>): Promise<ApiResponse<ShippingRate>> {
    try {
      const shippingData = {
        name: shippingRate.name,
        description: shippingRate.description,
        price: shippingRate.price,
        estimated_days: shippingRate.estimatedDays,
        country: shippingRate.country,
        max_weight: shippingRate.maxWeight,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(shippingData)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create shipping rate: ${error}`,
      };
    }
  }

  async update(id: string, shippingRate: Partial<ShippingRate>): Promise<ApiResponse<ShippingRate>> {
    try {
      const updateData: any = {};

      if (shippingRate.name) updateData.name = shippingRate.name;
      if (shippingRate.description) updateData.description = shippingRate.description;
      if (shippingRate.price !== undefined) updateData.price = shippingRate.price;
      if (shippingRate.estimatedDays !== undefined) updateData.estimated_days = shippingRate.estimatedDays;
      if (shippingRate.country) updateData.country = shippingRate.country;
      if (shippingRate.maxWeight !== undefined) updateData.max_weight = shippingRate.maxWeight;

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Shipping rate not found',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update shipping rate: ${error}`,
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete shipping rate: ${error}`,
      };
    }
  }

  async getAllCountries(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('country')
        .order('country');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Get unique countries
      const countries = [...new Set(data.map(record => record.country))];

      return {
        success: true,
        data: countries,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get countries: ${error}`,
      };
    }
  }

  async getFreeShippingThreshold(country: string): Promise<ApiResponse<number | null>> {
    try {
      // Look for free shipping option
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('country', country)
        .eq('price', 0)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: true,
            data: null, // No free shipping available
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      // In a real implementation, you might store the minimum order value
      // For now, we'll return a default threshold (e.g., 500 SEK for Sweden)
      const threshold = country === 'Sweden' ? 500 : 1000;

      return {
        success: true,
        data: threshold,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get free shipping threshold: ${error}`,
      };
    }
  }

  async getEstimatedDeliveryDate(shippingRateId: string): Promise<ApiResponse<Date>> {
    try {
      const rateResult = await this.findById(shippingRateId);
      
      if (!rateResult.success) {
        return {
          success: false,
          error: rateResult.error,
        };
      }

      const rate = rateResult.data!;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + rate.estimatedDays);

      // Skip weekends for delivery estimate
      while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      }

      return {
        success: true,
        data: deliveryDate,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate delivery date: ${error}`,
      };
    }
  }

  async validateShippingToAddress(country: string, weight: number): Promise<ApiResponse<boolean>> {
    try {
      const ratesResult = await this.findRatesByCountry(country);

      if (!ratesResult.success) {
        return {
          success: false,
          error: ratesResult.error,
        };
      }

      const rates = ratesResult.data!;
      const availableRates = rates.filter(rate => rate.maxWeight >= weight);

      return {
        success: true,
        data: availableRates.length > 0,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate shipping: ${error}`,
      };
    }
  }

  // Multi-carrier shipping methods
  async findRatesByCarrier(carrierCode: string): Promise<ApiResponse<ShippingRate[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('carrier_code', carrierCode)
        .order('price', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch carrier rates: ${error}`,
      };
    }
  }

  async saveShippingLabel(label: Omit<ShippingLabel, 'id' | 'generatedAt'>): Promise<ApiResponse<ShippingLabel>> {
    try {
      const labelData = {
        order_id: label.orderId,
        tracking_number: label.trackingNumber,
        carrier_code: label.carrierCode,
        label_pdf_url: label.labelPdfUrl,
        barcode_data: label.barcodeData,
        qr_code_data: label.qrCodeData,
      };

      const { data, error } = await supabase
        .from('shipping_labels')
        .insert(labelData)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformLabelRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save shipping label: ${error}`,
      };
    }
  }

  async findLabelByOrderId(orderId: string): Promise<ApiResponse<ShippingLabel>> {
    try {
      const { data, error } = await supabase
        .from('shipping_labels')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Shipping label not found for this order',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformLabelRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find shipping label: ${error}`,
      };
    }
  }

  async findLabelByTrackingNumber(trackingNumber: string): Promise<ApiResponse<ShippingLabel>> {
    try {
      const { data, error } = await supabase
        .from('shipping_labels')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Shipping label not found',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformLabelRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find shipping label: ${error}`,
      };
    }
  }

  async findPricingRule(
    carrierCode: string,
    serviceType: string,
    country: string,
    weight: number,
    postalCode?: string
  ): Promise<ApiResponse<CarrierPricingRule>> {
    try {
      let query = supabase
        .from('carrier_pricing_rules')
        .select('*')
        .eq('carrier_code', carrierCode)
        .eq('service_type', serviceType)
        .eq('country', country)
        .lte('weight_from', weight)
        .gte('weight_to', weight);

      // Add postal code filtering if provided
      // Note: Postal code comparison in database should use numeric ranges
      // For proper postal code validation, filter results in application code
      if (postalCode) {
        // Filter by postal code ranges (null means applies to all postal codes)
        query = query.or(
          `postal_code_from.is.null,and(postal_code_from.lte.${postalCode},postal_code_to.gte.${postalCode})`
        );
      }

      const { data, error } = await query
        .order('weight_from', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'No pricing rule found for these criteria',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformPricingRuleRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find pricing rule: ${error}`,
      };
    }
  }
}