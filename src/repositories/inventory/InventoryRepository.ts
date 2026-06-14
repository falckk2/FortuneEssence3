import { IInventoryRepository } from '@/interfaces';
import { InventoryItem, ApiResponse } from '@/types';
// Server-role client: inventory is RLS-protected with no anon policies (FABLE-015)
import { getSupabaseServer } from '@/lib/supabase-server';

export class InventoryRepository implements IInventoryRepository {
  private readonly tableName = 'inventory';

  // Lazy getter so the client is only created at request time, never at build time
  private get supabase() {
    return getSupabaseServer();
  }

  async findByProductId(productId: string): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Inventory record not found',
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
        error: `Failed to find inventory: ${error}`,
      };
    }
  }

  async updateStock(productId: string, quantity: number): Promise<ApiResponse<InventoryItem>> {
    try {
      // First, check if inventory record exists
      const existingResult = await this.findByProductId(productId);
      
      if (!existingResult.success) {
        // Create new inventory record
        const { data, error } = await this.supabase
          .from(this.tableName)
          .insert({
            product_id: productId,
            quantity: Math.max(0, quantity),
            reserved_quantity: 0,
            reorder_level: 10,
          })
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
      }

      // Update existing record
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          quantity: Math.max(0, quantity),
        })
        .eq('product_id', productId)
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
        error: `Failed to update stock: ${error}`,
      };
    }
  }

  async reserveStock(productId: string, quantity: number): Promise<ApiResponse<boolean>> {
    try {
      // Get current inventory for availability check
      const inventoryResult = await this.findByProductId(productId);
      if (!inventoryResult.success) {
        return {
          success: false,
          error: 'Product not found in inventory',
        };
      }

      const inventory = inventoryResult.data!;
      const availableStock = inventory.quantity - inventory.reservedQuantity;

      if (availableStock < quantity) {
        return {
          success: false,
          error: 'Insufficient stock available',
        };
      }

      // Atomic reserve: increment reserved_quantity only if stock is sufficient
      // Uses .gte() guard to prevent over-reservation under concurrent writes.
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          reserved_quantity: inventory.reservedQuantity + quantity,
        })
        .eq('product_id', productId)
        .gte('quantity', inventory.reservedQuantity + quantity)
        .select('product_id');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Insufficient stock available — concurrent modification detected',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reserve stock: ${error}`,
      };
    }
  }

  async releaseReservedStock(productId: string, quantity: number): Promise<ApiResponse<boolean>> {
    try {
      // Atomic decrement: use .gte() to ensure reserved_quantity doesn't go negative
      // This is a single SQL statement that avoids the read-then-write race.
      const { data: rows, error: selectError } = await this.supabase
        .from(this.tableName)
        .select('reserved_quantity')
        .eq('product_id', productId)
        .single();

      if (selectError) {
        return {
          success: false,
          error: 'Product not found in inventory',
        };
      }

      const currentReserved = rows.reserved_quantity;
      const newReservedQuantity = Math.max(0, currentReserved - quantity);

      // Only update if the reserved_quantity hasn't changed since we read it (OCC)
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          reserved_quantity: newReservedQuantity,
        })
        .eq('product_id', productId)
        .eq('reserved_quantity', currentReserved)
        .select('product_id');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data || data.length === 0) {
        // Concurrent modification — retry once
        const retryResult = await this.findByProductId(productId);
        if (!retryResult.success) {
          return { success: false, error: 'Product not found in inventory' };
        }
        const retryReserved = retryResult.data!.reservedQuantity;
        const retryNew = Math.max(0, retryReserved - quantity);
        const { error: retryError } = await this.supabase
          .from(this.tableName)
          .update({ reserved_quantity: retryNew })
          .eq('product_id', productId)
          .eq('reserved_quantity', retryReserved);
        if (retryError) {
          return { success: false, error: retryError.message };
        }
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to release reserved stock: ${error}`,
      };
    }
  }

  private transformDbRecord(record: any): InventoryItem {
    return {
      productId: record.product_id,
      quantity: record.quantity,
      reservedQuantity: record.reserved_quantity,
      reorderLevel: record.reorder_level,
      lastUpdated: new Date(record.last_updated),
    };
  }

  // Additional inventory management methods
  async adjustStock(productId: string, adjustment: number, reason?: string): Promise<ApiResponse<InventoryItem>> {
    try {
      const inventoryResult = await this.findByProductId(productId);
      if (!inventoryResult.success) {
        return {
          success: false,
          error: 'Product not found in inventory',
        };
      }

      const inventory = inventoryResult.data!;
      const newQuantity = Math.max(0, inventory.quantity + adjustment);

      // Update the stock
      const updateResult = await this.updateStock(productId, newQuantity);

      // Log the adjustment (in a real implementation, you'd have an inventory_logs table)
      if (updateResult.success && reason) {
        console.log(`Stock adjustment for ${productId}: ${adjustment} (${reason})`);
      }

      return updateResult;
    } catch (error) {
      return {
        success: false,
        error: `Failed to adjust stock: ${error}`,
      };
    }
  }

  async confirmReservation(productId: string, quantity: number): Promise<ApiResponse<InventoryItem>> {
    try {
      // Atomic confirm: reduce both quantity and reserved_quantity in one statement
      // with an OCC guard on reserved_quantity to prevent race conditions.
      const { data: rows, error: selectError } = await this.supabase
        .from(this.tableName)
        .select('quantity, reserved_quantity')
        .eq('product_id', productId)
        .single();

      if (selectError) {
        return {
          success: false,
          error: 'Product not found in inventory',
        };
      }

      const currentQuantity = rows.quantity;
      const currentReserved = rows.reserved_quantity;

      if (currentReserved < quantity) {
        return {
          success: false,
          error: 'Not enough reserved stock to confirm',
        };
      }

      // Update with OCC guard on both quantity and reserved_quantity
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          quantity: currentQuantity - quantity,
          reserved_quantity: currentReserved - quantity,
        })
        .eq('product_id', productId)
        .eq('quantity', currentQuantity)
        .eq('reserved_quantity', currentReserved)
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
          error: 'Concurrent modification detected — please retry',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to confirm reservation: ${error}`,
      };
    }
  }

  async getLowStockItems(threshold?: number): Promise<ApiResponse<InventoryItem[]>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .order('quantity', { ascending: true });

      if (threshold !== undefined) {
        query = query.lte('quantity', threshold);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      let filteredData = data;

      // If no threshold provided, filter by reorder_level (client-side)
      if (threshold === undefined) {
        filteredData = data.filter(item => item.quantity <= item.reorder_level);
      }

      return {
        success: true,
        data: filteredData.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get low stock items: ${error}`,
      };
    }
  }

  async getInventoryReport(): Promise<ApiResponse<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    reservedStock: number;
  }>> {
    try {
      // Get all inventory with product prices
      const { data: inventoryData, error: inventoryError } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          products (
            price,
            name
          )
        `);

      if (inventoryError) {
        return {
          success: false,
          error: inventoryError.message,
        };
      }

      const report = {
        totalProducts: inventoryData.length,
        totalValue: inventoryData.reduce((sum, item) => {
          const price = (item as any).products?.price || 0;
          return sum + (item.quantity * price);
        }, 0),
        lowStockCount: inventoryData.filter(item => item.quantity <= item.reorder_level).length,
        outOfStockCount: inventoryData.filter(item => item.quantity === 0).length,
        reservedStock: inventoryData.reduce((sum, item) => sum + item.reserved_quantity, 0),
      };

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate inventory report: ${error}`,
      };
    }
  }

  async updateReorderLevel(productId: string, reorderLevel: number): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          reorder_level: Math.max(0, reorderLevel),
        })
        .eq('product_id', productId)
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
          error: 'Inventory record not found',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update reorder level: ${error}`,
      };
    }
  }
}