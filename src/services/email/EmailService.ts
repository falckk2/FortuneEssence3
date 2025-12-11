import { injectable } from 'tsyringe';
import type { IEmailService } from '@/interfaces/email';
import { EmailOptions, EmailTemplate } from '@/interfaces/email';
import { ApiResponse } from '@/types';
import { config } from '@/config';

@injectable()
export class EmailService implements IEmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private baseUrl = 'https://api.resend.com/emails';

  constructor() {
    this.apiKey = config.email.resendApiKey || process.env.RESEND_API_KEY || '';
    this.fromEmail = config.email.fromEmail || 'noreply@fortuneessence.se';
    this.fromName = config.email.fromName || 'Fortune Essence';
  }

  async sendEmail(options: EmailOptions): Promise<ApiResponse<{ messageId: string }>> {
    try {
      if (!this.apiKey) {
        console.error('Email API key not configured');
        return {
          success: false,
          error: 'Email service not configured',
        };
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from || `${this.fromName} <${this.fromEmail}>`,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
          cc: options.cc,
          bcc: options.bcc,
          attachments: options.attachments,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Email send failed:', error);
        return {
          success: false,
          error: `Failed to send email: ${error}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        data: { messageId: result.id },
      };
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: `Email service error: ${error}`,
      };
    }
  }

  async sendTemplateEmail(
    to: string | string[],
    template: EmailTemplate,
    data: Record<string, any>
  ): Promise<ApiResponse<{ messageId: string }>> {
    // Simple template variable replacement
    let html = template.html;
    let text = template.text;
    let subject = template.subject;

    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(data[key]));
      text = text.replace(regex, String(data[key]));
      subject = subject.replace(regex, String(data[key]));
    });

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  async sendOrderConfirmation(
    email: string,
    orderData: {
      orderId: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      total: number;
      shippingAddress: string;
    },
    locale: 'sv' | 'en' = 'sv'
  ): Promise<ApiResponse<{ messageId: string }>> {
    const isSwedish = locale === 'sv';

    const itemsHtml = orderData.items
      .map(
        item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} SEK</td>
        </tr>
      `
      )
      .join('');

    const subject = isSwedish
      ? `Orderbekräftelse - ${orderData.orderId}`
      : `Order Confirmation - ${orderData.orderId}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total { font-size: 18px; font-weight: bold; text-align: right; padding: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fortune Essence</h1>
          </div>
          <div class="content">
            <h2>${isSwedish ? 'Tack för din beställning!' : 'Thank you for your order!'}</h2>
            <p>${isSwedish ? 'Hej' : 'Hi'} ${orderData.customerName},</p>
            <p>
              ${isSwedish
                ? 'Vi har mottagit din beställning och börjar förbereda den för leverans.'
                : 'We have received your order and are preparing it for delivery.'}
            </p>

            <h3>${isSwedish ? 'Orderdetaljer' : 'Order Details'}</h3>
            <p><strong>${isSwedish ? 'Ordernummer' : 'Order Number'}:</strong> ${orderData.orderId}</p>

            <table>
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">${isSwedish ? 'Produkt' : 'Product'}</th>
                  <th style="padding: 10px; text-align: center;">${isSwedish ? 'Antal' : 'Quantity'}</th>
                  <th style="padding: 10px; text-align: right;">${isSwedish ? 'Pris' : 'Price'}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total">
              ${isSwedish ? 'Totalt' : 'Total'}: ${orderData.total.toFixed(2)} SEK
            </div>

            <h3>${isSwedish ? 'Leveransadress' : 'Shipping Address'}</h3>
            <p>${orderData.shippingAddress.replace(/\n/g, '<br>')}</p>

            <p>
              ${isSwedish
                ? 'Du kommer att få ett spårningsnummer via e-post när din order har skickats.'
                : 'You will receive a tracking number via email when your order has been shipped.'}
            </p>
          </div>
          <div class="footer">
            <p>Fortune Essence | www.fortuneessence.se</p>
            <p>${isSwedish ? 'Frågor? Kontakta oss på' : 'Questions? Contact us at'} support@fortuneessence.se</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `${subject}\n\n${isSwedish ? 'Tack för din beställning!' : 'Thank you for your order!'}\n\nOrder: ${orderData.orderId}\nTotal: ${orderData.total} SEK`,
    });
  }

  async sendPasswordReset(
    email: string,
    resetToken: string,
    locale: 'sv' | 'en' = 'sv'
  ): Promise<ApiResponse<{ messageId: string }>> {
    const isSwedish = locale === 'sv';
    const resetUrl = `${config.app.url}/auth/reset-password?token=${resetToken}`;

    const subject = isSwedish ? 'Återställ ditt lösenord' : 'Reset Your Password';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${subject}</h2>
          <p>
            ${isSwedish
              ? 'Du har begärt att återställa ditt lösenord. Klicka på knappen nedan för att skapa ett nytt lösenord:'
              : 'You have requested to reset your password. Click the button below to create a new password:'}
          </p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">
              ${isSwedish ? 'Återställ lösenord' : 'Reset Password'}
            </a>
          </p>
          <p>
            ${isSwedish
              ? 'Eller kopiera och klistra in denna länk i din webbläsare:'
              : 'Or copy and paste this link into your browser:'}
          </p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px;">
            ${isSwedish
              ? 'Denna länk är giltig i 1 timme. Om du inte begärde denna återställning kan du ignorera detta e-postmeddelande.'
              : 'This link is valid for 1 hour. If you did not request this reset, you can ignore this email.'}
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `${subject}\n\n${resetUrl}\n\n${isSwedish ? 'Länken är giltig i 1 timme.' : 'This link is valid for 1 hour.'}`,
    });
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    locale: 'sv' | 'en' = 'sv'
  ): Promise<ApiResponse<{ messageId: string }>> {
    const isSwedish = locale === 'sv';

    const subject = isSwedish ? 'Välkommen till Fortune Essence!' : 'Welcome to Fortune Essence!';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fortune Essence</h1>
          </div>
          <div style="padding: 20px;">
            <h2>${subject}</h2>
            <p>${isSwedish ? 'Hej' : 'Hi'} ${firstName}!</p>
            <p>
              ${isSwedish
                ? 'Tack för att du skapade ett konto hos Fortune Essence. Vi är glada att ha dig som kund!'
                : 'Thank you for creating an account with Fortune Essence. We are happy to have you as a customer!'}
            </p>
            <p>
              ${isSwedish
                ? 'Utforska vårt sortiment av eteriska oljor och hitta din favorit.'
                : 'Explore our range of essential oils and find your favorite.'}
            </p>
            <p>
              <a href="${config.app.url}/products" style="color: #8B4513;">
                ${isSwedish ? 'Börja handla' : 'Start Shopping'}
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `${subject}\n\n${isSwedish ? 'Hej' : 'Hi'} ${firstName}!\n\n${isSwedish ? 'Tack för att du skapade ett konto!' : 'Thank you for creating an account!'}`,
    });
  }

  async sendNewsletterWelcome(
    email: string,
    discountCode?: string,
    locale: 'sv' | 'en' = 'sv'
  ): Promise<ApiResponse<{ messageId: string }>> {
    const isSwedish = locale === 'sv';

    const subject = isSwedish ? 'Välkommen till vårt nyhetsbrev!' : 'Welcome to our newsletter!';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .discount { background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .code { font-size: 24px; font-weight: bold; color: #8B4513; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${subject}</h2>
          <p>
            ${isSwedish
              ? 'Tack för att du prenumererar på vårt nyhetsbrev! Du kommer att få exklusiva erbjudanden och nyheter.'
              : 'Thank you for subscribing to our newsletter! You will receive exclusive offers and news.'}
          </p>
          ${discountCode ? `
            <div class="discount">
              <p>${isSwedish ? 'Som tack får du 10% rabatt på din första beställning!' : 'As a thank you, get 10% off your first order!'}</p>
              <p class="code">${discountCode}</p>
              <p style="font-size: 12px; color: #666;">
                ${isSwedish ? 'Använd denna kod i kassan' : 'Use this code at checkout'}
              </p>
            </div>
          ` : ''}
          <p>
            <a href="${config.app.url}/products" style="color: #8B4513;">
              ${isSwedish ? 'Handla nu' : 'Shop Now'}
            </a>
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `${subject}\n\n${discountCode ? `${isSwedish ? 'Rabattkod' : 'Discount code'}: ${discountCode}` : ''}`,
    });
  }

  async sendContactFormConfirmation(
    email: string,
    name: string,
    locale: 'sv' | 'en' = 'sv'
  ): Promise<ApiResponse<{ messageId: string }>> {
    const isSwedish = locale === 'sv';

    const subject = isSwedish
      ? 'Vi har mottagit ditt meddelande'
      : 'We have received your message';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${subject}</h2>
          <p>${isSwedish ? 'Hej' : 'Hi'} ${name}!</p>
          <p>
            ${isSwedish
              ? 'Tack för att du kontaktade oss. Vi har mottagit ditt meddelande och kommer att återkomma till dig inom 24 timmar.'
              : 'Thank you for contacting us. We have received your message and will get back to you within 24 hours.'}
          </p>
          <p>
            ${isSwedish ? 'Med vänliga hälsningar,' : 'Best regards,'}<br>
            Fortune Essence
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `${subject}\n\n${isSwedish ? 'Hej' : 'Hi'} ${name}!\n\n${isSwedish ? 'Tack för att du kontaktade oss.' : 'Thank you for contacting us.'}`,
    });
  }

  async sendOrderStatusUpdate(
    email: string,
    orderData: {
      orderId: string;
      status: string;
      trackingNumber?: string;
    },
    locale: 'sv' | 'en' = 'sv'
  ): Promise<ApiResponse<{ messageId: string }>> {
    const isSwedish = locale === 'sv';

    const statusMessages: Record<string, { sv: string; en: string }> = {
      confirmed: { sv: 'bekräftad', en: 'confirmed' },
      processing: { sv: 'behandlas', en: 'being processed' },
      shipped: { sv: 'skickad', en: 'shipped' },
      delivered: { sv: 'levererad', en: 'delivered' },
    };

    const statusText = statusMessages[orderData.status]?.[locale] || orderData.status;

    const subject = isSwedish
      ? `Din order ${orderData.orderId} har ${statusText}`
      : `Your order ${orderData.orderId} has been ${statusText}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .status { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${subject}</h2>
          <div class="status">
            <p><strong>${isSwedish ? 'Ordernummer' : 'Order Number'}:</strong> ${orderData.orderId}</p>
            <p><strong>${isSwedish ? 'Status' : 'Status'}:</strong> ${statusText}</p>
            ${orderData.trackingNumber ? `
              <p><strong>${isSwedish ? 'Spårningsnummer' : 'Tracking Number'}:</strong> ${orderData.trackingNumber}</p>
            ` : ''}
          </div>
          <p>
            <a href="${config.app.url}/account/orders/${orderData.orderId}" style="color: #8B4513;">
              ${isSwedish ? 'Visa orderdetaljer' : 'View Order Details'}
            </a>
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `${subject}\n\n${isSwedish ? 'Ordernummer' : 'Order Number'}: ${orderData.orderId}\n${orderData.trackingNumber ? `${isSwedish ? 'Spårningsnummer' : 'Tracking Number'}: ${orderData.trackingNumber}` : ''}`,
    });
  }

  async sendAbandonedCartRecovery(
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
    locale: 'sv' | 'en' = 'sv'
  ): Promise<ApiResponse<{ messageId: string }>> {
    const isSwedish = locale === 'sv';

    const subject = isSwedish
      ? 'Du har fortfarande produkter i din varukorg! 🛍️'
      : 'You still have items in your cart! 🛍️';

    const recoveryUrl = `${config.app.url}/cart/recover?token=${cartData.recoveryToken}`;

    // Calculate item count
    const itemCount = cartData.items.reduce((sum, item) => sum + item.quantity, 0);

    // Generate items list HTML
    const itemsHtml = cartData.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${item.price.toFixed(2)} kr
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .cart-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .cart-items th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
          .total { font-size: 18px; font-weight: bold; color: #8B4513; margin: 20px 0; }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .cta-button:hover { opacity: 0.9; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
          .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ ${isSwedish ? 'Din varukorg väntar!' : 'Your Cart is Waiting!'}</h1>
          </div>
          <div class="content">
            <p>${isSwedish ? 'Hej!' : 'Hello!'}</p>
            <p>
              ${isSwedish
                ? `Du lämnade ${itemCount} ${itemCount === 1 ? 'produkt' : 'produkter'} i din varukorg. Vi har sparat ${itemCount === 1 ? 'den' : 'dem'} åt dig!`
                : `You left ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart. We've saved ${itemCount === 1 ? 'it' : 'them'} for you!`}
            </p>

            <div class="highlight">
              <strong>💡 ${isSwedish ? 'Visste du?' : 'Did you know?'}</strong>
              ${isSwedish
                ? 'Våra mest populära produkter brukar ta slut snabbt. Slutför din order nu för att säkra dina favoriter!'
                : 'Our most popular products tend to sell out quickly. Complete your order now to secure your favorites!'}
            </div>

            <h3>${isSwedish ? 'Dina produkter:' : 'Your Items:'}</h3>
            <table class="cart-items">
              <thead>
                <tr>
                  <th>${isSwedish ? 'Produkt' : 'Product'}</th>
                  <th style="text-align: center;">${isSwedish ? 'Antal' : 'Quantity'}</th>
                  <th style="text-align: right;">${isSwedish ? 'Pris' : 'Price'}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total">
              ${isSwedish ? 'Totalt' : 'Total'}: ${cartData.total.toFixed(2)} kr
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${recoveryUrl}" class="cta-button">
                ${isSwedish ? '🛒 Slutför ditt köp' : '🛒 Complete Your Purchase'}
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              ${isSwedish
                ? '✓ Fri frakt över 500 kr<br>✓ 30 dagars öppet köp<br>✓ Säkra betalningar'
                : '✓ Free shipping over 500 kr<br>✓ 30-day return policy<br>✓ Secure payments'}
            </p>

            <p style="margin-top: 30px;">
              ${isSwedish
                ? 'Har du några frågor? Kontakta oss gärna på <a href="mailto:support@fortuneessence.se">support@fortuneessence.se</a>'
                : 'Have any questions? Feel free to contact us at <a href="mailto:support@fortuneessence.se">support@fortuneessence.se</a>'}
            </p>

            <p>
              ${isSwedish ? 'Med vänliga hälsningar,' : 'Best regards,'}<br>
              <strong>Fortune Essence</strong>
            </p>
          </div>
          <div class="footer">
            <p>
              ${isSwedish
                ? 'Du får detta mail eftersom du har produkter i din varukorg hos Fortune Essence.'
                : 'You are receiving this email because you have items in your cart at Fortune Essence.'}
            </p>
            <p>
              Fortune Essence AB | Sweden<br>
              <a href="${config.app.url}" style="color: #8B4513;">fortuneessence.se</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const text = `
${isSwedish ? 'Din varukorg väntar!' : 'Your Cart is Waiting!'}

${isSwedish ? 'Hej!' : 'Hello!'}

${isSwedish
  ? `Du lämnade ${itemCount} ${itemCount === 1 ? 'produkt' : 'produkter'} i din varukorg.`
  : `You left ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart.`}

${isSwedish ? 'Dina produkter:' : 'Your Items:'}
${cartData.items.map(item => `- ${item.name} x${item.quantity} - ${item.price.toFixed(2)} kr`).join('\n')}

${isSwedish ? 'Totalt' : 'Total'}: ${cartData.total.toFixed(2)} kr

${isSwedish ? 'Slutför ditt köp här' : 'Complete your purchase here'}: ${recoveryUrl}

${isSwedish ? 'Med vänliga hälsningar,' : 'Best regards,'}
Fortune Essence
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }
}
