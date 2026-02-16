import { injectable, inject } from 'tsyringe';
import { SupabaseClient } from '@supabase/supabase-js';
import { IOrderItemRepository } from '@/interfaces';
import { OrderItem, ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';

@injectable()
export class OrderItemRepository implements IOrderItemRepository {
  private readonly tableName = 'order_items';

  constructor(
    @inject(TOKENS.SupabaseServerClient) private readonly supabase: SupabaseClient
  ) {}

  async createMany(orderId: string, items: OrderItem[]): Promise<ApiResponse<void>> {
    try {
      const rows = items.map(item => ({
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error } = await this.supabase
        .from(this.tableName)
        .insert(rows);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to create order items: ${error}` };
    }
  }

  async findByOrderId(orderId: string): Promise<ApiResponse<OrderItem[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*, product:products(id, name_sv, category)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return { success: false, error: `Failed to fetch order items: ${error}` };
    }
  }

  async findByProductId(productId: string, startDate?: Date, endDate?: Date): Promise<ApiResponse<OrderItem[]>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*, product:products(id, name_sv, category)')
        .eq('product_id', productId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return { success: false, error: `Failed to fetch order items by product: ${error}` };
    }
  }

  private transformDbRecord(record: any): OrderItem {
    return {
      productId: record.product_id,
      productName: record.product?.name_sv || '',
      quantity: record.quantity,
      price: record.price,
      total: record.price * record.quantity,
    };
  }
}
