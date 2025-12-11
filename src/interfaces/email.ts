import { ApiResponse } from '@/types';

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<ApiResponse<{ messageId: string }>>;
  sendTemplateEmail(
    to: string | string[],
    template: EmailTemplate,
    data: Record<string, any>
  ): Promise<ApiResponse<{ messageId: string }>>;
  sendOrderConfirmation(
    email: string,
    orderData: {
      orderId: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      total: number;
      shippingAddress: string;
    },
    locale?: 'sv' | 'en'
  ): Promise<ApiResponse<{ messageId: string }>>;
  sendPasswordReset(
    email: string,
    resetToken: string,
    locale?: 'sv' | 'en'
  ): Promise<ApiResponse<{ messageId: string }>>;
  sendWelcomeEmail(
    email: string,
    firstName: string,
    locale?: 'sv' | 'en'
  ): Promise<ApiResponse<{ messageId: string }>>;
  sendNewsletterWelcome(
    email: string,
    discountCode?: string,
    locale?: 'sv' | 'en'
  ): Promise<ApiResponse<{ messageId: string }>>;
  sendContactFormConfirmation(
    email: string,
    name: string,
    locale?: 'sv' | 'en'
  ): Promise<ApiResponse<{ messageId: string }>>;
  sendOrderStatusUpdate(
    email: string,
    orderData: {
      orderId: string;
      status: string;
      trackingNumber?: string;
    },
    locale?: 'sv' | 'en'
  ): Promise<ApiResponse<{ messageId: string }>>;
  sendAbandonedCartRecovery(
    email: string,
    cartData: {
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
      total: number;
      recoveryToken: string;
    },
    locale?: 'sv' | 'en'
  ): Promise<ApiResponse<{ messageId: string }>>;
}
