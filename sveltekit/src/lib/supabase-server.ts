import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '$lib/config';

let serverClientInstance: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
	if (serverClientInstance) return serverClientInstance;

	const { supabaseUrl, supabaseSecretKey } = config.database;

	if (!supabaseUrl || !supabaseSecretKey) {
		throw new Error('Supabase URL and secret key are required for server client');
	}

	serverClientInstance = createClient(supabaseUrl, supabaseSecretKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	return serverClientInstance;
}

export type { Database } from './supabase';
