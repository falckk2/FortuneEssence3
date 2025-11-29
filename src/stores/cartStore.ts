import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';
import { LocalStorageHelper } from '@/utils/helpers';

interface CartStore {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemCount: () => number;
  getItem: (productId: string) => CartItem | undefined;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      isLoading: false,

      addItem: async (newItem: CartItem) => {
        set({ isLoading: true });
        
        try {
          const { items } = get();
          const existingItemIndex = items.findIndex(item => item.productId === newItem.productId);

          let updatedItems: CartItem[];
          
          if (existingItemIndex >= 0) {
            // Update existing item quantity
            updatedItems = items.map((item, index) => 
              index === existingItemIndex 
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            );
          } else {
            // Add new item
            updatedItems = [...items, newItem];
          }

          const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          set({ 
            items: updatedItems, 
            total: newTotal 
          });

          // Sync with server if user is logged in
          // This would be implemented with the cart service
          // await cartService.updateCart(updatedItems);
        } catch (error) {
          console.error('Failed to add item to cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (productId: string) => {
        set({ isLoading: true });
        
        try {
          const { items } = get();
          const updatedItems = items.filter(item => item.productId !== productId);
          const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          set({ 
            items: updatedItems, 
            total: newTotal 
          });

          // Sync with server if user is logged in
          // await cartService.updateCart(updatedItems);
        } catch (error) {
          console.error('Failed to remove item from cart:', error);
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
          const { items } = get();
          const updatedItems = items.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          );
          const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          set({ 
            items: updatedItems, 
            total: newTotal 
          });

          // Sync with server if user is logged in
          // await cartService.updateCart(updatedItems);
        } catch (error) {
          console.error('Failed to update item quantity:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: async () => {
        set({ isLoading: true });
        
        try {
          set({ 
            items: [], 
            total: 0 
          });

          // Sync with server if user is logged in
          // await cartService.clearCart();
        } catch (error) {
          console.error('Failed to clear cart:', error);
        } finally {
          set({ isLoading: false });
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
    }),
    {
      name: 'fortune-essence-cart',
      getStorage: () => ({
        getItem: (name) => {
          const item = LocalStorageHelper.getItem(name);
          return item ? JSON.stringify(item) : null;
        },
        setItem: (name, value) => {
          LocalStorageHelper.setItem(name, JSON.parse(value));
        },
        removeItem: (name) => {
          LocalStorageHelper.removeItem(name);
        },
      }),
    }
  )
);