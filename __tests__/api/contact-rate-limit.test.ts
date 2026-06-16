/**
 * ISSUE-009: Contact form rate limiting must persist in Supabase, not module-level Map.
 */

import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('@/config/di-init', () => ({}));
jest.mock('next-auth/next', () => ({ getServerSession: jest.fn().mockResolvedValue(null) }));

const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({ from: mockFrom })),
}));

jest.mock('@/config/di-container', () => ({
  TOKENS: { IEmailService: Symbol.for('IEmailService') },
  container: {
    resolve: jest.fn(() => ({
      sendContactFormConfirmation: jest.fn().mockResolvedValue({ success: true }),
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
    })),
  },
}));

jest.mock('@/config', () => ({
  config: {
    database: { supabaseUrl: 'http://test', supabaseSecretKey: 'secret' },
    email: { contactRecipient: 'support@test.com', resendApiKey: 're_test' },
    auth: { nextAuthSecret: 'secret' },
  },
}));

jest.mock('@/lib/auth', () => ({
  authOptions: { providers: [] },
}));

import { POST } from '@/app/api/contact/route';

describe('contact rate limit (ISSUE-009)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert });
  });

  it('source file uses Supabase-backed rate limiter, not module-level contactRequests Map', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/contact/route.ts'),
      'utf8'
    );
    expect(source).not.toMatch(/contactRequests\s*=\s*new Map/);
    expect(source).not.toMatch(/const contactRequests/);
    expect(source).toMatch(/@\/utils\/rateLimit/);
    expect(source).toMatch(/checkRateLimit\(FORM_TYPE/);
  });

  it('returns 429 when bucket has max requests in window', async () => {
    const now = new Date();
    const recent = Array.from({ length: 5 }, (_, i) =>
      new Date(now.getTime() - i * 60_000).toISOString()
    );
    mockSingle.mockResolvedValue({ data: { timestamps: recent }, error: null });

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Hello there',
        message: 'This is a long enough test message.',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toMatch(/Too many requests/);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('upserts bucket row when under limit', async () => {
    mockSingle.mockResolvedValue({ data: { timestamps: [] }, error: null });
    const mockInsertSingle = jest.fn().mockResolvedValue({
      data: { id: 'submission-1' },
      error: null,
    });
    const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'rate_limit_buckets') {
        return { select: mockSelect, upsert: mockUpsert };
      }
      if (table === 'contact_form_submissions') {
        return { insert: mockInsert };
      }
      return { select: mockSelect };
    });

    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'x-forwarded-for': '5.6.7.8' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Hello there',
        message: 'This is a long enough test message.',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith('rate_limit_buckets');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'contact:5.6.7.8',
        form_type: 'contact',
        ip: '5.6.7.8',
      })
    );
  });
});