import { injectable, inject } from 'tsyringe';
import type { ICartService } from '@/interfaces/services';
import type { ICartRepository, IProductRepository } from '@/interfaces/repositories';
import type { Cart, CartItem, ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';
import { PriceCalculator } from '@/utils/helpers';
import { cartItemSchema } from '@/utils/validation';

@injectable()
export class CartService implements ICartService {
  constructor(
    @inject(TOKENS.ICartRepository) private readonly cartRepository: ICartRepository,
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository
  ) {}

  async getCart(userId?: string, sessionId?: string): Promise<ApiResponse<Cart>> {
    try {
      if (!userId && !sessionId) {
        return {
          success: false,
          error: 'Either userId or sessionId is required',
        };
      }

      let result: ApiResponse<Cart>;
      
      if (userId) {
        result = await this.cartRepository.findByUserId(userId);
      } else {
        result = await this.cartRepository.findBySessionId(sessionId!);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get cart: ${error}`,
      };
    }
  }

  async addItem(cartId: string, item: CartItem): Promise<ApiResponse<Cart>> {
    try {
      // Validate the cart item
      const validation = cartItemSchema.safeParse(item);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.errors.map(err => err.message).join(', '),
        };
      }

      // Verify product exists and is available
      const productResult = await this.productRepository.findById(item.productId);
      if (!productResult.success || !productResult.data) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      const product = productResult.data;

      // Check if product is active and in stock
      if (!product.isActive) {
        return {
          success: false,
          error: 'Product is no longer available',
        };
      }

      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `Only ${product.stock} items available in stock`,
        };
      }

      // Get current cart
      const cartResult = await this.cartRepository.findById ? 
        await this.cartRepository.findById(cartId) : 
        { success: false, error: 'Cart not found' };

      if (!cartResult.success) {
        return {
          success: false,
          error: 'Cart not found',
        };
      }

      const cart = cartResult.data!;
      const existingItemIndex = cart.items.findIndex(cartItem => cartItem.productId === item.productId);

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = cart.items[existingItemIndex];
        const newQuantity = existingItem.quantity + item.quantity;

        if (newQuantity > product.stock) {
          return {
            success: false,
            error: `Cannot add ${item.quantity} items. Only ${product.stock - existingItem.quantity} more available`,
          };
        }

        updatedItems = cart.items.map((cartItem, index) => 
          index === existingItemIndex 
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        );
      } else {
        // Add new item with current product price
        const newItem: CartItem = {
          ...item,
          price: product.price,
        };
        updatedItems = [...cart.items, newItem];
      }

      // Calculate new total
      const newTotal = await this.calculateTotal(updatedItems);

      // Update cart
      const updateResult = await this.cartRepository.update(cartId, {
        items: updatedItems,
        total: newTotal,
      });

      return updateResult;
    } catch (error) {
      return {
        success: false,
        error: `Failed to add item to cart: ${error}`,
      };
    }
  }

  async removeItem(cartId: string, productId: string): Promise<ApiResponse<Cart>> {
    try {
      // Get current cart
      const cartResult = await this.cartRepository.findById ? 
        await this.cartRepository.findById(cartId) : 
        { success: false, error: 'Cart not found' };

      if (!cartResult.success) {
        return {
          success: false,
          error: 'Cart not found',
        };
      }

      const cart = cartResult.data!;
      const updatedItems = cart.items.filter(item => item.productId !== productId);
      const newTotal = await this.calculateTotal(updatedItems);

      // Update cart
      const updateResult = await this.cartRepository.update(cartId, {
        items: updatedItems,
        total: newTotal,
      });

      return updateResult;
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove item from cart: ${error}`,
      };
    }
  }

  async updateQuantity(cartId: string, productId: string, quantity: number): Promise<ApiResponse<Cart>> {
    try {
      if (quantity < 0) {
        return {
          success: false,
          error: 'Quantity cannot be negative',
        };
      }

      if (quantity === 0) {
        return this.removeItem(cartId, productId);
      }

      // Verify product availability
      const productResult = await this.productRepository.findById(productId);
      if (!productResult.success || !productResult.data) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      const product = productResult.data;

      if (product.stock < quantity) {
        return {
          success: false,
          error: `Only ${product.stock} items available in stock`,
        };
      }

      // Get current cart
      const cartResult = await this.cartRepository.findById ? 
        await this.cartRepository.findById(cartId) : 
        { success: false, error: 'Cart not found' };

      if (!cartResult.success) {
        return {
          success: false,
          error: 'Cart not found',
        };
      }

      const cart = cartResult.data!;
      const updatedItems = cart.items.map(item =>
        item.productId === productId
          ? { ...item, quantity, price: product.price } // Update price in case it changed
          : item
      );

      const newTotal = await this.calculateTotal(updatedItems);

      // Update cart
      const updateResult = await this.cartRepository.update(cartId, {
        items: updatedItems,
        total: newTotal,
      });

      return updateResult;
    } catch (error) {
      return {
        success: false,
        error: `Failed to update quantity: ${error}`,
      };
    }
  }

  async clearCart(cartId: string): Promise<ApiResponse<void>> {
    try {
      const updateResult = await this.cartRepository.update(cartId, {
        items: [],
        total: 0,
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear cart: ${error}`,
      };
    }
  }

  async calculateTotal(items: CartItem[]): Promise<number> {
    try {
      const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
      return Math.round(subtotal * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Failed to calculate total:', error);
      return 0;
    }
  }

  // Additional business logic methods
  async validateCartItems(cartId: string): Promise<ApiResponse<{ valid: boolean; issues: string[] }>> {
    try {
      const cartResult = await this.getCartById(cartId);
      if (!cartResult.success) {
        return {
          success: false,
          error: cartResult.error,
        };
      }

      const cart = cartResult.data!;
      const issues: string[] = [];

      for (const item of cart.items) {
        const productResult = await this.productRepository.findById(item.productId);
        
        if (!productResult.success || !productResult.data) {
          issues.push(`Product ${item.productId} not found`);
          continue;
        }

        const product = productResult.data;

        if (!product.isActive) {
          issues.push(`Product "${product.name}" is no longer available`);
        }

        if (product.stock < item.quantity) {
          issues.push(`Product "${product.name}" has insufficient stock (${product.stock} available, ${item.quantity} in cart)`);
        }

        // Check if price has changed significantly (more than 5%)
        const priceDifference = Math.abs(product.price - item.price) / item.price;
        if (priceDifference > 0.05) {
          issues.push(`Product "${product.name}" price has changed from ${item.price} to ${product.price} SEK`);
        }
      }

      return {
        success: true,
        data: {
          valid: issues.length === 0,
          issues,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate cart: ${error}`,
      };
    }
  }

  async syncCartPrices(cartId: string): Promise<ApiResponse<Cart>> {
    try {
      const cartResult = await this.getCartById(cartId);
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.data!;
      const updatedItems: CartItem[] = [];

      for (const item of cart.items) {
        const productResult = await this.productRepository.findById(item.productId);
        
        if (productResult.success && productResult.data) {
          updatedItems.push({
            ...item,
            price: productResult.data.price,
          });
        } else {
          // Keep item if we can't verify the product (avoid data loss)
          updatedItems.push(item);
        }
      }

      const newTotal = await this.calculateTotal(updatedItems);

      const updateResult = await this.cartRepository.update(cartId, {
        items: updatedItems,
        total: newTotal,
      });

      return updateResult;
    } catch (error) {
      return {
        success: false,
        error: `Failed to sync cart prices: ${error}`,
      };
    }
  }

  async mergeGuestCart(sessionId: string, userId: string): Promise<ApiResponse<Cart>> {
    try {
      const result = await this.cartRepository.mergeGuestCartToUser(sessionId, userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to merge guest cart: ${error}`,
      };
    }
  }

  async getCartSummary(cartId: string): Promise<ApiResponse<{
    itemCount: number;
    subtotal: number;
    estimatedTax: number;
    totalWeight: number;
  }>> {
    try {
      const cartResult = await this.getCartById(cartId);
      if (!cartResult.success) {
        return {
          success: false,
          error: cartResult.error,
        };
      }

      const cart = cartResult.data!;
      const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      const subtotal = cart.total;
      const estimatedTax = PriceCalculator.calculateVAT(subtotal);

      // Calculate total weight for shipping
      let totalWeight = 0;
      for (const item of cart.items) {
        const productResult = await this.productRepository.findById(item.productId);
        if (productResult.success && productResult.data) {
          totalWeight += productResult.data.weight * item.quantity;
        }
      }

      return {
        success: true,
        data: {
          itemCount,
          subtotal,
          estimatedTax,
          totalWeight,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get cart summary: ${error}`,
      };
    }
  }

  private async getCartById(cartId: string): Promise<ApiResponse<Cart>> {
    // This is a helper method - in a real implementation, the repository would have this method
    // For now, we'll simulate it
    return {
      success: false,
      error: 'Method not implemented',
    };
  }
}