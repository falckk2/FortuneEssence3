import { NextRequest } from 'next/server';

jest.mock('@/config/di-init', () => ({}));
jest.mock('@/lib/supabase-server', () => ({ getSupabaseServer: jest.fn() }));
jest.mock('@/config/di-container', () => {
  const { moduleMocks } = require('../helpers/moduleMocks');
  return {
    TOKENS: { IShippingService: Symbol.for('IShippingService') },
    container: {
      resolve: jest.fn(() => moduleMocks.shippingService),
      register: jest.fn(),
    },
  };
});

import { GET, POST } from '@/app/api/shipping/route';
import { getSupabaseServer } from '@/lib/supabase-server';
import { moduleMocks } from '../helpers/moduleMocks';

describe('Shipping API rate limiting (ISSUE-038)', () => {
  let mockSupabase: {
    from: jest.Mock;
    mockQuery: {
      select: jest.Mock;
      eq: jest.Mock;
      single: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    moduleMocks.shippingService.getShippingRates.mockResolvedValue({ success: true, data: [] });
    moduleMocks.shippingService.getSupportedCountries.mockResolvedValue({ success: true, data: ['SE'] });
    moduleMocks.shippingService.calculateShipping.mockResolvedValue({ success: true, data: { cost: 49 } });

    mockSupabase = {
      from: jest.fn(),
      mockQuery: {
        select: jest.fn(),
        eq: jest.fn(),
        single: jest.fn(),
        upsert: jest.fn(),
      },
    };
    mockSupabase.from.mockReturnValue(mockSupabase.mockQuery);
    mockSupabase.mockQuery.select.mockReturnValue(mockSupabase.mockQuery);
    mockSupabase.mockQuery.eq.mockReturnValue(mockSupabase.mockQuery);
    (getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase);
  });

  function mockRateLimitExceeded() {
    const now = new Date();
    const timestamps = Array.from({ length: 20 }, () => now.toISOString());
    mockSupabase.mockQuery.single.mockResolvedValue({
      data: { timestamps },
      error: null,
    });
  }

  function mockRateLimitAllowed() {
    mockSupabase.mockQuery.single.mockResolvedValue({
      data: { timestamps: [] },
      error: null,
    });
    mockSupabase.mockQuery.upsert.mockResolvedValue({ error: null });
  }

  it('returns 429 on GET when rate limit exceeded', async () => {
    mockRateLimitExceeded();
    const request = new NextRequest(
      'http://localhost:3000/api/shipping?action=rates',
      { headers: { 'x-forwarded-for': '203.0.113.1' } }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toMatch(/too many requests/i);
    expect(moduleMocks.shippingService.getShippingRates).not.toHaveBeenCalled();
  });

  it('allows GET when under rate limit', async () => {
    mockRateLimitAllowed();
    const request = new NextRequest(
      'http://localhost:3000/api/shipping?action=countries',
      { headers: { 'x-forwarded-for': '203.0.113.2' } }
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockSupabase.mockQuery.upsert).toHaveBeenCalled();
  });

  it('returns 429 on POST when rate limit exceeded', async () => {
    mockRateLimitExceeded();
    const request = new NextRequest('http://localhost:3000/api/shipping', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.3' },
      body: JSON.stringify({ action: 'calculate-shipping', weight: 1 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toMatch(/too many requests/i);
    expect(moduleMocks.shippingService.calculateShipping).not.toHaveBeenCalled();
  });
});