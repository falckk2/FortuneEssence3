import { IOrderRepository } from '@/interfaces';
import { Order, ApiResponse, OrderStatus, PaymentMethod } from '@/types';
import { supabase } from '@/lib/supabase';

export class OrderRepository implements IOrderRepository {
  private readonly tableName = 'orders';

  async findAll(customerId?: string): Promise<ApiResponse<Order[]>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

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
        error: `Failed to fetch orders: ${error}`,
      };
    }
  }

  async findById(id: string): Promise<ApiResponse<Order>> {
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
            error: 'Order not found',
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
        error: `Failed to find order: ${error}`,
      };
    }
  }

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Order>> {
    try {
      const orderData = {
        customer_id: order.customerId,
        items: order.items,
        total: order.total,
        tax: order.tax,
        shipping: order.shipping,
        status: order.status,
        shipping_address: order.shippingAddress,
        billing_address: order.billingAddress,
        payment_method: order.paymentMethod,
        payment_id: order.paymentId,
        tracking_number: order.trackingNumber,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(orderData)
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
        error: `Failed to create order: ${error}`,
      };
    }
  }

  async update(id: string, order: Partial<Order>): Promise<ApiResponse<Order>> {
    try {
      const updateData: any = {};

      if (order.status) updateData.status = order.status;
      if (order.trackingNumber !== undefined) updateData.tracking_number = order.trackingNumber;
      if (order.total !== undefined) updateData.total = order.total;
      if (order.tax !== undefined) updateData.tax = order.tax;
      if (order.shipping !== undefined) updateData.shipping = order.shipping;
      if (order.shippingAddress) updateData.shipping_address = order.shippingAddress;
      if (order.billingAddress) updateData.billing_address = order.billingAddress;
      if (order.paymentId) updateData.payment_id = order.paymentId;
      if (order.items) updateData.items = order.items;

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
          error: 'Order not found',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update order: ${error}`,
      };
    }
  }

  async findByStatus(status: string): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

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
        error: `Failed to fetch orders by status: ${error}`,
      };
    }
  }

  private transformDbRecord(record: any): Order {
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
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  // Additional methods for order management
  async findByCustomerId(customerId: string, limit?: number): Promise<ApiResponse<Order[]>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

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
        error: `Failed to fetch customer orders: ${error}`,
      };
    }
  }

  async findByTrackingNumber(trackingNumber: string): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Order not found',
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
        error: `Failed to find order by tracking number: ${error}`,
      };
    }
  }

  async getOrderStatistics(customerId?: string): Promise<ApiResponse<{
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }>> {
    try {
      let query = supabase.from(this.tableName).select('status');

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const statistics = {
        total: data.length,
        pending: data.filter(o => o.status === 'pending').length,
        confirmed: data.filter(o => o.status === 'confirmed').length,
        shipped: data.filter(o => o.status === 'shipped').length,
        delivered: data.filter(o => o.status === 'delivered').length,
        cancelled: data.filter(o => o.status === 'cancelled').length,
      };

      return {
        success: true,
        data: statistics,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get order statistics: ${error}`,
      };
    }
  }

  async updateStatus(id: string, status: OrderStatus, trackingNumber?: string): Promise<ApiResponse<Order>> {
    try {
      const updateData: any = { status };
      
      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

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
          error: 'Order not found',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update order status: ${error}`,
      };
    }
  }

  async getRecentOrders(days: number = 30, limit: number = 50): Promise<ApiResponse<Order[]>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

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
        error: `Failed to fetch recent orders: ${error}`,
      };
    }
  }
}