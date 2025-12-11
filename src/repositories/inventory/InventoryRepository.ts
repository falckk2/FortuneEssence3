import { IInventoryRepository } from '@/interfaces';
import { InventoryItem, ApiResponse } from '@/types';
import { supabase } from '@/lib/supabase';

export class InventoryRepository implements IInventoryRepository {
  private readonly tableName = 'inventory';

  async findByProductId(productId: string): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data, error } = await supabase
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
        const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      // Get current inventory
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

      // Reserve the stock
      const { error } = await supabase
        .from(this.tableName)
        .update({
          reserved_quantity: inventory.reservedQuantity + quantity,
        })
        .eq('product_id', productId);

      if (error) {
        return {
          success: false,
          error: error.message,
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
      // Get current inventory
      const inventoryResult = await this.findByProductId(productId);
      if (!inventoryResult.success) {
        return {
          success: false,
          error: 'Product not found in inventory',
        };
      }

      const inventory = inventoryResult.data!;
      const newReservedQuantity = Math.max(0, inventory.reservedQuantity - quantity);

      // Release the stock
      const { error } = await supabase
        .from(this.tableName)
        .update({
          reserved_quantity: newReservedQuantity,
        })
        .eq('product_id', productId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
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
      // Get current inventory
      const inventoryResult = await this.findByProductId(productId);
      if (!inventoryResult.success) {
        return {
          success: false,
          error: 'Product not found in inventory',
        };
      }

      const inventory = inventoryResult.data!;

      if (inventory.reservedQuantity < quantity) {
        return {
          success: false,
          error: 'Not enough reserved stock to confirm',
        };
      }

      // Confirm reservation by reducing both quantity and reserved quantity
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          quantity: inventory.quantity - quantity,
          reserved_quantity: inventory.reservedQuantity - quantity,
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
        error: `Failed to confirm reservation: ${error}`,
      };
    }
  }

  async getLowStockItems(threshold?: number): Promise<ApiResponse<InventoryItem[]>> {
    try {
      let query = supabase
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
      const { data: inventoryData, error: inventoryError } = await supabase
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
      const { data, error } = await supabase
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