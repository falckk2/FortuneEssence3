import { injectable, inject } from 'tsyringe';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';

export interface WishlistItem {
  id: string;
  customerId: string;
  productId: string;
  createdAt: Date;
}

export interface IWishlistRepository {
  findByCustomerId(customerId: string): Promise<ApiResponse<WishlistItem[]>>;
  add(customerId: string, productId: string): Promise<ApiResponse<WishlistItem>>;
  remove(customerId: string, productId: string): Promise<ApiResponse<void>>;
  isInWishlist(customerId: string, productId: string): Promise<ApiResponse<boolean>>;
  clear(customerId: string): Promise<ApiResponse<void>>;
}

@injectable()
export class WishlistRepository implements IWishlistRepository {
  private readonly tableName = 'wishlist';

  constructor(
    @inject(TOKENS.SupabaseClient) private readonly supabase: SupabaseClient
  ) {}

  async findByCustomerId(customerId: string): Promise<ApiResponse<WishlistItem[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: `Failed to fetch wishlist: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch wishlist: ${error}`,
      };
    }
  }

  async add(customerId: string, productId: string): Promise<ApiResponse<WishlistItem>> {
    try {
      // Check if already exists
      const { data: existing } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .single();

      if (existing) {
        return {
          success: true,
          data: this.transformDbRecord(existing),
        };
      }

      // Add new item
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          customer_id: customerId,
          product_id: productId,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to add to wishlist: ${error.message}`,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add to wishlist: ${error}`,
      };
    }
  }

  async remove(customerId: string, productId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('customer_id', customerId)
        .eq('product_id', productId);

      if (error) {
        return {
          success: false,
          error: `Failed to remove from wishlist: ${error.message}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove from wishlist: ${error}`,
      };
    }
  }

  async isInWishlist(customerId: string, productId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        return {
          success: false,
          error: `Failed to check wishlist: ${error.message}`,
        };
      }

      return {
        success: true,
        data: !!data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check wishlist: ${error}`,
      };
    }
  }

  async clear(customerId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('customer_id', customerId);

      if (error) {
        return {
          success: false,
          error: `Failed to clear wishlist: ${error.message}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear wishlist: ${error}`,
      };
    }
  }

  private transformDbRecord(record: any): WishlistItem {
    return {
      id: record.id,
      customerId: record.customer_id,
      productId: record.product_id,
      createdAt: new Date(record.created_at),
    };
  }
}
