import { getSupabaseServer } from '@/lib/supabase-server';

const DEFAULT_WINDOW_MS = 60 * 60 * 1000;

async function checkRateLimitLegacy(
  bucketKey: string,
  ip: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const bucketId = `${bucketKey}:${ip}`;
  const supabase = getSupabaseServer();

  const { data: existing } = await supabase
    .from('rate_limit_buckets')
    .select('timestamps')
    .eq('id', bucketId)
    .single();

  const allTimestamps: string[] = existing?.timestamps ?? [];
  const recentTimestamps = allTimestamps.filter(
    (ts: string) => new Date(ts) > windowStart
  );

  if (recentTimestamps.length >= maxRequests) {
    return false;
  }

  recentTimestamps.push(now.toISOString());

  await supabase
    .from('rate_limit_buckets')
    .upsert({
      id: bucketId,
      form_type: bucketKey,
      ip,
      timestamps: recentTimestamps,
      updated_at: now.toISOString(),
    });

  return true;
}

/**
 * Supabase-backed sliding-window rate limiter.
 * Uses atomic Postgres RPC when migration 018 is deployed; falls back to
 * read-then-upsert if the RPC is not yet available.
 */
export async function checkRateLimit(
  bucketKey: string,
  ip: string,
  maxRequests: number,
  windowMs: number = DEFAULT_WINDOW_MS
): Promise<boolean> {
  const bucketId = `${bucketKey}:${ip}`;

  try {
    const supabase = getSupabaseServer();

    if (typeof supabase.rpc === 'function') {
      const { data, error } = await supabase.rpc('check_and_record_rate_limit', {
        p_bucket_id: bucketId,
        p_form_type: bucketKey,
        p_ip: ip,
        p_max_requests: maxRequests,
        p_window_ms: windowMs,
      });

      if (!error && typeof data === 'boolean') {
        return data;
      }

      if (error) {
        const msg = error.message ?? '';
        const rpcMissing =
          msg.includes('check_and_record_rate_limit') ||
          error.code === 'PGRST202' ||
          error.code === '42883';
        if (!rpcMissing) {
          console.error('[rate-limit] RPC failed, falling back:', error);
        }
      }
    }

    return await checkRateLimitLegacy(bucketKey, ip, maxRequests, windowMs);
  } catch (err) {
    console.error('[rate-limit] DB check failed, failing open:', err);
    return true;
  }
}

export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}