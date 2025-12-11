import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LocalStorageHelper } from '@/utils/helpers';

interface WishlistItem {
  productId: string;
  addedAt: Date;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem: WishlistItem) => {
        const { items } = get();
        const existingItem = items.find(item => item.productId === newItem.productId);

        if (!existingItem) {
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (productId: string) => {
        const { items } = get();
        const updatedItems = items.filter(item => item.productId !== productId);
        set({ items: updatedItems });
      },

      isInWishlist: (productId: string) => {
        const { items } = get();
        return items.some(item => item.productId === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      getItemCount: () => {
        const { items } = get();
        return items.length;
      },
    }),
    {
      name: 'fortune-essence-wishlist',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
    }
  )
);