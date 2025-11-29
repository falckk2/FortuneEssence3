import { IInventoryService } from '@/interfaces/services';
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

  async reserveStock(items: CartItem[]): Promise<ApiResponse<string>> {
    try {
      // In a production system, this would create actual stock reservations
      // For now, we'll just verify availability and return a mock reservation ID
      
      for (const item of items) {
        const availabilityResult = await this.checkAvailability(item.productId, item.quantity);
        
        if (!availabilityResult.success || !availabilityResult.data) {
          return {
            success: false,
            error: `Product ${item.name} is not available in requested quantity`,
          };
        }
      }

      // Generate mock reservation ID
      const reservationId = `reservation_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // In production, you would:
      // 1. Create reservation records in the database
      // 2. Temporarily reduce available stock
      // 3. Set expiration timers for reservations

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
      // In production, this would:
      // 1. Find the reservation record
      // 2. Release the reserved stock back to available inventory
      // 3. Delete the reservation record

      console.log(`Releasing reservation: ${reservationId}`);

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
        nameSwedish: product.name_sv,
        description: product.description,
        descriptionSwedish: product.description_sv,
        price: product.price,
        compareAtPrice: product.compare_at_price,
        costPrice: product.cost_price,
        sku: product.sku,
        category: product.category,
        subcategory: product.subcategory,
        tags: product.tags || [],
        imageUrl: product.image_url,
        images: product.images || [],
        inStock: product.stock_quantity > 0,
        stockQuantity: product.stock_quantity,
        weight: product.weight,
        status: product.status,
        featured: product.featured,
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
}