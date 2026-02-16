import { injectable, inject } from 'tsyringe';
import { SupabaseClient } from '@supabase/supabase-js';
import { IAnalyticsRepository } from '@/interfaces';
import { Order, ApiResponse, OrderStatus, PaymentMethod } from '@/types';
import { TOKENS } from '@/config/di-container';

@injectable()
export class AnalyticsRepository implements IAnalyticsRepository {
  constructor(
    @inject(TOKENS.SupabaseServerClient) private readonly supabase: SupabaseClient
  ) {}

  async getOrdersInRange(startDate: Date, endDate: Date): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: (data || []).map(record => this.transformOrderRecord(record)),
      };
    } catch (error) {
      return { success: false, error: `Failed to fetch orders: ${error}` };
    }
  }

  async getOrderItemsInRange(startDate: Date, endDate: Date): Promise<ApiResponse<Array<{
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    price: number;
  }>>> {
    try {
      const { data, error } = await this.supabase
        .from('order_items')
        .select('product_id, quantity, price, product:products(id, name_sv, category)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: (data || []).map(record => ({
          productId: record.product_id,
          productName: (record.product as any)?.name_sv || '',
          category: (record.product as any)?.category || '',
          quantity: record.quantity,
          price: record.price,
        })),
      };
    } catch (error) {
      return { success: false, error: `Failed to fetch order items: ${error}` };
    }
  }

  async getCustomerCountInRange(startDate: Date, endDate: Date): Promise<ApiResponse<number>> {
    try {
      const { count, error } = await this.supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: count || 0 };
    } catch (error) {
      return { success: false, error: `Failed to count customers: ${error}` };
    }
  }

  async getTotalCustomerCount(): Promise<ApiResponse<number>> {
    try {
      const { count, error } = await this.supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: count || 0 };
    } catch (error) {
      return { success: false, error: `Failed to count total customers: ${error}` };
    }
  }

  private transformOrderRecord(record: any): Order {
    return {
      id: record.id,
      customerId: record.customer_id,
      items: record.items,
      total: record.total,
      tax: record.tax,
      shipping: record.shipping,
      status: record.status as OrderStatus,
      shippingAddress: record.shipping_address,
      billingAddress: record.billing_address,
      paymentMethod: record.payment_method as PaymentMethod,
      paymentId: record.payment_id,
      trackingNumber: record.tracking_number,
      carrier: record.carrier,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }
}
