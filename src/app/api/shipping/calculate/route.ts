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
import { checkRateLimit, getClientIp } from '@/utils/rateLimit';

const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const FORM_TYPE = 'shipping-calculate';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!await checkRateLimit(FORM_TYPE, ip, MAX_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW_MS)) {
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
