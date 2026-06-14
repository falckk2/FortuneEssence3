import { injectable, inject } from 'tsyringe';
import type { ICartService, ICartRepository, IProductRepository, IAbandonedCartRepository, IBundleService } from '@/interfaces';
import type { Cart, CartItem, AbandonedCart, ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';
import { PriceCalculator } from '@/utils/helpers';
import { cartItemSchema } from '@/utils/validation';
import crypto from 'crypto';

@injectable()
export class CartService implements ICartService {
  constructor(
    @inject(TOKENS.ICartRepository) private readonly cartRepository: ICartRepository,
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository,
    @inject(TOKENS.IAbandonedCartRepository) private readonly abandonedCartRepository: IAbandonedCartRepository,
    @inject(TOKENS.IBundleService) private readonly bundleService: IBundleService
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
          error: validation.error.issues.map((issue) => issue.message).join(', '),
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
      const cartResult = await this.cartRepository.findById(cartId);

      if (!cartResult.success) {
        return {
          success: false,
          error: 'Cart not found',
        };
      }

      const cart = cartResult.data!;

      // Bundle items are always added as separate line items (each has unique selection)
      const isBundle = !!item.bundleSelection;
      const existingItemIndex = isBundle
        ? -1
        : cart.items.findIndex(cartItem => cartItem.productId === item.productId && !cartItem.bundleSelection);

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing regular item
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
            ? { ...cartItem, quantity: newQuantity, price: product.price }
            : cartItem
        );
      } else {
        // Add new item with current product price and a unique cartItemId
        const newItem: CartItem = {
          ...item,
          cartItemId: crypto.randomUUID(),
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

  async removeItem(cartId: string, productId: string, cartItemId?: string): Promise<ApiResponse<Cart>> {
    try {
      // Get current cart
      const cartResult = await this.cartRepository.findById(cartId);

      if (!cartResult.success) {
        return {
          success: false,
          error: 'Cart not found',
        };
      }

      const cart = cartResult.data!;
      // If cartItemId is provided (bundle), remove only that specific instance
      const updatedItems = cartItemId
        ? cart.items.filter(item => item.cartItemId !== cartItemId)
        : cart.items.filter(item => item.productId !== productId);
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

  async updateQuantity(cartId: string, productId: string, quantity: number, cartItemId?: string): Promise<ApiResponse<Cart>> {
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
      const cartResult = await this.cartRepository.findById(cartId);

      if (!cartResult.success) {
        return {
          success: false,
          error: 'Cart not found',
        };
      }

      const cart = cartResult.data!;
      const updatedItems = cart.items.map(item =>
        (cartItemId ? item.cartItemId === cartItemId : item.productId === productId)
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
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    return Math.round(subtotal * 100) / 100; // Round to 2 decimal places
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

      // Batch-fetch all products in one query
      const productIds = [...new Set(cart.items.map(item => item.productId))];
      const productsResult = await this.productRepository.findByIds(productIds);
      const productMap = new Map((productsResult.data ?? []).map(p => [p.id, p]));

      for (const item of cart.items) {
        // Validate bundle items if this is a bundle
        if (item.bundleSelection) {
          const bundleValidation = await this.bundleService.validateBundleSelection(
            item.bundleSelection.bundleProductId,
            item.bundleSelection.selectedProductIds,
            { [item.productId]: item.quantity }
          );

          if (!bundleValidation.success || !bundleValidation.data?.isValid) {
            const bundleErrors = bundleValidation.data?.errors || [bundleValidation.error || 'Unknown error'];
            bundleErrors.forEach(error => issues.push(`Bundle: ${error}`));
          }
        }

        const product = productMap.get(item.productId);

        if (!product) {
          issues.push(`Product ${item.productId} not found`);
          continue;
        }

        if (!product.isActive) {
          issues.push(`Product "${product.name}" is no longer available`);
        }

        if (product.stock < item.quantity) {
          issues.push(`Product "${product.name}" has insufficient stock (${product.stock} available, ${item.quantity} in cart)`);
        }

        // Check if price has changed significantly (more than 5%)
        const priceDifference = item.price > 0 ? Math.abs(product.price - item.price) / item.price : 0;
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

      // Batch-fetch all products in one query
      const productIds = [...new Set(cart.items.map(item => item.productId))];
      const productsResult = await this.productRepository.findByIds(productIds);
      const productMap = new Map((productsResult.data ?? []).map(p => [p.id, p]));

      const updatedItems: CartItem[] = cart.items.map(item => {
        const product = productMap.get(item.productId);
        return product ? { ...item, price: product.price } : item;
      });

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

      // Calculate total weight for shipping — batch-fetch all products
      const weightProductIds = [...new Set(cart.items.map(item => item.productId))];
      const weightProductsResult = await this.productRepository.findByIds(weightProductIds);
      const weightProductMap = new Map((weightProductsResult.data ?? []).map(p => [p.id, p]));

      const totalWeight = cart.items.reduce((sum, item) => {
        const product = weightProductMap.get(item.productId);
        return sum + (product ? product.weight * item.quantity : 0);
      }, 0);

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
    return this.cartRepository.findById(cartId);
  }

  // Abandoned Cart Recovery Methods

  async trackAbandonedCart(
    cartId: string,
    email: string,
    customerId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ApiResponse<{ abandonedCartId: string; recoveryToken: string }>> {
    try {
      // Get cart details
      const cartResult = await this.getCartById(cartId);
      if (!cartResult.success || !cartResult.data) {
        return {
          success: false,
          error: 'Cart not found',
        };
      }

      const cart = cartResult.data;

      // Don't track empty carts
      if (!cart.items || cart.items.length === 0) {
        return {
          success: false,
          error: 'Cannot track empty cart',
        };
      }

      // Generate recovery token
      const recoveryToken = crypto.randomBytes(32).toString('hex');

      // Calculate subtotal (before shipping/tax)
      const subtotal = await this.calculateTotal(cart.items);

      // Check if cart is already tracked
      const existingCartResult = await this.abandonedCartRepository.findByCartId(cartId, 'abandoned');

      if (existingCartResult.success && existingCartResult.data) {
        // Update existing abandoned cart
        const updateResult = await this.abandonedCartRepository.update(existingCartResult.data.id, {
          email,
          items: cart.items,
          subtotal,
          total: cart.total,
          recoveryToken,
          abandonedAt: new Date(),
        });

        if (!updateResult.success || !updateResult.data) {
          return {
            success: false,
            error: updateResult.error || 'Failed to update abandoned cart',
          };
        }

        return {
          success: true,
          data: {
            abandonedCartId: updateResult.data.id,
            recoveryToken: updateResult.data.recoveryToken,
          },
        };
      } else {
        // Create new abandoned cart record
        const createResult = await this.abandonedCartRepository.create({
          cartId,
          customerId,
          email,
          sessionId,
          items: cart.items,
          subtotal,
          total: cart.total,
          currency: 'SEK',
          recoveryToken,
          abandonedAt: new Date(),
          status: 'abandoned',
          reminderCount: 0,
          ipAddress,
          userAgent,
        });

        if (!createResult.success || !createResult.data) {
          return {
            success: false,
            error: createResult.error || 'Failed to track abandoned cart',
          };
        }

        return {
          success: true,
          data: {
            abandonedCartId: createResult.data.id,
            recoveryToken: createResult.data.recoveryToken,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to track abandoned cart: ${error}`,
      };
    }
  }

  async getAbandonedCartsForReminder(hoursAbandoned: number = 1, maxReminders: number = 3): Promise<ApiResponse<AbandonedCart[]>> {
    return this.abandonedCartRepository.findForReminder(hoursAbandoned, maxReminders);
  }

  async markCartReminded(abandonedCartId: string): Promise<ApiResponse<void>> {
    try {
      // Fetch current count so we can pass the incremented value to markReminded
      const cartResult = await this.abandonedCartRepository.findById(abandonedCartId);

      if (!cartResult.success || !cartResult.data) {
        return {
          success: false,
          error: cartResult.error || 'Cart not found',
        };
      }

      const newReminderCount = cartResult.data.reminderCount + 1;
      return this.abandonedCartRepository.markReminded(abandonedCartId, newReminderCount);
    } catch (error) {
      return {
        success: false,
        error: `Failed to mark cart as reminded: ${error}`,
      };
    }
  }

  async markCartRecovered(recoveryToken: string, orderId: string): Promise<ApiResponse<void>> {
    return this.abandonedCartRepository.markRecovered(recoveryToken, orderId);
  }

  async recoverAbandonedCart(recoveryToken: string): Promise<ApiResponse<{
    cartId: string;
    items: CartItem[];
    total: number;
    email: string;
  }>> {
    try {
      const abandonedCartResult = await this.abandonedCartRepository.findByRecoveryToken(recoveryToken);

      if (!abandonedCartResult.success || !abandonedCartResult.data) {
        return {
          success: false,
          error: abandonedCartResult.error || 'Invalid or expired recovery link',
        };
      }

      const abandonedCart = abandonedCartResult.data;

      // Check if cart is not too old (e.g., 30 days)
      const abandonedDate = abandonedCart.abandonedAt;
      const daysSinceAbandoned = (Date.now() - abandonedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceAbandoned > 30) {
        // Mark as expired
        await this.abandonedCartRepository.markExpired(abandonedCart.id);

        return {
          success: false,
          error: 'Recovery link has expired',
        };
      }

      return {
        success: true,
        data: {
          cartId: abandonedCart.cartId,
          items: abandonedCart.items,
          total: abandonedCart.total,
          email: abandonedCart.email,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to recover abandoned cart: ${error}`,
      };
    }
  }

  // Bundle-specific methods
  async addBundleToCart(
    cartId: string,
    bundleProductId: string,
    selectedProductIds: string[],
    quantity: number = 1
  ): Promise<ApiResponse<Cart>> {
    try {
      // Validate bundle selection
      const validationResult = await this.bundleService.validateBundleSelection(
        bundleProductId,
        selectedProductIds,
        // Calculate quantities needed (each bundle instance needs 1 of each product)
        selectedProductIds.reduce((acc, id) => ({ ...acc, [id]: quantity }), {})
      );

      if (!validationResult.success || !validationResult.data?.isValid) {
        const errors = validationResult.data?.errors || [validationResult.error || 'Invalid bundle selection'];
        return {
          success: false,
          error: errors.join(', '),
        };
      }

      // Get bundle product details
      const bundleResult = await this.productRepository.findById(bundleProductId);
      if (!bundleResult.success || !bundleResult.data) {
        return {
          success: false,
          error: 'Bundle product not found',
        };
      }

      const bundleProduct = bundleResult.data;

      // Create cart item with bundle metadata
      const bundleItem: CartItem = {
        productId: bundleProductId,
        quantity,
        price: bundleProduct.price,
        bundleSelection: {
          bundleProductId,
          selectedProductIds,
        },
      };

      // Add to cart using existing addItem method
      return this.addItem(cartId, bundleItem);
    } catch (error) {
      return {
        success: false,
        error: `Failed to add bundle to cart: ${error}`,
      };
    }
  }
}