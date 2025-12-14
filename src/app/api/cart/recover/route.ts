import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import type { ICartService } from '@/interfaces';
import { TOKENS } from '@/config/di-container';

/**
 * Cart Recovery Endpoint
 *
 * GET /api/cart/recover?token={recoveryToken}
 * Recovers an abandoned cart using the recovery token from the email
 *
 * Returns:
 * - cartId: The cart identifier
 * - items: Array of cart items
 * - total: Cart total amount
 * - email: Customer email
 *
 * The frontend should:
 * 1. Call this endpoint with the recovery token
 * 2. Restore the cart items to the user's session/cart
 * 3. Redirect to the cart/checkout page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recoveryToken = searchParams.get('token');

    // Validate token parameter
    if (!recoveryToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recovery token is required',
        },
        { status: 400 }
      );
    }

    console.log(`[Cart Recovery] Attempting to recover cart with token: ${recoveryToken.substring(0, 10)}...`);

    // Get cart service from DI container
    const cartService = container.resolve<ICartService>(TOKENS.ICartService);

    // Recover the abandoned cart
    const result = await cartService.recoverAbandonedCart(recoveryToken);

    if (!result.success || !result.data) {
      console.error('[Cart Recovery] Failed to recover cart:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to recover cart',
        },
        { status: result.error === 'Invalid or expired recovery link' ? 404 : 500 }
      );
    }

    const { cartId, items, total, email } = result.data;

    console.log(`[Cart Recovery] Successfully recovered cart ${cartId} for ${email} with ${items.length} items`);

    // Return cart data for frontend to restore
    return NextResponse.json({
      success: true,
      data: {
        cartId,
        items,
        total,
        email,
        message: 'Cart recovered successfully',
      },
    });
  } catch (error) {
    console.error('[Cart Recovery] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to recover cart: ${error}`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart/recover
 * Alternative method that accepts recovery token in request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token: recoveryToken } = body;

    // Validate token
    if (!recoveryToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recovery token is required',
        },
        { status: 400 }
      );
    }

    console.log(`[Cart Recovery POST] Attempting to recover cart with token: ${recoveryToken.substring(0, 10)}...`);

    // Get cart service from DI container
    const cartService = container.resolve<ICartService>(TOKENS.ICartService);

    // Recover the abandoned cart
    const result = await cartService.recoverAbandonedCart(recoveryToken);

    if (!result.success || !result.data) {
      console.error('[Cart Recovery POST] Failed to recover cart:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to recover cart',
        },
        { status: result.error === 'Invalid or expired recovery link' ? 404 : 500 }
      );
    }

    const { cartId, items, total, email } = result.data;

    console.log(`[Cart Recovery POST] Successfully recovered cart ${cartId} for ${email} with ${items.length} items`);

    // Return cart data for frontend to restore
    return NextResponse.json({
      success: true,
      data: {
        cartId,
        items,
        total,
        email,
        message: 'Cart recovered successfully',
      },
    });
  } catch (error) {
    console.error('[Cart Recovery POST] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to recover cart: ${error}`,
      },
      { status: 500 }
    );
  }
}

// Enable dynamic routing
export const dynamic = 'force-dynamic';
