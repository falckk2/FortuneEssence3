import { create } from 'zustand';

interface WishlistItem {
  productId: string;
  addedAt: Date;
}

interface WishlistStore {
  items: WishlistItem[];
  isLoading: boolean;
  isAuthenticated: boolean;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  getItemCount: () => number;
  refreshWishlist: () => Promise<void>;
  setAuthenticated: (isAuth: boolean) => void;
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
  items: [],
  isLoading: false,
  isAuthenticated: false,

  setAuthenticated: (isAuth: boolean) => {
    set({ isAuthenticated: isAuth });
    if (!isAuth) {
      // Clear wishlist when logged out
      set({ items: [] });
    }
  },

  addItem: async (productId: string) => {
    const { isAuthenticated } = get();

    if (!isAuthenticated) {
      throw new Error('Please log in to add items to your wishlist');
    }

    set({ isLoading: true });

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          productId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add item to wishlist');
      }

      // Refresh wishlist from backend
      await get().refreshWishlist();
    } catch (error) {
      console.error('Failed to add item to wishlist:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId: string) => {
    const { isAuthenticated } = get();

    if (!isAuthenticated) {
      throw new Error('Please log in to remove items from your wishlist');
    }

    set({ isLoading: true });

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove',
          productId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove item from wishlist');
      }

      // Refresh wishlist from backend
      await get().refreshWishlist();
    } catch (error) {
      console.error('Failed to remove item from wishlist:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  isInWishlist: (productId: string) => {
    const { items } = get();
    return items.some(item => item.productId === productId);
  },

  clearWishlist: async () => {
    const { isAuthenticated } = get();

    if (!isAuthenticated) {
      set({ items: [] });
      return;
    }

    set({ isLoading: true });

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to clear wishlist');
      }

      set({ items: [] });
    } catch (error) {
      console.error('Failed to clear wishlist:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  refreshWishlist: async () => {
    const { isAuthenticated } = get();

    if (!isAuthenticated) {
      set({ items: [] });
      return;
    }

    try {
      const response = await fetch('/api/wishlist');

      const data = await response.json();

      if (data.success && data.data) {
        const items = data.data.map((item: any) => ({
          productId: item.productId,
          addedAt: new Date(item.createdAt),
        }));
        set({ items });
      }
    } catch (error) {
      console.error('Failed to refresh wishlist:', error);
    }
  },

  getItemCount: () => {
    const { items } = get();
    return items.length;
  },
}));