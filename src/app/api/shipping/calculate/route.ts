export const dynamic = 'force-dynamic'
/**
 * Shipping Calculation API
 *
 * POST /api/shipping/calculate
 * Calculates all available shipping options for a cart
 */

import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import type { IShippingService } from '@/interfaces';
import type { CartItem } from '@/types';
import { getSupabaseServer } from '@/lib/supabase-server';

const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

// Rate limiting for shipping calculations to prevent quota exhaustion from scrapers.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 20;
const FORM_TYPE = 'shipping-calculate';

async function checkRateLimit(ip: string): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const bucketId = `${FORM_TYPE}:${ip}`;

  try {
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

    if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    recentTimestamps.push(now.toISOString());

    await supabase
      .from('rate_limit_buckets')
      .upsert({
        id: bucketId,
        form_type: FORM_TYPE,
        ip,
        timestamps: recentTimestamps,
        updated_at: now.toISOString(),
      });

    return true;
  } catch (err) {
    console.error('[rate-limit] DB check failed, failing open:', err);
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!await checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { items, country, postalCode, orderValue } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!country) {
      return NextResponse.json(
        { success: false, error: 'Country is required' },
        { status: 400 }
      );
    }

    const result = await shippingService.getAllShippingOptions(
      items as CartItem[],
      country,
      postalCode,
      orderValue
    );

    if (!result.success) {
      console.error('Shipping calculate POST - failed to get shipping options:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
