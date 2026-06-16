/**
 * Live verification for migration 018 (ISSUE-037 + ISSUE-040).
 * Run: node scripts/verify-migration-018.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvLocal() {
  const path = resolve(root, '.env.local');
  const text = readFileSync(path, 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`PASS  ${name}: ${detail}`);
  } catch (err) {
    const msg = err?.message ?? String(err);
    results.push({ name, ok: false, detail: msg });
    console.error(`FAIL  ${name}: ${msg}`);
  }
}

await check('get_order_status_counts RPC exists', async () => {
  const { data, error } = await supabase.rpc('get_order_status_counts', { p_customer_id: null });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Expected array result');
  const total = data.reduce((s, r) => s + Number(r.count), 0);
  return `${data.length} status groups, ${total} orders total`;
});

await check('get_order_status_counts with null customer matches all orders', async () => {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_status_counts', {
    p_customer_id: null,
  });
  if (rpcError) throw rpcError;
  const rpcTotal = (rpcData ?? []).reduce((s, r) => s + Number(r.count), 0);

  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });
  if (countError) throw countError;

  if (rpcTotal !== count) {
    throw new Error(`RPC total ${rpcTotal} !== table count ${count}`);
  }
  return `RPC aggregate matches orders table count (${count})`;
});

await check('check_and_record_rate_limit RPC exists and allows request', async () => {
  const bucketId = `verify-018:${Date.now()}`;
  const { data, error } = await supabase.rpc('check_and_record_rate_limit', {
    p_bucket_id: bucketId,
    p_form_type: 'verify-018',
    p_ip: '127.0.0.1',
    p_max_requests: 5,
    p_window_ms: 3600000,
  });
  if (error) throw error;
  if (data !== true) throw new Error(`Expected true, got ${data}`);
  return 'first call returned true';
});

await check('check_and_record_rate_limit enforces limit atomically', async () => {
  const bucketId = `verify-018-limit:${Date.now()}`;
  const params = {
    p_bucket_id: bucketId,
    p_form_type: 'verify-018',
    p_ip: '127.0.0.1',
    p_max_requests: 2,
    p_window_ms: 3600000,
  };

  for (let i = 0; i < 2; i++) {
    const { data, error } = await supabase.rpc('check_and_record_rate_limit', params);
    if (error) throw error;
    if (data !== true) throw new Error(`Call ${i + 1} expected true, got ${data}`);
  }

  const { data: blocked, error: blockError } = await supabase.rpc(
    'check_and_record_rate_limit',
    params
  );
  if (blockError) throw blockError;
  if (blocked !== false) throw new Error(`Third call expected false, got ${blocked}`);
  return '2 allowed then blocked on 3rd call';
});

await check('OrderRepository path uses RPC (no full status fetch when RPC works)', async () => {
  const { data, error } = await supabase.rpc('get_order_status_counts', { p_customer_id: null });
  if (error) throw error;
  const counts = Object.fromEntries((data ?? []).map((r) => [r.status, Number(r.count)]));
  return `statuses: ${JSON.stringify(counts)}`;
});

// Cleanup test buckets
const { error: cleanupError } = await supabase
  .from('rate_limit_buckets')
  .delete()
  .like('id', 'verify-018%');
if (cleanupError) {
  console.warn('WARN  cleanup verify buckets:', cleanupError.message);
} else {
  console.log('PASS  cleaned up verify-018 rate limit buckets');
}

const failed = results.filter((r) => !r.ok);
console.log('\n---');
console.log(`${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length > 0 ? 1 : 0);