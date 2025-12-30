/**
 * Shipping Calculation API
 *
 * POST /api/shipping/calculate
 * Calculates all available shipping options for a cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import { initializeDI } from '@/config/di-init';
import { IShippingService } from '@/interfaces';
import { CartItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Initialize DI container
    initializeDI();

    const body = await request.json();
    const { items, country, postalCode, orderValue } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart items are required',
        },
        { status: 400 }
      );
    }

    if (!country) {
      return NextResponse.json(
        {
          success: false,
          error: 'Country is required',
        },
        { status: 400 }
      );
    }

    // Get shipping service
    const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

    // Calculate all shipping options
    const result = await shippingService.getAllShippingOptions(
      items as CartItem[],
      country,
      postalCode,
      orderValue
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate shipping options',
      },
      { status: 500 }
    );
  }
}
