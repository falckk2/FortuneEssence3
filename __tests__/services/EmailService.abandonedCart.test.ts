import { EmailService } from '@/services/email/EmailService';

// Mock fetch globally
global.fetch = jest.fn();

describe('EmailService - Abandoned Cart Recovery Email', () => {
  let emailService: EmailService;
  const mockApiKey = 'test-api-key';
  const mockFromEmail = 'noreply@fortuneessence.se';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set environment variables
    process.env.RESEND_API_KEY = mockApiKey;
    process.env.EMAIL_FROM = mockFromEmail;

    // Create service instance
    emailService = new EmailService();
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  describe('sendAbandonedCartRecovery', () => {
    const mockCartData = {
      items: [
        { name: 'Lavender Oil', quantity: 2, price: 299.99 },
        { name: 'Diffuser', quantity: 1, price: 449.50 },
      ],
      total: 1049.48,
      recoveryToken: 'token-abc123',
    };

    it('should send abandoned cart recovery email successfully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        mockCartData,
        'sv'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.messageId).toBe('msg-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          }),
        })
      );

      // Verify email body
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.to).toEqual(['customer@example.com']);
      expect(requestBody.subject).toContain('varukorg'); // Swedish subject
      expect(requestBody.html).toContain('Lavender Oil');
      expect(requestBody.html).toContain('Diffuser');
      expect(requestBody.html).toContain('1049.48');
      expect(requestBody.html).toContain('token-abc123');
    });

    it('should send email in English when locale is en', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        mockCartData,
        'en'
      );

      // Assert
      expect(result.success).toBe(true);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.subject).toContain('cart'); // English subject
      expect(requestBody.subject).not.toContain('varukorg');
      expect(requestBody.html).toContain('Your Cart is Waiting');
    });

    it('should include all cart items in email', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const multiItemCart = {
        items: [
          { name: 'Item 1', quantity: 1, price: 100 },
          { name: 'Item 2', quantity: 2, price: 200 },
          { name: 'Item 3', quantity: 3, price: 300 },
        ],
        total: 1400,
        recoveryToken: 'token-xyz',
      };

      // Act
      await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        multiItemCart,
        'sv'
      );

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.html).toContain('Item 1');
      expect(requestBody.html).toContain('Item 2');
      expect(requestBody.html).toContain('Item 3');
    });

    it('should include recovery link with token', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        mockCartData,
        'sv'
      );

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.html).toContain('/cart/recover?token=token-abc123');
    });

    it('should calculate item count correctly', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const cartWith5Items = {
        items: [
          { name: 'Item 1', quantity: 2, price: 100 },
          { name: 'Item 2', quantity: 3, price: 200 },
        ],
        total: 800,
        recoveryToken: 'token-xyz',
      };

      // Act
      await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        cartWith5Items,
        'sv'
      );

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Should mention 5 items (2 + 3)
      expect(requestBody.html).toContain('5');
    });

    it('should handle single item cart correctly', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const singleItemCart = {
        items: [
          { name: 'Single Item', quantity: 1, price: 299.99 },
        ],
        total: 299.99,
        recoveryToken: 'token-single',
      };

      // Act
      await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        singleItemCart,
        'sv'
      );

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Should use singular form
      expect(requestBody.html).toContain('produkt'); // Singular in Swedish
    });

    it('should include plain text version', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        mockCartData,
        'sv'
      );

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.text).toBeDefined();
      expect(requestBody.text).toContain('Lavender Oil');
      expect(requestBody.text).toContain('1049.48');
      expect(requestBody.text).toContain('token-abc123');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        text: async () => 'API Error: Invalid API key',
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        mockCartData,
        'sv'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to send email');
      expect(result.data).toBeUndefined();
    });

    it('should handle network errors', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        mockCartData,
        'sv'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Email service error');
    });

    it('should format prices with 2 decimal places', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const cartWithDecimals = {
        items: [
          { name: 'Item', quantity: 1, price: 99.9 },
        ],
        total: 99.9,
        recoveryToken: 'token',
      };

      // Act
      await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        cartWithDecimals,
        'sv'
      );

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.html).toContain('99.90'); // Should have 2 decimals
    });

    it('should use correct sender email', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        mockCartData,
        'sv'
      );

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.from).toContain(mockFromEmail);
    });

    it('should include branding and footer', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'msg-123' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await emailService.sendAbandonedCartRecovery(
        'customer@example.com',
        mockCartData,
        'sv'
      );

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.html).toContain('Fortune Essence');
      expect(requestBody.html).toContain('fortuneessence.se');
    });
  });
});
