import { AbandonedCartRepository } from '@/repositories/cart/AbandonedCartRepository';
import { createMockSupabaseClient, mockSupabaseSuccess, mockSupabaseError, mockSupabaseNotFound } from '../helpers/mockSupabase';
import { mockAbandonedCart, mockDbAbandonedCart, mockCartItems } from '../helpers/testData';
import type { AbandonedCartCreateData } from '@/types';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: null, // Will be replaced in each test
}));

describe('AbandonedCartRepository', () => {
  let repository: AbandonedCartRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create new mock supabase client
    mockSupabase = createMockSupabaseClient();

    // Replace the mocked supabase with our test version
    const supabaseModule = require('@/lib/supabase');
    supabaseModule.supabase = mockSupabase;

    // Create repository instance
    repository = new AbandonedCartRepository();
  });

  describe('create', () => {
    it('should create a new abandoned cart successfully', async () => {
      // Arrange
      const createData: AbandonedCartCreateData = {
        cartId: 'cart-123',
        customerId: 'user-456',
        email: 'test@example.com',
        sessionId: 'session-789',
        items: mockCartItems,
        subtotal: 749.48,
        total: 749.48,
        currency: 'SEK',
        recoveryToken: 'token-abc123',
        abandonedAt: new Date('2025-01-01T12:00:00Z'),
        status: 'abandoned',
        reminderCount: 0,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbAbandonedCart)
      );

      // Act
      const result = await repository.create(createData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.cartId).toBe('cart-123');
      expect(result.data?.email).toBe('test@example.com');
      expect(result.data?.status).toBe('abandoned');

      expect(mockSupabase.from).toHaveBeenCalledWith('abandoned_carts');
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalled();
    });

    it('should handle database error during creation', async () => {
      // Arrange
      const createData: AbandonedCartCreateData = {
        cartId: 'cart-123',
        email: 'test@example.com',
        items: mockCartItems,
        subtotal: 749.48,
        total: 749.48,
        currency: 'SEK',
        recoveryToken: 'token-abc123',
        abandonedAt: new Date(),
        status: 'abandoned',
        reminderCount: 0,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Database connection failed')
      );

      // Act
      const result = await repository.create(createData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create abandoned cart');
      expect(result.data).toBeUndefined();
    });

    it('should handle missing optional fields correctly', async () => {
      // Arrange
      const createData: AbandonedCartCreateData = {
        cartId: 'cart-123',
        email: 'test@example.com',
        items: mockCartItems,
        subtotal: 749.48,
        total: 749.48,
        currency: 'SEK',
        recoveryToken: 'token-abc123',
        abandonedAt: new Date(),
        status: 'abandoned',
        reminderCount: 0,
        // No customerId, sessionId, ipAddress, userAgent
      };

      const dbRecord = {
        ...mockDbAbandonedCart,
        customer_id: null,
        session_id: null,
        ip_address: null,
        user_agent: null,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(dbRecord)
      );

      // Act
      const result = await repository.create(createData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.customerId).toBeUndefined();
      expect(result.data?.sessionId).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update an abandoned cart successfully', async () => {
      // Arrange
      const updateData = {
        email: 'newemail@example.com',
        reminderCount: 1,
        status: 'reminded' as const,
      };

      const updatedDbRecord = {
        ...mockDbAbandonedCart,
        email: 'newemail@example.com',
        reminder_count: 1,
        status: 'reminded',
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(updatedDbRecord)
      );

      // Act
      const result = await repository.update('abandoned-cart-1', updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('newemail@example.com');
      expect(result.data?.reminderCount).toBe(1);
      expect(result.data?.status).toBe('reminded');

      expect(mockSupabase.mockQuery.update).toHaveBeenCalled();
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'abandoned-cart-1');
    });

    it('should return error when cart not found', async () => {
      // Arrange
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      // Act
      const result = await repository.update('nonexistent-id', { email: 'test@test.com' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Abandoned cart not found');
    });
  });

  describe('findByCartId', () => {
    it('should find abandoned cart by cart ID', async () => {
      // Arrange
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbAbandonedCart)
      );

      // Act
      const result = await repository.findByCartId('cart-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.cartId).toBe('cart-123');

      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('cart_id', 'cart-123');
    });

    it('should find abandoned cart by cart ID and status', async () => {
      // Arrange
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbAbandonedCart)
      );

      // Act
      const result = await repository.findByCartId('cart-123', 'abandoned');

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('cart_id', 'cart-123');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('status', 'abandoned');
    });

    it('should return error when cart not found', async () => {
      // Arrange
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      // Act
      const result = await repository.findByCartId('nonexistent-cart');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Abandoned cart not found');
    });
  });

  describe('findByRecoveryToken', () => {
    it('should find abandoned cart by recovery token', async () => {
      // Arrange
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbAbandonedCart)
      );

      // Act
      const result = await repository.findByRecoveryToken('token-abc123def456');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.recoveryToken).toBe('token-abc123def456');

      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('recovery_token', 'token-abc123def456');
      expect(mockSupabase.mockQuery.in).toHaveBeenCalledWith('status', ['abandoned', 'reminded']);
    });

    it('should return error when token is invalid', async () => {
      // Arrange
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      // Act
      const result = await repository.findByRecoveryToken('invalid-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired recovery link');
    });
  });

  describe('findForReminder', () => {
    it('should find abandoned carts needing reminders', async () => {
      // Arrange
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 2); // 2 hours ago

      const cart1 = { ...mockDbAbandonedCart, id: 'cart-1' };
      const cart2 = { ...mockDbAbandonedCart, id: 'cart-2' };

      mockSupabase.mockQuery.or = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([cart1, cart2])
      );

      // Act
      const result = await repository.findForReminder(1, 3);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].id).toBe('cart-1');
      expect(result.data?.[1].id).toBe('cart-2');

      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('status', 'abandoned');
      expect(mockSupabase.mockQuery.lt).toHaveBeenCalledWith('reminder_count', 3);
    });

    it('should return empty array when no carts need reminders', async () => {
      // Arrange
      mockSupabase.mockQuery.or = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([])
      );

      // Act
      const result = await repository.findForReminder(1, 3);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      mockSupabase.mockQuery.or = jest.fn().mockResolvedValue(
        mockSupabaseError('Connection timeout')
      );

      // Act
      const result = await repository.findForReminder(1, 3);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get abandoned carts');
    });
  });

  describe('markReminded', () => {
    it('should mark cart as reminded successfully', async () => {
      // Arrange
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      // Act
      const result = await repository.markReminded('abandoned-cart-1', 1);

      // Assert
      expect(result.success).toBe(true);

      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          reminder_count: 1,
          status: 'reminded',
        })
      );
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'abandoned-cart-1');
    });

    it('should handle database errors', async () => {
      // Arrange
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseError('Update failed')
      );

      // Act
      const result = await repository.markReminded('abandoned-cart-1', 1);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to mark cart as reminded');
    });
  });

  describe('markRecovered', () => {
    it('should mark cart as recovered successfully', async () => {
      // Arrange
      mockSupabase.mockQuery.in = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      // Act
      const result = await repository.markRecovered('token-abc123', 'order-789');

      // Assert
      expect(result.success).toBe(true);

      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          recovery_order_id: 'order-789',
          status: 'recovered',
        })
      );
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('recovery_token', 'token-abc123');
      expect(mockSupabase.mockQuery.in).toHaveBeenCalledWith('status', ['abandoned', 'reminded']);
    });
  });

  describe('markExpired', () => {
    it('should mark cart as expired successfully', async () => {
      // Arrange
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      // Act
      const result = await repository.markExpired('abandoned-cart-1');

      // Assert
      expect(result.success).toBe(true);

      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'expired',
        })
      );
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'abandoned-cart-1');
    });
  });

  describe('data transformation', () => {
    it('should correctly transform database record to domain model', async () => {
      // Arrange
      const dbRecord = {
        ...mockDbAbandonedCart,
        reminded_at: '2025-01-01T13:00:00Z',
        recovered_at: '2025-01-01T14:00:00Z',
        recovery_order_id: 'order-123',
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(dbRecord)
      );

      // Act
      const result = await repository.findByCartId('cart-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.remindedAt).toBeInstanceOf(Date);
      expect(result.data?.recoveredAt).toBeInstanceOf(Date);
      expect(result.data?.recoveryOrderId).toBe('order-123');
    });

    it('should handle null optional fields correctly', async () => {
      // Arrange
      const dbRecord = {
        ...mockDbAbandonedCart,
        customer_id: null,
        session_id: null,
        reminded_at: null,
        recovered_at: null,
        recovery_order_id: null,
        ip_address: null,
        user_agent: null,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(dbRecord)
      );

      // Act
      const result = await repository.findByCartId('cart-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.customerId).toBeUndefined();
      expect(result.data?.sessionId).toBeUndefined();
      expect(result.data?.remindedAt).toBeUndefined();
      expect(result.data?.recoveredAt).toBeUndefined();
      expect(result.data?.recoveryOrderId).toBeUndefined();
    });
  });
});
