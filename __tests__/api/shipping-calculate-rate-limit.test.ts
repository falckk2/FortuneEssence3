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

import { POST } from '@/app/api/shipping/calculate/route';
import { getSupabaseServer } from '@/lib/supabase-server';
import { moduleMocks } from '../helpers/moduleMocks';

describe('Shipping calculate API rate limiting (ISSUE-028)', () => {
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
    moduleMocks.shippingService.getAllShippingOptions.mockResolvedValue({
      success: true,
      data: [],
    });

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

  it('returns 429 when the shipping-calculate bucket is exhausted', async () => {
    const now = new Date();
    const timestamps = Array.from({ length: 20 }, () => now.toISOString());
    mockSupabase.mockQuery.single.mockResolvedValue({ data: { timestamps }, error: null });

    const request = new NextRequest('http://localhost:3000/api/shipping/calculate', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.9', 'content-type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p1', quantity: 1, price: 10 }],
        country: 'SE',
        postalCode: '11122',
        orderValue: 10,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toMatch(/too many requests/i);
    expect(moduleMocks.shippingService.getAllShippingOptions).not.toHaveBeenCalled();
  });

  it('allows requests under the limit and upserts the bucket', async () => {
    mockSupabase.mockQuery.single.mockResolvedValue({ data: { timestamps: [] }, error: null });
    mockSupabase.mockQuery.upsert.mockResolvedValue({ error: null });

    const request = new NextRequest('http://localhost:3000/api/shipping/calculate', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.10', 'content-type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p1', quantity: 1, price: 10 }],
        country: 'SE',
        postalCode: '11122',
        orderValue: 10,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockSupabase.mockQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'shipping-calculate:198.51.100.10' })
    );
  });
});