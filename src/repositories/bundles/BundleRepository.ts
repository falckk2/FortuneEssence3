import { injectable, inject } from 'tsyringe';
import { SupabaseClient } from '@supabase/supabase-js';
import type { IBundleRepository } from '@/interfaces';
import { BundleConfiguration, ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';

@injectable()
export class BundleRepository implements IBundleRepository {
  private readonly tableName = 'bundle_configurations';

  constructor(
    @inject(TOKENS.SupabaseClient) private readonly supabase: SupabaseClient
  ) {}

  async findByProductId(bundleProductId: string): Promise<ApiResponse<BundleConfiguration>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('bundle_product_id', bundleProductId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Bundle configuration not found',
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
        error: `Failed to find bundle configuration: ${error}`,
      };
    }
  }

  async findAll(): Promise<ApiResponse<BundleConfiguration[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('required_quantity', { ascending: true });

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
        error: `Failed to fetch bundle configurations: ${error}`,
      };
    }
  }

  private transformDbRecord(record: any): BundleConfiguration {
    return {
      id: record.id,
      bundleProductId: record.bundle_product_id,
      requiredQuantity: record.required_quantity,
      allowedCategory: record.allowed_category,
      discountPercentage: parseFloat(record.discount_percentage),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }
}
