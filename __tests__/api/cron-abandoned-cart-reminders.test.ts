import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/send-abandoned-cart-reminders/route';
import type { ICartService, IEmailService, IProductService } from '@/interfaces';
import { container } from 'tsyringe';
import { mockAbandonedCart, mockCartItems, mockProduct } from '../helpers/testData';

// Mock the DI container
jest.mock('tsyringe', () => ({
  container: {
    resolve: jest.fn(),
  },
}));

describe('Abandoned Cart Reminders Cron Job', () => {
  let mockCartService: jest.Mocked<ICartService>;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockProductService: jest.Mocked<IProductService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCartService = {
      getAbandonedCartsForReminder: jest.fn(),
      markCartReminded: jest.fn(),
      recoverAbandonedCart: jest.fn(),
      trackAbandonedCart: jest.fn(),
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

    mockEmailService = {
      sendEmail: jest.fn(),
      sendTemplateEmail: jest.fn(),
      sendOrderConfirmation: jest.fn(),
      sendPasswordReset: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendNewsletterWelcome: jest.fn(),
      sendContactFormConfirmation: jest.fn(),
      sendOrderStatusUpdate: jest.fn(),
      sendAbandonedCartRecovery: jest.fn(),
    } as any;

    mockProductService = {
      getProduct: jest.fn(),
      getProducts: jest.fn(),
      searchProducts: jest.fn(),
      getProductsByCategory: jest.fn(),
      getFeaturedProducts: jest.fn(),
      getProductWithLocalization: jest.fn(),
      getProductCategories: jest.fn(),
    } as any;

    (container.resolve as jest.Mock).mockImplementation((token) => {
      if (token.toString().includes('ICartService')) return mockCartService;
      if (token.toString().includes('IEmailService')) return mockEmailService;
      if (token.toString().includes('IProductService')) return mockProductService;
      return null;
    });
  });

  describe('Security', () => {
    it('should require authorization header with cron secret', async () => {
      // Arrange
      process.env.CRON_SECRET = 'test-secret';
      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');

      delete process.env.CRON_SECRET;
    });

    it('should accept request with valid cron secret', async () => {
      // Arrange
      process.env.CRON_SECRET = 'test-secret';
      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/cron/send-abandoned-cart-reminders',
        {
          headers: {
            authorization: 'Bearer test-secret',
          },
        }
      );

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);

      delete process.env.CRON_SECRET;
    });

    it('should reject request with invalid cron secret', async () => {
      // Arrange
      process.env.CRON_SECRET = 'correct-secret';
      const request = new NextRequest(
        'http://localhost:3000/api/cron/send-abandoned-cart-reminders',
        {
          headers: {
            authorization: 'Bearer wrong-secret',
          },
        }
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');

      delete process.env.CRON_SECRET;
    });
  });

  describe('Cron Job Execution', () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET; // No auth required for these tests
    });

    it('should return success when no abandoned carts found', async () => {
      // Arrange
      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: [],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('No abandoned carts to remind');
      expect(data.remindersSent).toBe(0);
    });

    it('should process abandoned carts and send reminder emails', async () => {
      // Arrange
      const abandonedCarts = [
        { ...mockAbandonedCart, id: 'cart-1', email: 'customer1@test.com' },
        { ...mockAbandonedCart, id: 'cart-2', email: 'customer2@test.com' },
      ];

      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: abandonedCarts,
      });

      mockProductService.getProduct.mockResolvedValue({
        success: true,
        data: mockProduct,
      });

      mockEmailService.sendAbandonedCartRecovery.mockResolvedValue({
        success: true,
        data: { messageId: 'msg-123' },
      });

      mockCartService.markCartReminded.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.remindersSent).toBe(2);
      expect(data.totalProcessed).toBe(2);

      expect(mockEmailService.sendAbandonedCartRecovery).toHaveBeenCalledTimes(2);
      expect(mockCartService.markCartReminded).toHaveBeenCalledTimes(2);
    });

    it('should enrich cart items with product names', async () => {
      // Arrange
      const abandonedCart = {
        ...mockAbandonedCart,
        items: [
          { productId: 'prod-1', quantity: 2, price: 299.99 },
        ],
      };

      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: [abandonedCart],
      });

      mockProductService.getProduct.mockResolvedValue({
        success: true,
        data: { ...mockProduct, id: 'prod-1', name: 'Lavender Oil' },
      });

      mockEmailService.sendAbandonedCartRecovery.mockResolvedValue({
        success: true,
        data: { messageId: 'msg-123' },
      });

      mockCartService.markCartReminded.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      await GET(request);

      // Assert
      expect(mockEmailService.sendAbandonedCartRecovery).toHaveBeenCalledWith(
        abandonedCart.email,
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'Lavender Oil',
              quantity: 2,
              price: 299.99,
            }),
          ]),
        }),
        'sv'
      );
    });

    it('should handle product not found gracefully', async () => {
      // Arrange
      const abandonedCart = {
        ...mockAbandonedCart,
        items: [
          { productId: 'nonexistent-prod', quantity: 1, price: 99.99 },
        ],
      };

      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: [abandonedCart],
      });

      mockProductService.getProduct.mockResolvedValue({
        success: false,
        error: 'Product not found',
      });

      mockEmailService.sendAbandonedCartRecovery.mockResolvedValue({
        success: true,
        data: { messageId: 'msg-123' },
      });

      mockCartService.markCartReminded.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      await GET(request);

      // Assert
      expect(mockEmailService.sendAbandonedCartRecovery).toHaveBeenCalledWith(
        abandonedCart.email,
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'Product nonexistent-prod', // Fallback name
            }),
          ]),
        }),
        'sv'
      );
    });

    it('should continue processing if one email fails', async () => {
      // Arrange
      const abandonedCarts = [
        { ...mockAbandonedCart, id: 'cart-1', email: 'customer1@test.com' },
        { ...mockAbandonedCart, id: 'cart-2', email: 'customer2@test.com' },
        { ...mockAbandonedCart, id: 'cart-3', email: 'customer3@test.com' },
      ];

      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: abandonedCarts,
      });

      mockProductService.getProduct.mockResolvedValue({
        success: true,
        data: mockProduct,
      });

      // Second email fails
      mockEmailService.sendAbandonedCartRecovery
        .mockResolvedValueOnce({ success: true, data: { messageId: 'msg-1' } })
        .mockResolvedValueOnce({ success: false, error: 'Email service error' })
        .mockResolvedValueOnce({ success: true, data: { messageId: 'msg-3' } });

      mockCartService.markCartReminded.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.remindersSent).toBe(2);
      expect(data.remindersFailed).toBe(1);
      expect(data.errors).toHaveLength(1);
    });

    it('should continue if marking as reminded fails', async () => {
      // Arrange
      const abandonedCart = mockAbandonedCart;

      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: [abandonedCart],
      });

      mockProductService.getProduct.mockResolvedValue({
        success: true,
        data: mockProduct,
      });

      mockEmailService.sendAbandonedCartRecovery.mockResolvedValue({
        success: true,
        data: { messageId: 'msg-123' },
      });

      mockCartService.markCartReminded.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      // Should still count as sent since email succeeded
      expect(data.remindersSent).toBe(1);
      expect(data.errors).toHaveLength(1);
    });

    it('should send emails in Swedish by default', async () => {
      // Arrange
      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: [mockAbandonedCart],
      });

      mockProductService.getProduct.mockResolvedValue({
        success: true,
        data: mockProduct,
      });

      mockEmailService.sendAbandonedCartRecovery.mockResolvedValue({
        success: true,
        data: { messageId: 'msg-123' },
      });

      mockCartService.markCartReminded.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      await GET(request);

      // Assert
      expect(mockEmailService.sendAbandonedCartRecovery).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        'sv' // Swedish locale
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
    });

    it('should return error when getAbandonedCartsForReminder fails', async () => {
      // Arrange
      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Database connection failed');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      mockCartService.getAbandonedCartsForReminder.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unexpected error');
    });
  });

  describe('Logging', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      delete process.env.CRON_SECRET;
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log job start', async () => {
      // Arrange
      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: [],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      await GET(request);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Abandoned Cart Cron] Starting abandoned cart reminder job...'
      );
    });

    it('should log found abandoned carts count', async () => {
      // Arrange
      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: [mockAbandonedCart, mockAbandonedCart],
      });

      mockProductService.getProduct.mockResolvedValue({
        success: true,
        data: mockProduct,
      });

      mockEmailService.sendAbandonedCartRecovery.mockResolvedValue({
        success: true,
        data: { messageId: 'msg-123' },
      });

      mockCartService.markCartReminded.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      await GET(request);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Abandoned Cart Cron] Found 2 abandoned carts to remind'
      );
    });

    it('should log job completion', async () => {
      // Arrange
      mockCartService.getAbandonedCartsForReminder.mockResolvedValue({
        success: true,
        data: [mockAbandonedCart],
      });

      mockProductService.getProduct.mockResolvedValue({
        success: true,
        data: mockProduct,
      });

      mockEmailService.sendAbandonedCartRecovery.mockResolvedValue({
        success: true,
        data: { messageId: 'msg-123' },
      });

      mockCartService.markCartReminded.mockResolvedValue({
        success: true,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-abandoned-cart-reminders');

      // Act
      await GET(request);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Abandoned Cart Cron] Job completed. Sent: 1, Failed: 0'
      );
    });
  });
});
