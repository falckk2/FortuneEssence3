import { create } from 'zustand';
import { CartItem } from '@/types';
import { LocalStorageHelper } from '@/utils/helpers';

interface CartStore {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  addItem: (item: CartItem) => Promise<void>;
  addBundle: (bundleProductId: string, selectedProductIds: string[], quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getItemCount: () => number;
  getItem: (productId: string) => CartItem | undefined;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  total: 0,
  isLoading: false,

  addItem: async (newItem: CartItem) => {
    set({ isLoading: true });

    try {
      const sessionId = LocalStorageHelper.getSessionId();

      const requestBody = {
        action: 'add',
        productId: newItem.productId,
        quantity: newItem.quantity,
      };

      console.log('Adding item to cart:', requestBody, 'sessionId:', sessionId);

      // Add item to backend cart
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Cart API response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to add item to cart');
      }

      // Refresh cart from backend to get the updated state
      await get().refreshCart();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId: string) => {
    set({ isLoading: true });

    try {
      const sessionId = LocalStorageHelper.getSessionId();

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          action: 'remove',
          productId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove item from cart');
      }

      // Refresh cart from backend
      await get().refreshCart();
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return get().removeItem(productId);
    }

    set({ isLoading: true });

    try {
      const sessionId = LocalStorageHelper.getSessionId();

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          action: 'update',
          productId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update quantity');
      }

      // Refresh cart from backend
      await get().refreshCart();
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });

    try {
      const sessionId = LocalStorageHelper.getSessionId();

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          action: 'clear',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to clear cart');
      }

      set({
        items: [],
        total: 0
      });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addBundle: async (bundleProductId: string, selectedProductIds: string[], quantity: number = 1) => {
    set({ isLoading: true });

    try {
      const sessionId = LocalStorageHelper.getSessionId();

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          action: 'add-bundle',
          bundleProductId,
          selectedProductIds,
          quantity,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add bundle to cart');
      }

      // Refresh cart to get updated state from server
      await get().refreshCart();
    } catch (error) {
      console.error('Failed to add bundle to cart:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  refreshCart: async () => {
    try {
      const sessionId = LocalStorageHelper.getSessionId();

      const response = await fetch('/api/cart', {
        headers: {
          'x-session-id': sessionId
        }
      });

      const data = await response.json();

      if (data.success && data.data) {
        const cart = data.data;
        set({
          items: cart.items || [],
          total: cart.total || 0
        });
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error);
    }
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  getItem: (productId: string) => {
    const { items } = get();
    return items.find(item => item.productId === productId);
  },
}));