import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', '..');

function readSrc(relativePath: string): string {
  return fs.readFileSync(path.join(root, 'src', relativePath), 'utf8');
}

describe('ISSUE-021 through ISSUE-030 code verification', () => {
  describe('ISSUE-021 Stripe webhook idempotency', () => {
    it('records event id before dispatch and short-circuits duplicate inserts', () => {
      const source = readSrc('app/api/webhooks/stripe/route.ts');
      const idempotencyBlock = source.slice(
        source.indexOf('// Idempotency guard'),
        source.indexOf('switch (event.type)')
      );

      expect(idempotencyBlock).toContain("from('processed_stripe_events')");
      expect(idempotencyBlock).toContain('event_id: event.id');
      expect(idempotencyBlock).toContain("idempotencyError.code === '23505'");
      expect(idempotencyBlock).toContain('duplicate: true');
      expect(idempotencyBlock.indexOf('insert')).toBeLessThan(source.indexOf('switch (event.type)'));
    });
  });

  describe('ISSUE-022 track-by-order information disclosure', () => {
    it('requires orderId and email on the canonical public track endpoint', () => {
      const source = readSrc('app/api/orders/track/route.ts');
      expect(source).toContain('orderId');
      expect(source).toContain('email');
      expect(source).toMatch(/customerEmail !== suppliedEmail/);
      expect(source).not.toMatch(/total:\s*order\.total/);
      expect(source).not.toMatch(/createdAt:\s*order\.createdAt/);
    });

    it('removes unauthenticated track-by-order from the authenticated orders route', () => {
      const source = readSrc('app/api/orders/route.ts');
      expect(source).not.toContain('track-by-order');
      expect(source).toContain('Authentication required');
    });
  });

  describe('ISSUE-023 nonce-based CSP', () => {
    it('sets per-request nonce CSP in middleware without unsafe-inline', () => {
      const source = readSrc('middleware.ts');
      expect(source).toContain('crypto.getRandomValues');
      expect(source).toContain("requestHeaders.set('x-nonce', nonce)");
      expect(source).toContain("'nonce-${nonce}'");
      expect(source).toContain('unsafe-inline is intentionally absent');
      expect(source).toMatch(/isDev \? " 'unsafe-eval'" : ''/);
    });

    it('does not emit a static CSP from next.config.ts', () => {
      const source = readSrc(path.join('..', 'next.config.ts'));
      expect(source).toContain('Content-Security-Policy is set per-request by src/middleware.ts');
      expect(source).not.toMatch(/key:\s*'Content-Security-Policy'/);
    });
  });

  describe('ISSUE-024 theme flash prevention', () => {
    it('applies saved theme class before hydration via beforeInteractive script', () => {
      const source = readSrc('app/layout.tsx');
      expect(source).toContain('strategy="beforeInteractive"');
      expect(source).toContain('localStorage.getItem(\'theme\')');
      expect(source).toContain('document.documentElement.classList.add(\'dark\')');
      expect(source).toContain('nonce={nonce}');
    });
  });

  describe('ISSUE-025 inventory atomic updates', () => {
    it('does not use Supabase RPC for inventory reservation (resolution notes mismatch)', () => {
      const source = readSrc('repositories/inventory/InventoryRepository.ts');
      expect(source).not.toMatch(/\.rpc\(/);
    });

    it('uses OCC/.gte guards instead of read-then-write without guards', () => {
      const source = readSrc('repositories/inventory/InventoryRepository.ts');
      const reserveBlock = source.slice(
        source.indexOf('async reserveStock'),
        source.indexOf('async releaseReservedStock')
      );
      const releaseBlock = source.slice(
        source.indexOf('async releaseReservedStock'),
        source.indexOf('private transformDbRecord')
      );
      const confirmBlock = source.slice(
        source.indexOf('async confirmReservation'),
        source.indexOf('async getLowStockItems')
      );

      expect(reserveBlock).toContain(".gte('quantity'");
      expect(releaseBlock).toContain(".eq('reserved_quantity', currentReserved)");
      expect(confirmBlock).toContain(".eq('reserved_quantity', currentReserved)");
      expect(confirmBlock).toContain(".eq('quantity', currentQuantity)");
    });

    it('reserveStock uses reserved_quantity OCC guard to prevent lost updates', () => {
      const source = readSrc('repositories/inventory/InventoryRepository.ts');
      const reserveBlock = source.slice(
        source.indexOf('async reserveStock'),
        source.indexOf('async releaseReservedStock')
      );

      expect(reserveBlock).toContain('currentReserved + quantity');
      expect(reserveBlock).toContain(".eq('reserved_quantity', currentReserved)");
      expect(reserveBlock).toContain(".gte('quantity', newReservedQuantity)");
    });
  });

  describe('ISSUE-026 newsletter discount code leak', () => {
    it('does not return discountCode in the subscription JSON response', () => {
      const source = readSrc('app/api/newsletter/route.ts');
      const postBlock = source.slice(
        source.indexOf('export async function POST'),
        source.indexOf('export async function DELETE')
      );

      expect(postBlock).toContain('sendNewsletterWelcome');
      expect(postBlock).not.toMatch(/data:\s*\{[^}]*discountCode/s);
      expect(postBlock).not.toMatch(/return NextResponse\.json\(\{[^}]*discountCode/s);
      expect(postBlock).toMatch(/Check your email/i);
    });
  });

  describe('ISSUE-027 CartService.updateQuantity cartItemId disambiguation', () => {
    it('matches cartItemId when provided and passes it from the cart API', () => {
      const service = readSrc('services/cart/CartService.ts');
      const route = readSrc('app/api/cart/route.ts');

      expect(service).toContain('cartItemId?: string');
      expect(service).toContain('item.cartItemId === cartItemId');
      expect(route).toContain('cartItemId');
      expect(route).toContain('updateQuantity(targetCartId, productId, quantity, cartItemId)');
    });
  });

  describe('ISSUE-028 shipping calculate rate limiting', () => {
    it('rate limits /api/shipping/calculate before external API calls', () => {
      const source = readSrc('app/api/shipping/calculate/route.ts');
      expect(source).toContain('MAX_REQUESTS_PER_WINDOW = 20');
      expect(source).toContain("FORM_TYPE = 'shipping-calculate'");
      expect(source).toContain('@/utils/rateLimit');
      expect(source).toMatch(/checkRateLimit\(FORM_TYPE/);
      const rateLimitIndex = source.indexOf('checkRateLimit(FORM_TYPE');
      const bodyParseIndex = source.indexOf('await request.json()');
      expect(rateLimitIndex).toBeLessThan(bodyParseIndex);
    });
  });

  describe('ISSUE-029 password reset token invalidation', () => {
    it('invalidates all remaining unused tokens for the customer after reset', () => {
      const source = readSrc('services/auth/AuthService.ts');
      const block = source.slice(
        source.indexOf('async completePasswordReset'),
        source.indexOf('async changePassword')
      );

      expect(block).toContain(".eq('customer_id', customer.id)");
      expect(block).toContain(".is('used_at', null)");
      expect(block).toContain('Invalidate ALL remaining unused tokens');
    });
  });

  describe('ISSUE-030 CustomerRepository LIKE wildcard escaping', () => {
    it('escapes % and _ before building ilike filters', () => {
      const source = readSrc('repositories/customers/CustomerRepository.ts');
      expect(source).toContain('escapeLikePattern');
      expect(source).toContain(".replace(/%/g, '\\\\%')");
      expect(source).toContain('this.escapeLikePattern(params.search)');
    });
  });
});