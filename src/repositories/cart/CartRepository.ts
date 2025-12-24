import { ICartRepository } from '@/interfaces';
import { Cart, ApiResponse } from '@/types';
import { supabase } from '@/lib/supabase';

export class CartRepository implements ICartRepository {
  private readonly tableName = 'carts';

  async findById(id: string): Promise<ApiResponse<Cart>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
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
        error: `Failed to find cart: ${error}`,
      };
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse<Cart>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Cart doesn't exist, create a new one
          return this.create({
            userId,
            items: [],
            total: 0,
          });
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
        error: `Failed to find cart: ${error}`,
      };
    }
  }

  async findBySessionId(sessionId: string): Promise<ApiResponse<Cart>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Cart doesn't exist, create a new one
          return this.create({
            sessionId,
            items: [],
            total: 0,
          });
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
        error: `Failed to find cart: ${error}`,
      };
    }
  }

  async create(cart: Omit<Cart, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Cart>> {
    try {
      const cartData = {
        user_id: cart.userId || null,
        session_id: (cart as any).sessionId || null,
        items: cart.items,
        total: cart.total,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(cartData)
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
        error: `Failed to create cart: ${error}`,
      };
    }
  }

  async update(id: string, cart: Partial<Cart>): Promise<ApiResponse<Cart>> {
    try {
      const updateData: any = {};

      if (cart.items) updateData.items = cart.items;
      if (cart.total !== undefined) updateData.total = cart.total;
      if (cart.userId !== undefined) updateData.user_id = cart.userId;

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
          error: 'Cart not found',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update cart: ${error}`,
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete cart: ${error}`,
      };
    }
  }

  private transformDbRecord(record: any): Cart {
    return {
      id: record.id,
      userId: record.user_id,
      sessionId: record.session_id,
      items: record.items || [],
      total: record.total,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  // Additional methods for cart management
  async mergeGuestCartToUser(sessionId: string, userId: string): Promise<ApiResponse<Cart>> {
    try {
      // First, try to find existing guest cart
      const guestCartResult = await this.findBySessionId(sessionId);
      if (!guestCartResult.success) {
        // No guest cart exists, just find or create user cart
        return this.findByUserId(userId);
      }

      const guestCart = guestCartResult.data!;

      // Try to find existing user cart
      const userCartResult = await this.findByUserId(userId);
      
      if (userCartResult.success) {
        // Merge the carts
        const userCart = userCartResult.data!;
        const mergedItems = [...userCart.items];

        // Add items from guest cart, combining quantities for same products
        guestCart.items.forEach(guestItem => {
          const existingItemIndex = mergedItems.findIndex(
            item => item.productId === guestItem.productId
          );

          if (existingItemIndex >= 0) {
            mergedItems[existingItemIndex].quantity += guestItem.quantity;
          } else {
            mergedItems.push(guestItem);
          }
        });

        // Calculate new total
        const total = mergedItems.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        );

        // Update user cart with merged items
        const updateResult = await this.update(userCart.id, {
          items: mergedItems,
          total,
        });

        // Delete guest cart
        await this.delete(guestCart.id);

        return updateResult;
      } else {
        // Convert guest cart to user cart
        return this.update(guestCart.id, {
          userId,
        });
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to merge carts: ${error}`,
      };
    }
  }

  async cleanupOldCarts(daysOld: number = 30): Promise<ApiResponse<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from(this.tableName)
        .delete()
        .lt('updated_at', cutoffDate.toISOString())
        .is('user_id', null) // Only delete guest carts
        .select('id');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data?.length || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup old carts: ${error}`,
      };
    }
  }

  async getCartCount(userId?: string, sessionId?: string): Promise<ApiResponse<number>> {
    try {
      let query = supabase.from(this.tableName).select('items');

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        return {
          success: false,
          error: 'Either userId or sessionId is required',
        };
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: true,
            data: 0,
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      const totalItems = (data.items || []).reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );

      return {
        success: true,
        data: totalItems,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get cart count: ${error}`,
      };
    }
  }
}