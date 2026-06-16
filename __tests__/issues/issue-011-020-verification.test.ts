import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', '..');

function readSrc(relativePath: string): string {
  return fs.readFileSync(path.join(root, 'src', relativePath), 'utf8');
}

describe('ISSUE-011 through ISSUE-020 code verification', () => {
  describe('ISSUE-011 DevAdminButton dark mode and test config', () => {
    it('uses dark mode classes in DevAdminButton', () => {
      const source = readSrc('components/admin/DevAdminButton.tsx');
      expect(source).toMatch(/dark:bg-\[#242a28\]/);
      expect(source).toMatch(/dark:border-\[#3f4946\]/);
      expect(source).toMatch(/dark:bg-\[#1a1f1e\]/);
      expect(source).toMatch(/dark:text-\[#8A9A8A\]/);
      expect(source).toMatch(/dark:hover:bg-\[#2a3330\]/);
      expect(source).toMatch(/dark:bg-green-950\/40/);
      expect(source).toMatch(/dark:bg-red-950\/40/);
    });

    it('persists test mode via feature_flags instead of filesystem writes', () => {
      const source = readSrc('app/api/test/config/route.ts');
      expect(source).toContain("from('feature_flags')");
      expect(source).not.toMatch(/writeFileSync|readFileSync|from 'fs'/);
      expect(source).not.toContain('.env.local');
    });
  });

  describe('ISSUE-012 AuthService server-safe split', () => {
    it('does not import next-auth/react in AuthService', () => {
      const source = readSrc('services/auth/AuthService.ts');
      expect(source).not.toMatch(/from ['"]next-auth\/react['"]/);
      expect(source).not.toContain('async signIn(');
      expect(source).not.toContain('async signOut(');
      expect(source).not.toContain('async getCurrentUser(');
    });

    it('exposes client auth wrappers in auth-client.ts', () => {
      const source = readSrc('lib/auth-client.ts');
      expect(source).toContain("'use client'");
      expect(source).toMatch(/from ['"]next-auth\/react['"]/);
      expect(source).toContain('export async function clientSignIn');
      expect(source).toContain('export async function clientSignOut');
      expect(source).toContain('getClientSession');
    });
  });

  describe('ISSUE-013 CookieConsent safe storage', () => {
    it('uses LocalStorageHelper for consent read/write', () => {
      const source = readSrc('components/gdpr/CookieConsent.tsx');
      expect(source).toContain('LocalStorageHelper.getItem<ConsentData>(\'cookie-consent\')');
      expect(source).toContain("LocalStorageHelper.setItem('cookie-consent', consentData)");
      expect(source).not.toMatch(/localStorage\.getItem\(['"]cookie-consent['"]\)/);
      expect(source).not.toMatch(/localStorage\.setItem\(['"]cookie-consent['"]/);
    });
  });

  describe('ISSUE-014 CookieConsent stable session dependency', () => {
    it('depends on session user id via useCallback, not full session object', () => {
      const source = readSrc('components/gdpr/CookieConsent.tsx');
      expect(source).toContain('useCallback');
      expect(source).toContain('[session?.user?.id]');
      expect(source).toContain('}, [checkConsentStatus]);');
      expect(source).not.toMatch(/useEffect\(\(\) => \{[\s\S]*\}, \[session\]\)/);
    });
  });

  describe('ISSUE-015 LocaleProvider stale-closure fix', () => {
    it('uses URL-driven locale without stale defaultLocale/locale detection loop', () => {
      const source = readSrc('contexts/LocaleContext.tsx');
      expect(source).toContain('splitLocaleFromPath');
      expect(source).not.toContain('detectUserLocale');
      expect(source).not.toContain('defaultLocale');
      expect(source).not.toContain('setLocaleState');
      expect(source).not.toMatch(/useEffect\([\s\S]*\[defaultLocale, locale\]/);
    });
  });

  describe('ISSUE-018 checkout email gating for card payments', () => {
    it('sends order confirmation from checkout only for non-card payments', () => {
      const source = readSrc('app/api/checkout/route.ts');
      expect(source).toContain("const isCardPayment = order.paymentMethod === 'card'");
      expect(source).toContain('if (!isCardPayment)');
      expect(source).toMatch(
        /if \(!isCardPayment\) \{[\s\S]*sendOrderConfirmation/
      );
    });
  });

  describe('ISSUE-019 EmailService idempotency support', () => {
    it('defines idempotencyKey on EmailOptions and forwards header in sendEmail', () => {
      const iface = readSrc('interfaces/email.ts');
      const service = readSrc('services/email/EmailService.ts');

      expect(iface).toContain('idempotencyKey?: string');
      expect(service).toContain("headers['Idempotency-Key'] = options.idempotencyKey");
    });

    it('wires idempotency keys in high-risk send helpers', () => {
      const service = readSrc('services/email/EmailService.ts');
      const orderConfirmBlock = service.slice(
        service.indexOf('async sendOrderConfirmation'),
        service.indexOf('async sendPasswordReset')
      );
      const passwordResetBlock = service.slice(
        service.indexOf('async sendPasswordReset'),
        service.indexOf('async sendWelcomeEmail')
      );

      expect(orderConfirmBlock).toContain('idempotencyKey: `order-confirm:${orderData.orderId}`');
      expect(passwordResetBlock).toContain("createHash('sha256')");
      expect(passwordResetBlock).toContain('idempotencyKey: `password-reset:${tokenHash}`');
    });
  });

  describe('ISSUE-020 instrumentation DI boot init', () => {
    it('calls initializeDI during register on node runtime when secret key is set', () => {
      const source = readSrc('instrumentation.ts');
      expect(source).toContain("import 'reflect-metadata'");
      expect(source).toContain("process.env.NEXT_RUNTIME === 'nodejs'");
      expect(source).toContain('process.env.SUPABASE_SECRET_KEY');
      expect(source).toContain("await import('@/config/di-init')");
      expect(source).toContain('initializeDI()');
    });
  });
});