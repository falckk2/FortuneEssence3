import { PaymentService } from '@/services/payment/PaymentService';
import type { PaymentData } from '@/interfaces';
import Stripe from 'stripe';

// Shared mock functions — all Stripe instances (PaymentService + processors) use the same mocks
const mockPaymentIntentsCreate = jest.fn();
const mockPaymentIntentsRetrieve = jest.fn();
const mockPaymentIntentsConfirm = jest.fn();
const mockRefundsCreate = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      retrieve: mockPaymentIntentsRetrieve,
      confirm: mockPaymentIntentsConfirm,
    },
    refunds: {
      create: mockRefundsCreate,
    },
  }));
});

// Mock config
jest.mock('@/config', () => ({
  config: {
    database: {
      supabaseUrl: 'https://test.supabase.co',
      supabasePublishableKey: 'test-key',
      supabaseSecretKey: 'test-secret',
    },
    payments: {
      stripe: {
        secretKey: 'sk_test_mock_key',
        publishableKey: 'pk_test_mock_key',
      },
      swish: {
        merchantId: 'swish_merchant_123',
      },
      klarna: {
        username: 'klarna_user',
        password: 'klarna_pass',
      },
    },
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({ from: jest.fn() })),
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    jest.clearAllMocks();
    paymentService = new PaymentService(new Stripe('sk_test_mock_key'));
  });

  describe('processPayment', () => {
    it('should process card payment successfully', async () => {
      const paymentData: PaymentData = {
        method: 'card',
        amount: 1000,
        currency: 'SEK',
        orderId: 'order-123',
        customerId: 'customer-123',
        metadata: {},
      };

      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_123',
        status: 'succeeded',
      });

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.data?.paymentId).toBe('pi_123');
      expect(result.data?.status).toBe('succeeded');
      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100000, // 1000 SEK in öre
          currency: 'sek',
          metadata: expect.objectContaining({
            orderId: 'order-123',
            customerId: 'customer-123',
          }),
        })
      );
    });

    it('should handle unsupported payment method', async () => {
      const paymentData: any = {
        method: 'unsupported',
        amount: 1000,
        currency: 'SEK',
        orderId: 'order-123',
        customerId: 'customer-123',
      };

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported payment method');
    });

    it('should handle Stripe errors', async () => {
      const paymentData: PaymentData = {
        method: 'card',
        amount: 1000,
        currency: 'SEK',
        orderId: 'order-123',
        customerId: 'customer-123',
        metadata: {},
      };

      mockPaymentIntentsCreate.mockRejectedValue(
        new Error('Stripe API error')
      );

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Stripe payment failed');
    });
  });

  describe('createSwishPayment', () => {
    it('should create Swish payment successfully', async () => {
      const result = await paymentService.createSwishPayment(
        500,
        '+46701234567',
        'Test payment'
      );

      expect(result.success).toBe(true);
      expect(result.data?.paymentId).toMatch(/^swish_/);
      expect(result.data?.status).toBe('pending');
      expect(result.data?.qrCode).toBeDefined();
      expect(result.data?.deepLink).toContain('swish://payment');
    });

    it('should validate Swedish phone number format', async () => {
      const result = await paymentService.createSwishPayment(
        500,
        'invalid-phone',
        'Test payment'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Swedish phone number format');
    });

    it('should accept phone numbers starting with 0', async () => {
      const result = await paymentService.createSwishPayment(
        500,
        '0701234567',
        'Test payment'
      );

      expect(result.success).toBe(true);
      expect(result.data?.paymentId).toBeDefined();
    });

    it('should accept phone numbers starting with +46', async () => {
      const result = await paymentService.createSwishPayment(
        500,
        '+46701234567',
        'Test payment'
      );

      expect(result.success).toBe(true);
      expect(result.data?.paymentId).toBeDefined();
    });
  });

  describe('processSwishPayment', () => {
    it('should process Swish payment', async () => {
      const paymentData: PaymentData = {
        method: 'swish',
        amount: 500,
        currency: 'SEK',
        orderId: 'order-123',
        customerId: 'customer-123',
        metadata: {
          phone: '+46701234567',
        },
      };

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pending');
      expect(result.data?.paymentId).toMatch(/^swish_/);
    });

    it('should handle missing customerId for Swish payment', async () => {
      const paymentData: PaymentData = {
        method: 'swish',
        amount: 500,
        currency: 'SEK',
        orderId: 'order-123',
        customerId: '',
        metadata: {},
      };

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Swish payment failed');
    });
  });

  describe('refundPayment', () => {
    it('should refund Stripe payment successfully', async () => {
      mockRefundsCreate.mockResolvedValue({
        id: 'ref_123',
        status: 'succeeded',
      });

      const result = await paymentService.refundPayment('pi_123', 500);

      expect(result.success).toBe(true);
      expect(result.data).toBe('ref_123');
    });

    it('should handle refund errors', async () => {
      mockRefundsCreate.mockRejectedValue(new Error('Refund failed'));

      const result = await paymentService.refundPayment('pi_123', 500);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Refund failed');
    });
  });

  describe('verifyPayment', () => {
    it('should verify successful payment', async () => {
      mockPaymentIntentsRetrieve.mockResolvedValue({
        id: 'pi_123',
        status: 'succeeded',
      });

      const result = await paymentService.verifyPayment('pi_123', 'card');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for pending payment', async () => {
      mockPaymentIntentsRetrieve.mockResolvedValue({
        id: 'pi_123',
        status: 'processing',
      });

      const result = await paymentService.verifyPayment('pi_123', 'card');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should handle verification errors', async () => {
      mockPaymentIntentsRetrieve.mockRejectedValue(
        new Error('Payment not found')
      );

      const result = await paymentService.verifyPayment('invalid_pi', 'card');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment verification failed');
    });
  });
});
