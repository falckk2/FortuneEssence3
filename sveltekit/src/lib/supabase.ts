import { createClient } from '@supabase/supabase-js';
import { config } from '$lib/config';

export const supabase = createClient(
	config.database.supabaseUrl,
	config.database.supabasePublishableKey,
	{
		auth: {
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: true,
		},
	}
);

export type Database = {
	public: {
		Tables: {
			customers: {
				Row: {
					id: string;
					email: string;
					first_name: string;
					last_name: string;
					phone: string | null;
					street: string;
					city: string;
					postal_code: string;
					country: string;
					region: string | null;
					consent_given: boolean;
					marketing_opt_in: boolean;
					is_admin: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<Database['public']['Tables']['customers']['Row'], 'created_at' | 'updated_at'> & {
					id?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database['public']['Tables']['customers']['Row']>;
			};
			products: {
				Row: {
					id: string;
					name: string;
					description: string;
					price: number;
					category: string;
					images: string[];
					stock: number;
					sku: string;
					weight: number;
					length: number;
					width: number;
					height: number;
					is_active: boolean;
					name_sv: string;
					description_sv: string;
					name_en: string;
					description_en: string;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & {
					id?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database['public']['Tables']['products']['Row']>;
			};
			carts: {
				Row: {
					id: string;
					user_id: string | null;
					session_id: string | null;
					items: unknown[];
					total: number;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<Database['public']['Tables']['carts']['Row'], 'id' | 'created_at' | 'updated_at'> & {
					id?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database['public']['Tables']['carts']['Row']>;
			};
			orders: {
				Row: {
					id: string;
					customer_id: string;
					items: unknown[];
					total: number;
					tax: number;
					shipping: number;
					status: string;
					shipping_address: unknown;
					billing_address: unknown;
					payment_method: string;
					payment_id: string;
					tracking_number: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'> & {
					id?: string;
					status?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database['public']['Tables']['orders']['Row']>;
			};
			inventory: {
				Row: {
					product_id: string;
					quantity: number;
					reserved_quantity: number;
					reorder_level: number;
					last_updated: string;
				};
				Insert: Omit<Database['public']['Tables']['inventory']['Row'], 'last_updated'> & {
					reserved_quantity?: number;
					last_updated?: string;
				};
				Update: Partial<Database['public']['Tables']['inventory']['Row']>;
			};
		};
		Views: Record<never, never>;
		Functions: Record<never, never>;
		Enums: {
			product_category: 'essential-oils' | 'carrier-oils' | 'diffusers' | 'accessories' | 'gift-sets';
			order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
			payment_method: 'swish' | 'klarna' | 'card' | 'bank-transfer';
		};
	};
};
