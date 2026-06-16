import { getSupabaseServer } from '@/lib/supabase-server';

const FLAG_KEY = 'enable_test_endpoints';

export async function getTestModeStatus(): Promise<boolean> {
  if (process.env.ENABLE_TEST_ENDPOINTS === 'true') return true;
  if (process.env.NODE_ENV === 'development') return true;

  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('feature_flags')
      .select('value')
      .eq('key', FLAG_KEY)
      .single();
    return data?.value === true;
  } catch {
    return false;
  }
}

export async function assertTestEndpointsAllowed(): Promise<boolean> {
  return getTestModeStatus();
}