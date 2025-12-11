import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cart/recover/route';
import type { ICartService } from '@/interfaces';
import { TOKENS } from '@/config/di-container';
import { container } from 'tsyringe';
import { mockCartItems } from '../helpers/testData';

// Mock the DI container
jest.mock('tsyringe', () => ({
  container: {
    resolve: jest.fn(),
  },
}));

describe('Cart Recovery API Endpoint', () => {
  let mockCartService: jest.Mocked<ICartService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCartService = {
      recoverAbandonedCart: jest.fn(),
      trackAbandonedCart: jest.fn(),
      getAbandonedCartsForReminder: jest.fn(),
      markCartReminded: jest.fn(),
      markCartRecovered: jest.fn(),
      getCart: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      calculateTotal: jest.fn(),
      validateCartItems: jest.fn(),
      syncCartPrices: jest.fn(),
      mergeGuestCart: jest.fn(),
      getCartSummary: jest.fn(),
    } as any;

    (container.resolve as jest.Mock).mockReturnValue(mockCartService);
  });

  describe('GET /api/cart/recover', () => {
    it('should recover cart with valid token', async () => {
      // Arrange
      const validToken = 'valid-token-abc123';
      const mockCartData = {
        cartId: 'cart-123',
        items: mockCartItems,
        total: 749.48,
        email: 'customer@example.com',
      };

      mockCartService.recoverAbandonedCart.mockResolvedValue({
        success: true,
        data: mockCartData,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/cart/recover?token=${validToken}`
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cartId).toBe('cart-123');
      expect(data.data.items).toEqual(mockCartItems);
      expect(data.data.total).toBe(749.48);
      expect(data.data.email).toBe('customer@example.com');

      expect(mockCartService.recoverAbandonedCart).toHaveBeenCalledWith(validToken);
    });

    it('should return 400 when token is missing', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/cart/recover');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Recovery token is required');

      expect(mockCartService.recoverAbandonedCart).not.toHaveBeenCalled();
    });

    it('should return 404 when token is invalid', async () => {
      // Arrange
      const invalidToken = 'invalid-token';

      mockCartService.recoverAbandonedCart.mockResolvedValue({
        success: false,
        error: 'Invalid or expired recovery link',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/cart/recover?token=${invalidToken}`
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid or expired recovery link');
    });

    it('should return 404 when cart has expired', async () => {
      // Arrange
      const expiredToken = 'expired-token';

      mockCartService.recoverAbandonedCart.mockResolvedValue({
        success: false,
        error: 'Recovery link has expired',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/cart/recover?token=${expiredToken}`
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Recovery link has expired');
    });

    it('should return 500 on service errors', async () => {
      // Arrange
      mockCartService.recoverAbandonedCart.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cart/recover?token=some-token'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      mockCartService.recoverAbandonedCart.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/cart/recover?token=some-token'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to recover cart');
    });
  });

  describe('POST /api/cart/recover', () => {
    it('should recover cart with token in body', async () => {
      // Arrange
      const validToken = 'valid-token-abc123';
      const mockCartData = {
        cartId: 'cart-123',
        items: mockCartItems,
        total: 749.48,
        email: 'customer@example.com',
      };

      mockCartService.recoverAbandonedCart.mockResolvedValue({
        success: true,
        data: mockCartData,
      });

      const request = new NextRequest('http://localhost:3000/api/cart/recover', {
        method: 'POST',
        body: JSON.stringify({ token: validToken }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cartId).toBe('cart-123');

      expect(mockCartService.recoverAbandonedCart).toHaveBeenCalledWith(validToken);
    });

    it('should return 400 when token is missing from body', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/cart/recover', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Recovery token is required');
    });

    it('should return 404 for invalid token in body', async () => {
      // Arrange
      mockCartService.recoverAbandonedCart.mockResolvedValue({
        success: false,
        error: 'Invalid or expired recovery link',
      });

      const request = new NextRequest('http://localhost:3000/api/cart/recover', {
        method: 'POST',
        body: JSON.stringify({ token: 'invalid-token' }),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('Logging', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should log recovery attempts', async () => {
      // Arrange
      mockCartService.recoverAbandonedCart.mockResolvedValue({
        success: true,
        data: {
          cartId: 'cart-123',
          items: mockCartItems,
          total: 749.48,
          email: 'test@example.com',
        },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cart/recover?token=test-token'
      );

      // Act
      await GET(request);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Cart Recovery] Attempting to recover cart')
      );
    });

    it('should log successful recoveries', async () => {
      // Arrange
      mockCartService.recoverAbandonedCart.mockResolvedValue({
        success: true,
        data: {
          cartId: 'cart-123',
          items: mockCartItems,
          total: 749.48,
          email: 'test@example.com',
        },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cart/recover?token=test-token'
      );

      // Act
      await GET(request);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Cart Recovery] Successfully recovered cart')
      );
    });
  });

  describe('Error Logging', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log recovery failures', async () => {
      // Arrange
      mockCartService.recoverAbandonedCart.mockResolvedValue({
        success: false,
        error: 'Cart not found',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cart/recover?token=invalid-token'
      );

      // Act
      await GET(request);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Cart Recovery] Failed to recover cart:',
        'Cart not found'
      );
    });

    it('should log unexpected errors', async () => {
      // Arrange
      mockCartService.recoverAbandonedCart.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/cart/recover?token=test-token'
      );

      // Act
      await GET(request);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Cart Recovery] Unexpected error:',
        expect.any(Error)
      );
    });
  });
});
