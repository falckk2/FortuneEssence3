import { IInventoryService } from '@/interfaces';
import { Product, CartItem, ApiResponse } from '@/types';
import { supabase } from '@/lib/supabase/client';

export class InventoryService implements IInventoryService {
  
  async checkAvailability(productId: string, quantity: number): Promise<ApiResponse<boolean>> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('stock_quantity, status')
        .eq('id', productId)
        .single();

      if (error) {
        return {
          success: false,
          error: `Product not found: ${error.message}`,
        };
      }

      if (product.status !== 'active') {
        return {
          success: false,
          error: 'Product is not available',
        };
      }

      const isAvailable = product.stock_quantity >= quantity;

      return {
        success: true,
        data: isAvailable,
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
      // First, verify all items are available
      for (const item of items) {
        const availabilityResult = await this.checkAvailability(item.productId, item.quantity);

        if (!availabilityResult.success || !availabilityResult.data) {
          return {
            success: false,
            error: `Product ${item.productId} is not available in requested quantity`,
          };
        }
      }

      // Generate unique reservation ID
      const reservationId = `RSV_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Set expiration time (15 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Create reservation records for each item
      const reservationRecords = items.map(item => ({
        reservation_id: reservationId,
        product_id: item.productId,
        quantity: item.quantity,
        customer_id: customerId || null,
        session_id: sessionId || null,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('stock_reservations')
        .insert(reservationRecords);

      if (insertError) {
        console.error('Failed to create stock reservations:', insertError);
        return {
          success: false,
          error: `Failed to reserve stock: ${insertError.message}`,
        };
      }

      // Log the reservation
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
      // Update reservation status to cancelled instead of deleting (for audit trail)
      const { error: updateError } = await supabase
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

      return {
        success: true,
        data: undefined,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to release reservation: ${error}`,
      };
    }
  }

  async updateStock(productId: string, quantity: number): Promise<ApiResponse<void>> {
    try {
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: `Product not found: ${fetchError.message}`,
        };
      }

      const newStock = product.stock_quantity + quantity;

      if (newStock < 0) {
        return {
          success: false,
          error: 'Insufficient stock',
        };
      }

      // Update stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update stock: ${updateError.message}`,
        };
      }

      // Log inventory movement
      await this.logInventoryMovement(productId, quantity, 'stock_update');

      return {
        success: true,
        data: undefined,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update stock: ${error}`,
      };
    }
  }

  async getLowStockAlerts(): Promise<ApiResponse<Product[]>> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .lt('stock_quantity', 10) // Products with less than 10 items
        .eq('status', 'active')
        .order('stock_quantity', { ascending: true });

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
        stock: product.stock_quantity,
        sku: product.sku,
        weight: product.weight || 0,
        dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
        isActive: product.status === 'active',
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

      return {
        success: true,
        data: transformedProducts,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get low stock alerts: ${error}`,
      };
    }
  }

  // Additional utility methods
  async getInventoryStatus(): Promise<ApiResponse<{
    totalProducts: number;
    inStockProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    totalValue: number;
  }>> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('stock_quantity, price, cost_price, status')
        .eq('status', 'active');

      if (error) {
        return {
          success: false,
          error: `Failed to get inventory status: ${error.message}`,
        };
      }

      const totalProducts = products.length;
      const inStockProducts = products.filter(p => p.stock_quantity > 0).length;
      const outOfStockProducts = products.filter(p => p.stock_quantity === 0).length;
      const lowStockProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length;
      
      const totalValue = products.reduce((sum, product) => {
        return sum + (product.stock_quantity * (product.cost_price || product.price));
      }, 0);

      return {
        success: true,
        data: {
          totalProducts,
          inStockProducts,
          outOfStockProducts,
          lowStockProducts,
          totalValue,
        },
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
      for (const update of updates) {
        const result = await this.updateStock(update.productId, update.quantity);
        
        if (!result.success) {
          return result;
        }

        // Log with reason if provided
        if (update.reason) {
          await this.logInventoryMovement(
            update.productId, 
            update.quantity, 
            'bulk_update',
            update.reason
          );
        }
      }

      return {
        success: true,
        data: undefined,
      };

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
      const { data: movements, error } = await supabase
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

      const transformedMovements = movements.map(movement => ({
        id: movement.id,
        quantity: movement.quantity,
        type: movement.type,
        reason: movement.reason,
        createdAt: new Date(movement.created_at),
      }));

      return {
        success: true,
        data: transformedMovements,
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
      await supabase
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
      // Don't throw error as this is just logging
    }
  }

  async adjustStock(
    productId: string,
    newQuantity: number,
    reason: string
  ): Promise<ApiResponse<void>> {
    try {
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: `Product not found: ${fetchError.message}`,
        };
      }

      if (newQuantity < 0) {
        return {
          success: false,
          error: 'Stock quantity cannot be negative',
        };
      }

      const adjustment = newQuantity - product.stock_quantity;

      // Update stock to new quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to adjust stock: ${updateError.message}`,
        };
      }

      // Log the adjustment
      await this.logInventoryMovement(productId, adjustment, 'adjustment', reason);

      return {
        success: true,
        data: undefined,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to adjust stock: ${error}`,
      };
    }
  }

  async completeReservation(reservationId: string): Promise<ApiResponse<void>> {
    try {
      // Mark reservation as completed (order was finalized)
      const { error: updateError } = await supabase
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

      return {
        success: true,
        data: undefined,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to complete reservation: ${error}`,
      };
    }
  }

  async cleanupExpiredReservations(): Promise<ApiResponse<{ expiredCount: number }>> {
    try {
      // Find and expire reservations past their expiration time
      const { data: expiredReservations, error: selectError } = await supabase
        .from('stock_reservations')
        .select('id')
        .eq('status', 'active')
        .lt('expires_at', new Date().toISOString());

      if (selectError) {
        console.error('Failed to fetch expired reservations:', selectError);
        return {
          success: false,
          error: `Failed to cleanup expired reservations: ${selectError.message}`,
        };
      }

      const expiredCount = expiredReservations?.length || 0;

      if (expiredCount > 0) {
        // Update status to expired
        const { error: updateError } = await supabase
          .from('stock_reservations')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('status', 'active')
          .lt('expires_at', new Date().toISOString());

        if (updateError) {
          console.error('Failed to expire reservations:', updateError);
          return {
            success: false,
            error: `Failed to expire reservations: ${updateError.message}`,
          };
        }

        console.log(`Expired ${expiredCount} stock reservations`);
      }

      return {
        success: true,
        data: { expiredCount },
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup expired reservations: ${error}`,
      };
    }
  }

  async getActiveReservations(productId: string): Promise<ApiResponse<number>> {
    try {
      // Get total quantity of active reservations for a product
      const { data: reservations, error } = await supabase
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

      const totalReserved = reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0;

      return {
        success: true,
        data: totalReserved,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get active reservations: ${error}`,
      };
    }
  }
}
