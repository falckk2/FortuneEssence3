import { CartRepository } from '@/repositories/cart/CartRepository';
import { createMockSupabaseClient, mockSupabaseSuccess, mockSupabaseError, mockSupabaseNotFound } from '../helpers/mockSupabase';
import { mockCart, mockCartItems } from '../helpers/testData';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: null,
}));

describe('CartRepository', () => {
  let repository: CartRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockDbCart = {
    id: 'cart-123',
    user_id: 'user-456',
    session_id: null,
    items: mockCartItems,
    total: 749.48,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T12:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    const supabaseModule = require('@/lib/supabase');
    supabaseModule.supabase = mockSupabase;
    repository = new CartRepository();
  });

  describe('findById', () => {
    it('should return cart by id', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCart)
      );

      const result = await repository.findById('cart-123');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('cart-123');
      expect(result.data?.userId).toBe('user-456');
      expect(result.data?.items).toEqual(mockCartItems);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'cart-123');
    });

    it('should return error when cart not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Cart not found')
      );

      const result = await repository.findById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cart not found');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Connection failed')
      );

      const result = await repository.findById('cart-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });

  describe('findByUserId', () => {
    it('should return cart for existing user', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCart)
      );

      const result = await repository.findByUserId('user-456');

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe('user-456');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-456');
    });

    it('should create new cart when user cart does not exist', async () => {
      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseNotFound())
        .mockResolvedValueOnce(mockSupabaseSuccess({
          ...mockDbCart,
          items: [],
          total: 0,
        }));

      const result = await repository.findByUserId('new-user');

      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual([]);
      expect(result.data?.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.findByUserId('user-456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('findBySessionId', () => {
    it('should return cart for existing session', async () => {
      const sessionCart = { ...mockDbCart, user_id: null, session_id: 'session-789' };
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(sessionCart)
      );

      const result = await repository.findBySessionId('session-789');

      expect(result.success).toBe(true);
      expect(result.data?.sessionId).toBe('session-789');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('session_id', 'session-789');
    });

    it('should create new cart when session cart does not exist', async () => {
      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseNotFound())
        .mockResolvedValueOnce(mockSupabaseSuccess({
          ...mockDbCart,
          user_id: null,
          session_id: 'new-session',
          items: [],
          total: 0,
        }));

      const result = await repository.findBySessionId('new-session');

      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new user cart', async () => {
      const newCart = {
        userId: 'user-456',
        items: [],
        total: 0,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({
          ...mockDbCart,
          items: [],
          total: 0,
        })
      );

      const result = await repository.create(newCart);

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe('user-456');
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalled();
    });

    it('should create a new session cart', async () => {
      const newCart = {
        sessionId: 'session-789',
        items: [],
        total: 0,
      } as any;

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({
          ...mockDbCart,
          user_id: null,
          session_id: 'session-789',
          items: [],
          total: 0,
        })
      );

      const result = await repository.create(newCart);

      expect(result.success).toBe(true);
      expect(result.data?.sessionId).toBe('session-789');
    });

    it('should handle database errors during creation', async () => {
      const newCart = {
        userId: 'user-456',
        items: [],
        total: 0,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Insert failed')
      );

      const result = await repository.create(newCart);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insert failed');
    });
  });

  describe('update', () => {
    it('should update cart items and total', async () => {
      const updates = {
        items: mockCartItems,
        total: 749.48,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({ ...mockDbCart, ...updates })
      );

      const result = await repository.update('cart-123', updates);

      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual(mockCartItems);
      expect(result.data?.total).toBe(749.48);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'cart-123');
    });

    it('should update cart user id', async () => {
      const updates = {
        userId: 'new-user-123',
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({ ...mockDbCart, user_id: 'new-user-123' })
      );

      const result = await repository.update('cart-123', updates);

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe('new-user-123');
    });

    it('should return error when cart not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.update('nonexistent', { total: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cart not found');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Update failed')
      );

      const result = await repository.update('cart-123', { total: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete cart successfully', async () => {
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.delete('cart-123');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('carts');
      expect(mockSupabase.mockQuery.delete).toHaveBeenCalled();
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'cart-123');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseError('Delete failed')
      );

      const result = await repository.delete('cart-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Delete failed');
    });
  });

  describe('mergeGuestCartToUser', () => {
    it('should merge guest cart into user cart when both exist', async () => {
      const guestCart = {
        id: 'guest-cart',
        user_id: null,
        session_id: 'session-789',
        items: [{ productId: 'prod-1', quantity: 2, price: 299.99 }],
        total: 599.98,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      };

      const userCart = {
        id: 'user-cart',
        user_id: 'user-456',
        session_id: null,
        items: [{ productId: 'prod-2', quantity: 1, price: 149.50 }],
        total: 149.50,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      };

      // Mock the sequence of calls
      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseSuccess(guestCart)) // findBySessionId
        .mockResolvedValueOnce(mockSupabaseSuccess(userCart))  // findByUserId
        .mockResolvedValueOnce(mockSupabaseSuccess({           // update user cart
          ...userCart,
          items: [
            { productId: 'prod-2', quantity: 1, price: 149.50 },
            { productId: 'prod-1', quantity: 2, price: 299.99 },
          ],
          total: 749.48,
        }));

      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.mergeGuestCartToUser('session-789', 'user-456');

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBe(2);
    });

    it('should create user cart when guest cart exists but user cart does not', async () => {
      const guestCart = {
        id: 'guest-cart',
        user_id: null,
        session_id: 'session-789',
        items: [{ productId: 'prod-1', quantity: 2, price: 299.99 }],
        total: 599.98,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      };

      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseSuccess(guestCart)) // findBySessionId
        .mockResolvedValueOnce(mockSupabaseNotFound())         // findByUserId - not found
        .mockResolvedValueOnce(mockSupabaseSuccess({           // create new user cart
          ...guestCart,
          id: 'new-user-cart',
          user_id: 'user-456',
          session_id: null,
        }));

      const result = await repository.mergeGuestCartToUser('session-789', 'user-456');

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe('user-456');
    });

    it('should return user cart when no guest cart exists', async () => {
      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseNotFound())         // findBySessionId - not found
        .mockResolvedValueOnce(mockSupabaseSuccess(mockDbCart)); // findByUserId

      const result = await repository.mergeGuestCartToUser('session-789', 'user-456');

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe('user-456');
    });
  });

  describe('data transformation', () => {
    it('should correctly transform database record to domain model', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCart)
      );

      const result = await repository.findById('cart-123');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('cart-123');
      expect(result.data?.userId).toBe('user-456');
      expect(result.data?.items).toEqual(mockCartItems);
      expect(result.data?.total).toBe(749.48);
      expect(result.data?.createdAt).toBeInstanceOf(Date);
      expect(result.data?.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle empty items array', async () => {
      const emptyCart = { ...mockDbCart, items: [] };
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(emptyCart)
      );

      const result = await repository.findById('cart-123');

      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual([]);
    });

    it('should handle null items as empty array', async () => {
      const nullItemsCart = { ...mockDbCart, items: null };
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(nullItemsCart)
      );

      const result = await repository.findById('cart-123');

      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual([]);
    });
  });
});
