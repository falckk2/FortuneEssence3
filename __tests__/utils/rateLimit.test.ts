import { checkRateLimit } from '@/utils/rateLimit';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(),
}));

import { getSupabaseServer } from '@/lib/supabase-server';

describe('checkRateLimit (ISSUE-040)', () => {
  let mockRpc: jest.Mock;
  let mockFrom: jest.Mock;
  let mockQuery: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc = jest.fn();
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };
    mockFrom = jest.fn(() => mockQuery);
    (getSupabaseServer as jest.Mock).mockReturnValue({
      rpc: mockRpc,
      from: mockFrom,
    });
  });

  it('uses atomic RPC when available', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    const allowed = await checkRateLimit('contact', '1.2.3.4', 5, 3600000);

    expect(allowed).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('check_and_record_rate_limit', {
      p_bucket_id: 'contact:1.2.3.4',
      p_form_type: 'contact',
      p_ip: '1.2.3.4',
      p_max_requests: 5,
      p_window_ms: 3600000,
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns false when RPC reports rate limit exceeded', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });

    const allowed = await checkRateLimit('contact', '1.2.3.4', 5);

    expect(allowed).toBe(false);
  });

  it('falls back to read-then-upsert when RPC is missing', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'function check_and_record_rate_limit does not exist', code: '42883' },
    });
    mockQuery.single.mockResolvedValue({ data: { timestamps: [] }, error: null });

    const allowed = await checkRateLimit('contact', '1.2.3.4', 5);

    expect(allowed).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('rate_limit_buckets');
    expect(mockQuery.upsert).toHaveBeenCalled();
  });
});