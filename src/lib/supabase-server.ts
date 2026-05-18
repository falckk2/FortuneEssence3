import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/config';

/**
 * Server-side Supabase client with service role key
 * This client bypasses Row Level Security (RLS) and should only be used in server-side code
 * Use this for API routes and server components that need admin access
 *
 * IMPORTANT: This should only be called on the server side (API routes, server components)
 */

let serverClientInstance: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  // Ensure we're on the server
  if (typeof window !== 'undefined') {
    console.error('[issue-tracker][supabase-server] called on client'); // [issue-tracker] diagnostic log
    throw new Error('getSupabaseServer() can only be called on the server side');
  }

  // Return existing instance if available
  if (serverClientInstance) {
    return serverClientInstance;
  }

  const supabaseUrl = config.database.supabaseUrl;
  const supabaseSecretKey = config.database.supabaseSecretKey;

  // [issue-tracker] diagnostic log — first-time server client creation
  console.log('[issue-tracker][supabase-server] creating server client (first call)', {
    hasUrl: !!supabaseUrl,
    hasSecret: !!supabaseSecretKey,
    urlHost: supabaseUrl ? new URL(supabaseUrl).host : null,
  });

  // Warn at runtime if credentials are missing
  if (process.env.NODE_ENV !== 'production') {
    if (!supabaseUrl || !supabaseSecretKey) {
      console.warn('Warning: Supabase server environment variables not configured');
    }
  }

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error('[issue-tracker][supabase-server] missing credentials — throwing'); // [issue-tracker] diagnostic log
    throw new Error('Supabase URL and secret key are required for server client');
  }

  serverClientInstance = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClientInstance;
}

export type { Database } from './supabase';
