// Swish Payment Provider Implementation
// Following Open/Closed Principle - implements IPaymentProvider interface

import { injectable } from 'tsyringe';
import { BasePaymentProvider, PaymentData, PaymentResult } from '../IPaymentProvider';
import { ApiResponse } from '@/types';
import https from 'https';
import fs from 'fs';
import { config } from '@/config';

/**
 * SwishPaymentProvider - Handles Swish mobile payment integration
 *
 * Swish is the most popular mobile payment method in Sweden.
 * This provider integrates with Swish API v2 to process payments, verify status, and handle refunds.
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Handles only Swish-specific payment operations
 * - Open/Closed: Extends BasePaymentProvider without modifying it
 * - Liskov Substitution: Can be used anywhere IPaymentProvider is expected
 * - Dependency Inversion: Depends on config abstraction, not concrete implementations
 */

interface SwishPaymentRequest {
  payeePaymentReference: string;
  callbackUrl: string;
  payerAlias: string;
  payeeAlias: string;
  amount: string;
  currency: string;
  message: string;
}

interface SwishPaymentResponse {
  id?: string;
  location?: string;
  paymentRequestToken?: string;
}

interface SwishPaymentStatus {
  id: string;
  status: 'CREATED' | 'PAID' | 'DECLINED' | 'ERROR' | 'CANCELLED';
  amount?: string;
  currency?: string;
  dateCreated?: string;
  datePaid?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface SwishRefundRequest {
  originalPaymentReference: string;
  callbackUrl: string;
  payerAlias: string;
  amount: string;
  currency: string;
  message: string;
}

@injectable()
export class SwishPaymentProvider extends BasePaymentProvider {
  readonly name = 'Swish';
  readonly supportedCurrencies = ['SEK'];
  readonly supportedCountries = ['SE'];

  private httpsAgent: https.Agent | null = null;
  private readonly merchantId: string;
  private readonly testMode: boolean;
  private readonly baseUrl: string;

  constructor() {
    super();
    this.merchantId = config.payments.swish.merchantId;
    this.testMode = config.payments.swish.testMode;
    this.baseUrl = this.testMode
      ? 'https://mss.cpc.getswish.net/swish-cpcapi'
      : 'https://cpc.getswish.net/swish-cpcapi';

    this.initializeHttpsAgent();
  }

  /**
   * Initialize HTTPS agent with client certificates for Swish API
   * Gracefully handles missing certificates in development mode
   */
  private initializeHttpsAgent(): void {
    try {
      const certPath = config.payments.swish.certificatePath;
      const keyPath = config.payments.swish.privateKeyPath;

      if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        const cert = fs.readFileSync(certPath);
        const key = fs.readFileSync(keyPath);

        this.httpsAgent = new https.Agent({
          cert,
          key,
          rejectUnauthorized: !this.testMode,
        });

        console.log('Swish HTTPS agent initialized successfully');
      } else {
        if (this.testMode) {
          console.warn('Swish certificates not found. Running in development mode without real API access.');
        }
      }
    } catch (error) {
      if (this.testMode) {
        console.warn(`Failed to initialize Swish HTTPS agent: ${error}. Running in development mode.`);
      }
    }
  }

  async processPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      // Validate payment data
      const validationError = this.validatePaymentData(paymentData);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Swish requires a phone number in metadata
      if (!paymentData.metadata?.phone) {
        return {
          success: false,
          error: 'Phone number is required for Swish payments',
        };
      }

      // Validate merchant ID configuration
      if (!this.merchantId) {
        return {
          success: false,
          error: 'Swish merchant ID is not configured',
        };
      }

      // Format Swedish phone number
      const formattedPhone = this.formatSwedishPhoneNumber(paymentData.metadata.phone);
      if (!formattedPhone) {
        return {
          success: false,
          error: 'Invalid Swedish phone number format',
        };
      }

      // If certificates are not available, return mock response for development
      if (!this.httpsAgent && this.testMode) {
        return this.createMockPaymentResponse(paymentData);
      }

      // Create Swish payment request
      const paymentRequest: SwishPaymentRequest = {
        payeePaymentReference: paymentData.orderId,
        callbackUrl: `${config.app.url}/api/webhooks/swish`,
        payerAlias: formattedPhone,
        payeeAlias: this.merchantId,
        amount: paymentData.amount.toFixed(2),
        currency: 'SEK',
        message: (paymentData.metadata?.message || `Order ${paymentData.orderId}`).substring(0, 50),
      };

      // Make request to Swish API
      const response = await this.makeSwishRequest<SwishPaymentResponse>(
        '/api/v2/paymentrequests',
        'POST',
        paymentRequest
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to create Swish payment',
        };
      }

      const paymentId = response.data.id || response.data.location?.split('/').pop() || paymentData.orderId;
      const token = response.data.paymentRequestToken || paymentId;

      // Generate QR code data and deep link
      const qrCode = this.generateSwishQRData(token);
      const deepLink = `swish://paymentrequest?token=${token}`;

      return {
        success: true,
        data: {
          paymentId,
          status: 'pending',
          qrCode,
          deepLink,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Swish payment failed: ${error}`,
      };
    }
  }

  async verifyPayment(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      // If running in development mode without certificates, return mock response
      if (!this.httpsAgent && this.testMode) {
        // Simulate 90% success rate in development
        return {
          success: true,
          data: Math.random() > 0.1,
        };
      }

      // Get payment status from Swish API
      const status = await this.getPaymentStatus(paymentId);

      if (!status.success || !status.data) {
        return {
          success: false,
          error: status.error || 'Failed to get payment status',
        };
      }

      // Check if payment is completed
      const isPaid = status.data.status === 'PAID';

      return {
        success: true,
        data: isPaid,
      };
    } catch (error) {
      return {
        success: false,
        error: `Swish payment verification failed: ${error}`,
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<void>> {
    try {
      // If running in development mode without certificates, return mock response
      if (!this.httpsAgent && this.testMode) {
        return {
          success: true,
        };
      }

      // Get original payment details to determine refund amount
      const paymentStatus = await this.getPaymentStatus(paymentId);

      if (!paymentStatus.success || !paymentStatus.data) {
        return {
          success: false,
          error: 'Original payment not found',
        };
      }

      if (paymentStatus.data.status !== 'PAID') {
        return {
          success: false,
          error: 'Original payment was not completed',
        };
      }

      const refundAmount = amount || parseFloat(paymentStatus.data.amount || '0');

      // Create refund request
      const refundRequest: SwishRefundRequest = {
        originalPaymentReference: paymentId,
        callbackUrl: `${config.app.url}/api/webhooks/swish-refund`,
        payerAlias: this.merchantId,
        amount: refundAmount.toFixed(2),
        currency: 'SEK',
        message: 'Återbetalning'.substring(0, 50),
      };

      // Make refund request to Swish API
      const response = await this.makeSwishRequest<SwishPaymentResponse>(
        '/api/v2/refunds',
        'POST',
        refundRequest
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to create Swish refund',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Swish refund failed: ${error}`,
      };
    }
  }

  /**
   * Get payment status from Swish API
   */
  async getPaymentStatus(paymentId: string): Promise<ApiResponse<SwishPaymentStatus>> {
    try {
      const response = await this.makeSwishRequest<SwishPaymentStatus>(
        `/api/v2/paymentrequests/${paymentId}`,
        'GET'
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get payment status: ${error}`,
      };
    }
  }

  /**
   * Format Swedish phone number to Swish format (46XXXXXXXXX)
   * Accepts formats: +46XXXXXXXXX, 46XXXXXXXXX, 0XXXXXXXXX
   */
  private formatSwedishPhoneNumber(phoneNumber: string): string | null {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('46')) {
      // Already in 46XXXXXXXXX format
      if (cleaned.length >= 11 && cleaned.length <= 12) {
        return cleaned;
      }
    } else if (cleaned.startsWith('0')) {
      // Convert 0XXXXXXXXX to 46XXXXXXXXX
      const withoutLeadingZero = cleaned.substring(1);
      if (withoutLeadingZero.length >= 9 && withoutLeadingZero.length <= 10) {
        return '46' + withoutLeadingZero;
      }
    }

    // Invalid format
    return null;
  }

  /**
   * Generate Swish QR code data
   * Creates a URL that can be used to generate a QR code for Swish payments
   */
  private generateSwishQRData(token: string): string {
    // Swish QR code format
    const qrData = `swish://paymentrequest?token=${token}&callbackurl=${encodeURIComponent(config.app.url)}`;

    // Return URL to QR code generator service
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  }

  /**
   * Make authenticated HTTPS request to Swish API
   * Uses client certificates for authentication
   */
  private async makeSwishRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      if (!this.httpsAgent) {
        resolve({
          success: false,
          error: 'Swish HTTPS agent not initialized (certificates missing)',
        });
        return;
      }

      const url = `${this.baseUrl}${endpoint}`;
      const body = data ? JSON.stringify(data) : undefined;

      const options: https.RequestOptions = {
        method,
        agent: this.httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(body && { 'Content-Length': Buffer.byteLength(body) }),
        },
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            // Swish returns 201 for successful payment creation with Location header
            if (res.statusCode === 201) {
              const location = res.headers['location'] || '';
              const id = location.split('/').pop() || '';

              resolve({
                success: true,
                data: { id, location } as T,
              });
              return;
            }

            // 200 OK with JSON body
            if (res.statusCode === 200) {
              const parsedData = responseData ? JSON.parse(responseData) : {};
              resolve({
                success: true,
                data: parsedData as T,
              });
              return;
            }

            // Error responses
            resolve({
              success: false,
              error: `Swish API error: ${res.statusCode} - ${responseData}`,
            });
          } catch (error) {
            resolve({
              success: false,
              error: `Failed to parse Swish API response: ${error}`,
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Swish API request failed: ${error.message}`,
        });
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  /**
   * Create mock payment response for development
   * Used when Swish certificates are not available
   */
  private createMockPaymentResponse(paymentData: PaymentData): ApiResponse<PaymentResult> {
    const paymentId = `swish_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const token = `token_${paymentData.orderId}`;
    const qrCode = this.generateSwishQRData(token);
    const deepLink = `swish://paymentrequest?token=${token}`;

    return {
      success: true,
      data: {
        paymentId,
        status: 'pending',
        qrCode,
        deepLink,
      },
    };
  }
}
