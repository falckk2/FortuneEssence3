import { injectable } from 'tsyringe';
import type { IAbandonedCartRepository } from '@/interfaces';
import type { AbandonedCart, AbandonedCartCreateData, ApiResponse } from '@/types';
import { supabase } from '@/lib/supabase';

@injectable()
export class AbandonedCartRepository implements IAbandonedCartRepository {
  private readonly tableName = 'abandoned_carts';

  async create(data: AbandonedCartCreateData): Promise<ApiResponse<AbandonedCart>> {
    try {
      const insertData = {
        cart_id: data.cartId,
        customer_id: data.customerId || null,
        email: data.email,
        session_id: data.sessionId || null,
        items: data.items,
        subtotal: data.subtotal,
        total: data.total,
        currency: data.currency,
        recovery_token: data.recoveryToken,
        abandoned_at: data.abandonedAt.toISOString(),
        status: data.status,
        reminder_count: data.reminderCount,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to create abandoned cart: ${error.message}`,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(result),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create abandoned cart: ${error}`,
      };
    }
  }

  async update(id: string, data: Partial<AbandonedCart>): Promise<ApiResponse<AbandonedCart>> {
    try {
      const updateData: any = {};

      if (data.email !== undefined) updateData.email = data.email;
      if (data.items !== undefined) updateData.items = data.items;
      if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
      if (data.total !== undefined) updateData.total = data.total;
      if (data.abandonedAt !== undefined) updateData.abandoned_at = data.abandonedAt.toISOString();
      if (data.remindedAt !== undefined) updateData.reminded_at = data.remindedAt.toISOString();
      if (data.recoveredAt !== undefined) updateData.recovered_at = data.recoveredAt.toISOString();
      if (data.recoveryOrderId !== undefined) updateData.recovery_order_id = data.recoveryOrderId;
      if (data.reminderCount !== undefined) updateData.reminder_count = data.reminderCount;
      if (data.status !== undefined) updateData.status = data.status;

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to update abandoned cart: ${error.message}`,
        };
      }

      if (!result) {
        return {
          success: false,
          error: 'Abandoned cart not found',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(result),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update abandoned cart: ${error}`,
      };
    }
  }

  async findByCartId(cartId: string, status?: string): Promise<ApiResponse<AbandonedCart>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('cart_id', cartId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Abandoned cart not found',
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
        error: `Failed to find abandoned cart: ${error}`,
      };
    }
  }

  async findByRecoveryToken(token: string): Promise<ApiResponse<AbandonedCart>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('recovery_token', token)
        .in('status', ['abandoned', 'reminded'])
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Invalid or expired recovery link',
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
        error: `Failed to find abandoned cart: ${error}`,
      };
    }
  }

  async findForReminder(
    hoursAbandoned: number,
    maxReminders: number
  ): Promise<ApiResponse<AbandonedCart[]>> {
    try {
      const abandonedSince = new Date();
      abandonedSince.setHours(abandonedSince.getHours() - hoursAbandoned);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('status', 'abandoned')
        .lt('abandoned_at', abandonedSince.toISOString())
        .lt('reminder_count', maxReminders)
        .or(`reminded_at.is.null,reminded_at.lt.${abandonedSince.toISOString()}`);

      if (error) {
        return {
          success: false,
          error: `Failed to get abandoned carts: ${error.message}`,
        };
      }

      return {
        success: true,
        data: (data || []).map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get abandoned carts: ${error}`,
      };
    }
  }

  async markReminded(id: string, newReminderCount: number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          reminded_at: new Date().toISOString(),
          reminder_count: newReminderCount,
          status: 'reminded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `Failed to mark cart as reminded: ${error.message}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to mark cart as reminded: ${error}`,
      };
    }
  }

  async markRecovered(token: string, orderId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          recovered_at: new Date().toISOString(),
          recovery_order_id: orderId,
          status: 'recovered',
          updated_at: new Date().toISOString(),
        })
        .eq('recovery_token', token)
        .in('status', ['abandoned', 'reminded']);

      if (error) {
        return {
          success: false,
          error: `Failed to mark cart as recovered: ${error.message}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to mark cart as recovered: ${error}`,
      };
    }
  }

  async markExpired(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `Failed to mark cart as expired: ${error.message}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to mark cart as expired: ${error}`,
      };
    }
  }

  private transformDbRecord(record: any): AbandonedCart {
    return {
      id: record.id,
      cartId: record.cart_id,
      customerId: record.customer_id || undefined,
      email: record.email,
      sessionId: record.session_id || undefined,
      items: record.items || [],
      subtotal: record.subtotal,
      total: record.total,
      currency: record.currency,
      recoveryToken: record.recovery_token,
      abandonedAt: new Date(record.abandoned_at),
      remindedAt: record.reminded_at ? new Date(record.reminded_at) : undefined,
      recoveredAt: record.recovered_at ? new Date(record.recovered_at) : undefined,
      recoveryOrderId: record.recovery_order_id || undefined,
      reminderCount: record.reminder_count,
      status: record.status,
      ipAddress: record.ip_address || undefined,
      userAgent: record.user_agent || undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }
}
