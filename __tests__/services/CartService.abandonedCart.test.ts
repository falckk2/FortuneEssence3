import { CartService } from '@/services/cart/CartService';
import type { ICartRepository, IProductRepository, IAbandonedCartRepository, IBundleService } from '@/interfaces';
import { mockCart, mockAbandonedCart, mockCartItems } from '../helpers/testData';
import type { AbandonedCart } from '@/types';

describe('CartService - Abandoned Cart Methods', () => {
  let cartService: CartService;
  let mockCartRepository: jest.Mocked<ICartRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockAbandonedCartRepository: jest.Mocked<IAbandonedCartRepository>;
  let mockBundleService: jest.Mocked<IBundleService>;

  beforeEach(() => {
    // Create mocks
    mockCartRepository = {
      findByUserId: jest.fn(),
      findBySessionId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      mergeGuestCartToUser: jest.fn(),
    } as any;

    mockProductRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCategory: jest.fn(),
      findBySku: jest.fn(),
      findFeatured: jest.fn(),
      getCategories: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockAbandonedCartRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findByCartId: jest.fn(),
      findByRecoveryToken: jest.fn(),
      findForReminder: jest.fn(),
      markReminded: jest.fn(),
      markRecovered: jest.fn(),
      markExpired: jest.fn(),
    } as any;

    mockBundleService = {
      getBundleConfiguration: jest.fn(),
      getAllBundleConfigurations: jest.fn(),
      getEligibleProducts: jest.fn(),
      validateBundleSelection: jest.fn(),
      calculateBundlePrice: jest.fn(),
    } as any;

    // Create service instance
    cartService = new CartService(
      mockCartRepository,
      mockProductRepository,
      mockAbandonedCartRepository,
      mockBundleService
    );
  });

  describe('trackAbandonedCart', () => {
    it('should create new abandoned cart when cart has items', async () => {
      // Arrange
      mockCartRepository.findByUserId.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      mockAbandonedCartRepository.findByCartId.mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      mockAbandonedCartRepository.create.mockResolvedValue({
        success: true,
        data: mockAbandonedCart,
      });

      // Act
      const result = await cartService.trackAbandonedCart(
        'cart-123',
        'test@example.com',
        'user-456',
        undefined,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.abandonedCartId).toBe(mockAbandonedCart.id);
      expect(result.data?.recoveryToken).toBeDefined();

      expect(mockCartRepository.findByUserId).toHaveBeenCalledWith('user-456', undefined);
      expect(mockAbandonedCartRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cartId: 'cart-123',
          email: 'test@example.com',
          customerId: 'user-456',
          items: mockCart.items,
          status: 'abandoned',
          reminderCount: 0,
        })
      );
    });

    it('should update existing abandoned cart', async () => {
      // Arrange
      mockCartRepository.findByUserId.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      mockAbandonedCartRepository.findByCartId.mockResolvedValue({
        success: true,
        data: mockAbandonedCart,
      });

      mockAbandonedCartRepository.update.mockResolvedValue({
        success: true,
        data: { ...mockAbandonedCart, email: 'newemail@example.com' },
      });

      // Act
      const result = await cartService.trackAbandonedCart(
        'cart-123',
        'newemail@example.com',
        'user-456'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(mockAbandonedCartRepository.update).toHaveBeenCalledWith(
        mockAbandonedCart.id,
        expect.objectContaining({
          email: 'newemail@example.com',
          items: mockCart.items,
        })
      );
    });

    it('should return error when cart not found', async () => {
      // Arrange
      mockCartRepository.findByUserId.mockResolvedValue({
        success: false,
        error: 'Cart not found',
      });

      // Act
      const result = await cartService.trackAbandonedCart(
        'cart-123',
        'test@example.com',
        'user-456'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cart not found');
      expect(mockAbandonedCartRepository.create).not.toHaveBeenCalled();
    });

    it('should return error when cart is empty', async () => {
      // Arrange
      mockCartRepository.findByUserId.mockResolvedValue({
        success: true,
        data: { ...mockCart, items: [] },
      });

      // Act
      const result = await cartService.trackAbandonedCart(
        'cart-123',
        'test@example.com',
        'user-456'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot track empty cart');
      expect(mockAbandonedCartRepository.create).not.toHaveBeenCalled();
    });

    it('should generate unique recovery token', async () => {
      // Arrange
      mockCartRepository.findByUserId.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      mockAbandonedCartRepository.findByCartId.mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      mockAbandonedCartRepository.create.mockResolvedValue({
        success: true,
        data: mockAbandonedCart,
      });

      // Act
      const result1 = await cartService.trackAbandonedCart('cart-1', 'test@example.com', 'user-1');
      const result2 = await cartService.trackAbandonedCart('cart-2', 'test@example.com', 'user-1');

      // Assert
      expect(result1.data?.recoveryToken).toBeDefined();
      expect(result2.data?.recoveryToken).toBeDefined();
      // Tokens should be different (statistically very unlikely to be the same)
      expect(result1.data?.recoveryToken).not.toBe(result2.data?.recoveryToken);
    });
  });

  describe('getAbandonedCartsForReminder', () => {
    it('should delegate to repository', async () => {
      // Arrange
      const abandonedCarts = [mockAbandonedCart];
      mockAbandonedCartRepository.findForReminder.mockResolvedValue({
        success: true,
        data: abandonedCarts,
      });

      // Act
      const result = await cartService.getAbandonedCartsForReminder(1, 3);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(abandonedCarts);
      expect(mockAbandonedCartRepository.findForReminder).toHaveBeenCalledWith(1, 3);
    });

    it('should use default parameters', async () => {
      // Arrange
      mockAbandonedCartRepository.findForReminder.mockResolvedValue({
        success: true,
        data: [],
      });

      // Act
      await cartService.getAbandonedCartsForReminder();

      // Assert
      expect(mockAbandonedCartRepository.findForReminder).toHaveBeenCalledWith(1, 3);
    });
  });

  describe('markCartReminded', () => {
    it('should increment reminder count and mark as reminded', async () => {
      // Arrange
      mockAbandonedCartRepository.findByCartId.mockResolvedValue({
        success: true,
        data: mockAbandonedCart,
      });

      mockAbandonedCartRepository.markReminded.mockResolvedValue({
        success: true,
      });

      // Act
      const result = await cartService.markCartReminded('abandoned-cart-1');

      // Assert
      expect(result.success).toBe(true);
      expect(mockAbandonedCartRepository.markReminded).toHaveBeenCalledWith(
        'abandoned-cart-1',
        1 // reminderCount was 0, now should be 1
      );
    });

    it('should handle multiple reminders', async () => {
      // Arrange
      const remindedCart = { ...mockAbandonedCart, reminderCount: 2 };
      mockAbandonedCartRepository.findByCartId.mockResolvedValue({
        success: true,
        data: remindedCart,
      });

      mockAbandonedCartRepository.markReminded.mockResolvedValue({
        success: true,
      });

      // Act
      await cartService.markCartReminded('abandoned-cart-1');

      // Assert
      expect(mockAbandonedCartRepository.markReminded).toHaveBeenCalledWith(
        'abandoned-cart-1',
        3 // reminderCount was 2, now should be 3
      );
    });

    it('should return error when cart not found', async () => {
      // Arrange
      mockAbandonedCartRepository.findByCartId.mockResolvedValue({
        success: false,
        error: 'Cart not found',
      });

      // Act
      const result = await cartService.markCartReminded('nonexistent-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cart not found');
      expect(mockAbandonedCartRepository.markReminded).not.toHaveBeenCalled();
    });
  });

  describe('markCartRecovered', () => {
    it('should delegate to repository', async () => {
      // Arrange
      mockAbandonedCartRepository.markRecovered.mockResolvedValue({
        success: true,
      });

      // Act
      const result = await cartService.markCartRecovered('token-abc123', 'order-789');

      // Assert
      expect(result.success).toBe(true);
      expect(mockAbandonedCartRepository.markRecovered).toHaveBeenCalledWith(
        'token-abc123',
        'order-789'
      );
    });
  });

  describe('recoverAbandonedCart', () => {
    it('should recover valid abandoned cart', async () => {
      // Arrange
      mockAbandonedCartRepository.findByRecoveryToken.mockResolvedValue({
        success: true,
        data: mockAbandonedCart,
      });

      // Act
      const result = await cartService.recoverAbandonedCart('token-abc123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.cartId).toBe(mockAbandonedCart.cartId);
      expect(result.data?.items).toEqual(mockAbandonedCart.items);
      expect(result.data?.total).toBe(mockAbandonedCart.total);
      expect(result.data?.email).toBe(mockAbandonedCart.email);
    });

    it('should return error for invalid token', async () => {
      // Arrange
      mockAbandonedCartRepository.findByRecoveryToken.mockResolvedValue({
        success: false,
        error: 'Invalid or expired recovery link',
      });

      // Act
      const result = await cartService.recoverAbandonedCart('invalid-token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired recovery link');
    });

    it('should mark cart as expired if older than 30 days', async () => {
      // Arrange
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

      const expiredCart: AbandonedCart = {
        ...mockAbandonedCart,
        abandonedAt: oldDate,
      };

      mockAbandonedCartRepository.findByRecoveryToken.mockResolvedValue({
        success: true,
        data: expiredCart,
      });

      mockAbandonedCartRepository.markExpired.mockResolvedValue({
        success: true,
      });

      // Act
      const result = await cartService.recoverAbandonedCart('token-abc123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Recovery link has expired');
      expect(mockAbandonedCartRepository.markExpired).toHaveBeenCalledWith(expiredCart.id);
    });

    it('should allow recovery for cart abandoned less than 30 days ago', async () => {
      // Arrange
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      const recentCart: AbandonedCart = {
        ...mockAbandonedCart,
        abandonedAt: recentDate,
      };

      mockAbandonedCartRepository.findByRecoveryToken.mockResolvedValue({
        success: true,
        data: recentCart,
      });

      // Act
      const result = await cartService.recoverAbandonedCart('token-abc123');

      // Assert
      expect(result.success).toBe(true);
      expect(mockAbandonedCartRepository.markExpired).not.toHaveBeenCalled();
    });

    it('should handle recovery at exactly 30 days', async () => {
      // Arrange
      const exactDate = new Date();
      exactDate.setDate(exactDate.getDate() - 30); // Exactly 30 days ago

      const exactCart: AbandonedCart = {
        ...mockAbandonedCart,
        abandonedAt: exactDate,
      };

      mockAbandonedCartRepository.findByRecoveryToken.mockResolvedValue({
        success: true,
        data: exactCart,
      });

      // Act
      const result = await cartService.recoverAbandonedCart('token-abc123');

      // Assert
      // Should allow recovery (not greater than 30)
      expect(result.success).toBe(true);
      expect(mockAbandonedCartRepository.markExpired).not.toHaveBeenCalled();
    });
  });
});
