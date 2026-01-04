import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';

const supabaseUrl = config.database.supabaseUrl || 'https://xxxxxxxxxxxxxxxxxxx.supabase.co';
const supabasePublishableKey = config.database.supabasePublishableKey || '';

// Warn at runtime if credentials are missing (but allow build to proceed)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  if (!config.database.supabaseUrl || !config.database.supabasePublishableKey) {
    console.warn('Warning: Supabase environment variables not configured');
  }
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          street: string;
          city: string;
          postal_code: string;
          country?: string;
          region?: string | null;
          consent_given: boolean;
          marketing_opt_in?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          street?: string;
          city?: string;
          postal_code?: string;
          country?: string;
          region?: string | null;
          consent_given?: boolean;
          marketing_opt_in?: boolean;
          created_at?: string;
          updated_at?: string;
        };
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
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          category: string;
          images?: string[];
          stock: number;
          sku: string;
          weight: number;
          length: number;
          width: number;
          height: number;
          is_active?: boolean;
          name_sv: string;
          description_sv: string;
          name_en: string;
          description_en: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          category?: string;
          images?: string[];
          stock?: number;
          sku?: string;
          weight?: number;
          length?: number;
          width?: number;
          height?: number;
          is_active?: boolean;
          name_sv?: string;
          description_sv?: string;
          name_en?: string;
          description_en?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          items: any[];
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          items: any[];
          total: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          items?: any[];
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          items: any[];
          total: number;
          tax: number;
          shipping: number;
          status: string;
          shipping_address: any;
          billing_address: any;
          payment_method: string;
          payment_id: string;
          tracking_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          items: any[];
          total: number;
          tax: number;
          shipping: number;
          status?: string;
          shipping_address: any;
          billing_address: any;
          payment_method: string;
          payment_id: string;
          tracking_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          items?: any[];
          total?: number;
          tax?: number;
          shipping?: number;
          status?: string;
          shipping_address?: any;
          billing_address?: any;
          payment_method?: string;
          payment_id?: string;
          tracking_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          product_id: string;
          quantity: number;
          reserved_quantity: number;
          reorder_level: number;
          last_updated: string;
        };
        Insert: {
          product_id: string;
          quantity: number;
          reserved_quantity?: number;
          reorder_level: number;
          last_updated?: string;
        };
        Update: {
          product_id?: string;
          quantity?: number;
          reserved_quantity?: number;
          reorder_level?: number;
          last_updated?: string;
        };
      };
      shipping_rates: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          estimated_days: number;
          country: string;
          max_weight: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          estimated_days: number;
          country: string;
          max_weight: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          estimated_days?: number;
          country?: string;
          max_weight?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      product_category: 'essential-oils' | 'carrier-oils' | 'diffusers' | 'accessories' | 'gift-sets';
      order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
      payment_method: 'swish' | 'klarna' | 'card' | 'bank-transfer';
    };
  };
};