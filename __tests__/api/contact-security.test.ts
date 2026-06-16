import { NextRequest } from 'next/server';

jest.mock('@/config/di-init', () => ({}));
jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/supabase-server', () => ({ getSupabaseServer: jest.fn() }));
jest.mock('@/utils/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  getClientIp: jest.fn(() => '198.51.100.1'),
}));
jest.mock('@/config', () => ({
  config: { email: { supportEmail: 'support@test.com' } },
}));
jest.mock('@/config/di-container', () => {
  const { moduleMocks } = require('../helpers/moduleMocks');
  return {
    TOKENS: { IEmailService: Symbol.for('IEmailService') },
    container: {
      resolve: jest.fn(() => moduleMocks.emailService),
      register: jest.fn(),
    },
  };
});

import { POST } from '@/app/api/contact/route';
import { getSupabaseServer } from '@/lib/supabase-server';
import { checkRateLimit } from '@/utils/rateLimit';
import { moduleMocks } from '../helpers/moduleMocks';

describe('Contact API security (ISSUE-039, ISSUE-040)', () => {
  let mockSupabase: {
    from: jest.Mock;
    mockQuery: {
      select: jest.Mock;
      eq: jest.Mock;
      single: jest.Mock;
      upsert: jest.Mock;
      insert: jest.Mock;
    };
  };

  const validBody = {
    name: 'Test User',
    email: 'user@example.com',
    subject: 'Help needed',
    message: 'This is a long enough test message for validation.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    moduleMocks.emailService.sendEmail.mockResolvedValue(undefined);
    moduleMocks.emailService.sendContactFormConfirmation.mockResolvedValue(undefined);

    mockSupabase = {
      from: jest.fn(),
      mockQuery: {
        select: jest.fn(),
        eq: jest.fn(),
        single: jest.fn(),
        upsert: jest.fn(),
        insert: jest.fn(),
      },
    };
    mockSupabase.from.mockReturnValue(mockSupabase.mockQuery);
    mockSupabase.mockQuery.select.mockReturnValue(mockSupabase.mockQuery);
    mockSupabase.mockQuery.eq.mockReturnValue(mockSupabase.mockQuery);
    mockSupabase.mockQuery.insert.mockReturnValue(mockSupabase.mockQuery);
    mockSupabase.mockQuery.upsert.mockResolvedValue({ error: null });
    (getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase);
  });

  function setupAllowedRateLimitAndInsert() {
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
    mockSupabase.mockQuery.single.mockResolvedValueOnce({
      data: { id: 'sub-1', ...validBody },
      error: null,
    });
  }

  it('escapes HTML in admin notification email (ISSUE-039)', async () => {
    setupAllowedRateLimitAndInsert();
    const xssName = '<script>alert("xss")</script>';
    const xssMessage = '<img src=x onerror=alert(1)>';

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.1' },
      body: JSON.stringify({
        ...validBody,
        name: xssName,
        message: xssMessage,
      }),
    });

    await POST(request);

    expect(moduleMocks.emailService.sendEmail).toHaveBeenCalled();
    const emailCall = moduleMocks.emailService.sendEmail.mock.calls[0][0];
    expect(emailCall.html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(emailCall.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(emailCall.html).not.toContain('<script>');
    expect(emailCall.html).not.toContain('<img src=x');
  });

  it('delegates rate limiting to shared atomic checkRateLimit (ISSUE-040)', async () => {
    setupAllowedRateLimitAndInsert();

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.2' },
      body: JSON.stringify(validBody),
    });

    await POST(request);

    expect(checkRateLimit).toHaveBeenCalledWith('contact', '198.51.100.1', 5, 3600000);
  });

  it('returns 429 when rate limit bucket is full', async () => {
    (checkRateLimit as jest.Mock).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.3' },
      body: JSON.stringify(validBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toMatch(/too many requests/i);
    expect(moduleMocks.emailService.sendEmail).not.toHaveBeenCalled();
  });
});