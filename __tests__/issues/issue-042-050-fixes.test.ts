import fs from 'fs';
import path from 'path';
import { escapeHtml } from '@/utils/escapeHtml';

const root = path.join(__dirname, '..', '..');

describe('ISSUE-042 through ISSUE-050 fixes', () => {
  it('ISSUE-042: OrderService resolves catalog prices before totals', () => {
    const source = fs.readFileSync(
      path.join(root, 'src/services/orders/OrderService.ts'),
      'utf8'
    );
    expect(source).toContain('resolveCatalogPrices');
    expect(source).toContain('Price mismatch for product');
  });

  it('ISSUE-043: checkout admin email escapes user-supplied fields', () => {
    const source = fs.readFileSync(
      path.join(root, 'src/app/api/checkout/route.ts'),
      'utf8'
    );
    expect(source).toContain("import { escapeHtml } from '@/utils/escapeHtml'");
    expect(source).toContain('escapeHtml(customerName)');
    expect(source).toContain('escapeHtml(item.productName');
  });

  it('ISSUE-044: cart route rejects mismatched client cartId', () => {
    const source = fs.readFileSync(
      path.join(root, 'src/app/api/cart/route.ts'),
      'utf8'
    );
    expect(source).toContain("cartId !== cartResult.data.id");
    expect(source).toContain("status: 403");
  });

  it('ISSUE-045: advisor routes use rate limiting and shared secret header', () => {
    const chat = fs.readFileSync(
      path.join(root, 'src/app/api/advisor/chat/route.ts'),
      'utf8'
    );
    const stream = fs.readFileSync(
      path.join(root, 'src/app/api/advisor/chat/stream/route.ts'),
      'utf8'
    );
    expect(chat).toContain("checkRateLimit('advisor-chat'");
    expect(chat).toContain('X-Advisor-Secret');
    expect(stream).toContain("checkRateLimit('advisor-chat'");
    expect(stream).toContain('Invalid request body');
  });

  it('ISSUE-046: newsletter and forgot-password use rate limiting', () => {
    const newsletter = fs.readFileSync(
      path.join(root, 'src/app/api/newsletter/route.ts'),
      'utf8'
    );
    const forgot = fs.readFileSync(
      path.join(root, 'src/app/api/auth/forgot-password/route.ts'),
      'utf8'
    );
    expect(newsletter).toContain("checkRateLimit('newsletter'");
    expect(forgot).toContain("checkRateLimit('forgot-password'");
  });

  it('ISSUE-047: create-payment-intent derives amount from cart server-side', () => {
    const source = fs.readFileSync(
      path.join(root, 'src/app/api/checkout/route.ts'),
      'utf8'
    );
    expect(source).toContain('syncCartPrices');
    expect(source).toContain('serverAmount');
    expect(source).toContain('Payment amount does not match cart total');
  });

  it('ISSUE-048: test endpoints use getTestModeStatus', () => {
    for (const file of [
      'src/app/api/test/checkout/route.ts',
      'src/app/api/test/orders/route.ts',
      'src/app/api/test/shipment/simulate/route.ts',
    ]) {
      const source = fs.readFileSync(path.join(root, file), 'utf8');
      expect(source).toContain('getTestModeStatus');
    }
  });

  it('ISSUE-049: EmailService escapes orderId and trackingNumber', () => {
    const source = fs.readFileSync(
      path.join(root, 'src/services/email/EmailService.ts'),
      'utf8'
    );
    expect(source).toContain('this.escapeHtml(orderData.orderId)');
    expect(source).toContain('this.escapeHtml(orderData.trackingNumber)');
  });

  it('escapeHtml encodes HTML special characters', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });
});