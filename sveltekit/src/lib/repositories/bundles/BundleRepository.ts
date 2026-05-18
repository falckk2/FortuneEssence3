import { injectable, inject } from 'tsyringe';
import { SupabaseClient } from '@supabase/supabase-js';
import type { IBundleRepository } from '$lib/interfaces';
import { BundleConfiguration, ApiResponse } from '$lib/types';
import { TOKENS } from '$lib/config/di-container';
import { BaseRepository } from '$lib/repositories/BaseRepository';

@injectable()
export class BundleRepository extends BaseRepository<BundleConfiguration> implements IBundleRepository {
  protected readonly tableName = 'bundle_configurations';

  constructor(
    @inject(TOKENS.SupabaseClient) supabase: SupabaseClient
  ) {
    super(supabase);
  }

  async findByProductId(bundleProductId: string): Promise<ApiResponse<BundleConfiguration>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('bundle_product_id', bundleProductId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Bundle configuration not found' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data: this.transformDbRecord(data) };
    } catch (error) {
      return { success: false, error: `Failed to find bundle configuration: ${error}` };
    }
  }

  async findAll(): Promise<ApiResponse<BundleConfiguration[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('required_quantity', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data.map(record => this.transformDbRecord(record)) };
    } catch (error) {
      return { success: false, error: `Failed to fetch bundle configurations: ${error}` };
    }
  }

  async create(config: Omit<BundleConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<BundleConfiguration>> {
    return this.executeCreate({
      bundle_product_id: config.bundleProductId,
      required_quantity: config.requiredQuantity,
      allowed_category: config.allowedCategory,
      discount_percentage: config.discountPercentage,
    });
  }

  async update(id: string, updates: Partial<Omit<BundleConfiguration, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<BundleConfiguration>> {
    const updateData: Record<string, any> = {};
    if (updates.bundleProductId !== undefined) updateData.bundle_product_id = updates.bundleProductId;
    if (updates.requiredQuantity !== undefined) updateData.required_quantity = updates.requiredQuantity;
    if (updates.allowedCategory !== undefined) updateData.allowed_category = updates.allowedCategory;
    if (updates.discountPercentage !== undefined) updateData.discount_percentage = updates.discountPercentage;
    return this.executeUpdate(id, updateData);
  }

  protected transformDbRecord(record: any): BundleConfiguration {
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
