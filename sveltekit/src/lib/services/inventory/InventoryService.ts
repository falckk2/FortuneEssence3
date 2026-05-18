import { injectable, inject } from 'tsyringe';
import { SupabaseClient } from '@supabase/supabase-js';
import { IInventoryService } from '$lib/interfaces';
import { Product, CartItem, ApiResponse } from '$lib/types';
import { TOKENS } from '$lib/config/di-container';

const LOW_STOCK_THRESHOLD = 10;

@injectable()
export class InventoryService implements IInventoryService {
  constructor(
    @inject(TOKENS.SupabaseClient) private readonly supabase: SupabaseClient
  ) {}

  async checkAvailability(productId: string, quantity: number): Promise<ApiResponse<boolean>> {
    try {
      const { data: product, error } = await this.supabase
        .from('products')
        .select('stock, is_active')
        .eq('id', productId)
        .single();

      if (error) {
        return {
          success: false,
          error: `Product not found: ${error.message}`,
        };
      }

      if (!product.is_active) {
        return {
          success: false,
          error: 'Product is not available',
        };
      }

      // Subtract soft-reserved quantities so concurrent reservations don't
      // both pass on the same stock before either is committed.
      const reservationsResult = await this.getActiveReservations(productId);
      const reserved = reservationsResult.success ? (reservationsResult.data ?? 0) : 0;

      return {
        success: true,
        data: product.stock - reserved >= quantity,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to check availability: ${error}`,
      };
    }
  }

  async reserveStock(items: CartItem[], customerId?: string, sessionId?: string): Promise<ApiResponse<string>> {
    try {
      // Verify all items are available in parallel
      const availabilityResults = await Promise.all(
        items.map(item => this.checkAvailability(item.productId, item.quantity))
      );
      const failedIndex = availabilityResults.findIndex(r => !r.success || !r.data);
      if (failedIndex !== -1) {
        return {
          success: false,
          error: `Product ${items[failedIndex].productId} is not available in requested quantity`,
        };
      }

      const reservationId = crypto.randomUUID();

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const reservationRecords = items.map(item => ({
        reservation_id: reservationId,
        product_id: item.productId,
        quantity: item.quantity,
        customer_id: customerId || null,
        session_id: sessionId || null,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      }));

      const { error: insertError } = await this.supabase
        .from('stock_reservations')
        .insert(reservationRecords);

      if (insertError) {
        console.error('Failed to create stock reservations:', insertError);
        return {
          success: false,
          error: `Failed to reserve stock: ${insertError.message}`,
        };
      }

      console.log(`Stock reserved: ${reservationId} for ${items.length} items, expires at ${expiresAt.toISOString()}`);

      return {
        success: true,
        data: reservationId,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to reserve stock: ${error}`,
      };
    }
  }

  async releaseReservation(reservationId: string): Promise<ApiResponse<void>> {
    try {
      const { error: updateError } = await this.supabase
        .from('stock_reservations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('reservation_id', reservationId)
        .eq('status', 'active');

      if (updateError) {
        console.error('Failed to release reservation:', updateError);
        return {
          success: false,
          error: `Failed to release reservation: ${updateError.message}`,
        };
      }

      console.log(`Reservation released: ${reservationId}`);

      return { success: true, data: undefined };

    } catch (error) {
      return {
        success: false,
        error: `Failed to release reservation: ${error}`,
      };
    }
  }

  async updateStock(productId: string, quantity: number): Promise<ApiResponse<void>> {
    try {
      // Fetch current stock to compute new value.
      // NOTE: For true atomicity under concurrent load a Postgres function via
      // .rpc('update_stock', { p_id, p_delta }) is recommended. The .gte()
      // guard below prevents negative stock at DB level as a safety net.
      const { data: product, error: fetchError } = await this.supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: `Product not found: ${fetchError.message}`,
        };
      }

      const newStock = product.stock + quantity;

      if (newStock < 0) {
        return {
          success: false,
          error: 'Insufficient stock',
        };
      }

      // Guard: for decrements, only update if the DB stock is still sufficient.
      // This prevents negative stock even if a concurrent request changed it.
      const query = this.supabase
        .from('products')
        .update({
          stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      const { data: updated, error: updateError } = quantity < 0
        ? await query.gte('stock', Math.abs(quantity)).select('id')
        : await query.select('id');

      if (updateError) {
        return {
          success: false,
          error: `Failed to update stock: ${updateError.message}`,
        };
      }

      if (!updated || updated.length === 0) {
        return {
          success: false,
          error: 'Insufficient stock — update rejected by a concurrent modification',
        };
      }

      await this.logInventoryMovement(productId, quantity, 'stock_update');

      return { success: true, data: undefined };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update stock: ${error}`,
      };
    }
  }

  async getLowStockAlerts(): Promise<ApiResponse<Product[]>> {
    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('*')
        .lt('stock', LOW_STOCK_THRESHOLD)
        .eq('is_active', true)
        .order('stock', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `Failed to get low stock alerts: ${error.message}`,
        };
      }

      const transformedProducts: Product[] = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images || [],
        stock: product.stock,
        sku: product.sku,
        weight: product.weight || 0,
        dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
        isActive: product.is_active,
        translations: {
          sv: {
            name: product.name_sv || product.name,
            description: product.description_sv || product.description,
          },
          en: {
            name: product.name,
            description: product.description,
          },
        },
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at),
      }));

      return { success: true, data: transformedProducts };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get low stock alerts: ${error}`,
      };
    }
  }

  async getInventoryStatus(): Promise<ApiResponse<{
    totalProducts: number;
    inStockProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    totalValue: number;
  }>> {
    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('stock, price, cost_price, is_active')
        .eq('is_active', true);

      if (error) {
        return {
          success: false,
          error: `Failed to get inventory status: ${error.message}`,
        };
      }

      const totalProducts = products.length;
      const inStockProducts = products.filter(p => p.stock > 0).length;
      const outOfStockProducts = products.filter(p => p.stock === 0).length;
      const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length;
      const totalValue = products.reduce((sum, product) => {
        return sum + (product.stock * (product.cost_price || product.price));
      }, 0);

      return {
        success: true,
        data: { totalProducts, inStockProducts, outOfStockProducts, lowStockProducts, totalValue },
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get inventory status: ${error}`,
      };
    }
  }

  async bulkUpdateStock(updates: Array<{
    productId: string;
    quantity: number;
    reason?: string;
  }>): Promise<ApiResponse<void>> {
    try {
      // NOTE: updates are applied sequentially; there is no DB-level rollback
      // if a later item fails. For true atomicity use a Postgres RPC transaction.
      const results = await Promise.all(updates.map(u => this.updateStock(u.productId, u.quantity)));

      const failed = results.find(r => !r.success);
      if (failed) return failed;

      return { success: true, data: undefined };

    } catch (error) {
      return {
        success: false,
        error: `Failed to bulk update stock: ${error}`,
      };
    }
  }

  async getStockMovementHistory(
    productId: string,
    limit: number = 50
  ): Promise<ApiResponse<Array<{
    id: string;
    quantity: number;
    type: string;
    reason?: string;
    createdAt: Date;
  }>>> {
    try {
      const { data: movements, error } = await this.supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: `Failed to get stock movement history: ${error.message}`,
        };
      }

      return {
        success: true,
        data: movements.map(movement => ({
          id: movement.id,
          quantity: movement.quantity,
          type: movement.type,
          reason: movement.reason,
          createdAt: new Date(movement.created_at),
        })),
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get stock movement history: ${error}`,
      };
    }
  }

  private async logInventoryMovement(
    productId: string,
    quantity: number,
    type: string,
    reason?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('inventory_movements')
        .insert({
          product_id: productId,
          quantity,
          type,
          reason,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log inventory movement:', error);
    }
  }

  async adjustStock(
    productId: string,
    newQuantity: number,
    reason: string
  ): Promise<ApiResponse<void>> {
    try {
      if (newQuantity < 0) {
        return {
          success: false,
          error: 'Stock quantity cannot be negative',
        };
      }

      const { data: product, error: fetchError } = await this.supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: `Product not found: ${fetchError.message}`,
        };
      }

      const adjustment = newQuantity - product.stock;

      const { error: updateError } = await this.supabase
        .from('products')
        .update({
          stock: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to adjust stock: ${updateError.message}`,
        };
      }

      await this.logInventoryMovement(productId, adjustment, 'adjustment', reason);

      return { success: true, data: undefined };

    } catch (error) {
      return {
        success: false,
        error: `Failed to adjust stock: ${error}`,
      };
    }
  }

  async completeReservation(reservationId: string): Promise<ApiResponse<void>> {
    try {
      // Fetch items before marking completed so we can decrement actual stock.
      // Reservations are soft holds — products.stock is only reduced here at
      // order finalisation, not at reservation time.
      const { data: reservationItems, error: fetchError } = await this.supabase
        .from('stock_reservations')
        .select('product_id, quantity')
        .eq('reservation_id', reservationId)
        .eq('status', 'active');

      if (fetchError) {
        return {
          success: false,
          error: `Failed to fetch reservation: ${fetchError.message}`,
        };
      }

      if (!reservationItems || reservationItems.length === 0) {
        return {
          success: false,
          error: `Reservation ${reservationId} not found or already completed`,
        };
      }

      // Decrement stock first. If this fails the reservation stays active
      // and the caller can retry — no silent data inconsistency.
      for (const item of reservationItems) {
        const result = await this.updateStock(item.product_id, -item.quantity);
        if (!result.success) {
          return {
            success: false,
            error: `Stock decrement failed for product ${item.product_id}: ${result.error}`,
          };
        }
      }

      const { error: updateError } = await this.supabase
        .from('stock_reservations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('reservation_id', reservationId)
        .eq('status', 'active');

      if (updateError) {
        console.error('Failed to complete reservation:', updateError);
        return {
          success: false,
          error: `Failed to complete reservation: ${updateError.message}`,
        };
      }

      console.log(`Reservation completed: ${reservationId}`);

      return { success: true, data: undefined };

    } catch (error) {
      return {
        success: false,
        error: `Failed to complete reservation: ${error}`,
      };
    }
  }

  async cleanupExpiredReservations(): Promise<ApiResponse<{ expiredCount: number }>> {
    try {
      // Single UPDATE returning affected rows — avoids the separate SELECT
      const { data: expired, error: updateError } = await this.supabase
        .from('stock_reservations')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'active')
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (updateError) {
        console.error('Failed to expire reservations:', updateError);
        return {
          success: false,
          error: `Failed to cleanup expired reservations: ${updateError.message}`,
        };
      }

      const expiredCount = expired?.length ?? 0;

      if (expiredCount > 0) {
        console.log(`Expired ${expiredCount} stock reservations`);
      }

      return { success: true, data: { expiredCount } };

    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup expired reservations: ${error}`,
      };
    }
  }

  async getActiveReservations(productId: string): Promise<ApiResponse<number>> {
    try {
      const { data: reservations, error } = await this.supabase
        .from('stock_reservations')
        .select('quantity')
        .eq('product_id', productId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Failed to get active reservations:', error);
        return {
          success: false,
          error: `Failed to get active reservations: ${error.message}`,
        };
      }

      const totalReserved = reservations?.reduce((sum, r) => sum + r.quantity, 0) ?? 0;

      return { success: true, data: totalReserved };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get active reservations: ${error}`,
      };
    }
  }
}
