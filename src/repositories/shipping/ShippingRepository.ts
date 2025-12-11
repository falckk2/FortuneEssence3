import { IShippingRepository } from '@/interfaces';
import { ShippingRate, ApiResponse } from '@/types';
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
}