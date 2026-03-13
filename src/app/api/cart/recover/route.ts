import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import type { ICartService } from '@/interfaces';

// GET /api/cart/recover?token={recoveryToken}
export async function GET(request: NextRequest) {
  try {
    const cartService = container.resolve<ICartService>(TOKENS.ICartService);
    const { searchParams } = new URL(request.url);
    const recoveryToken = searchParams.get('token');

    if (!recoveryToken) {
      return NextResponse.json(
        { success: false, error: 'Recovery token is required' },
        { status: 400 }
      );
    }

    console.log(`[Cart Recovery] Attempting to recover cart with token: ${recoveryToken}`);
    const result = await cartService.recoverAbandonedCart(recoveryToken);

    if (!result.success || !result.data) {
      console.error('[Cart Recovery] Failed to recover cart:', result.error);
      const isExpired =
        result.error === 'Invalid or expired recovery link' ||
        result.error === 'Recovery link has expired';
      return NextResponse.json(
        { success: false, error: isExpired ? result.error : 'Failed to recover cart' },
        { status: isExpired ? 404 : 500 }
      );
    }

    const { cartId, items, total, email } = result.data;
    console.log(`[Cart Recovery] Successfully recovered cart: ${cartId}`);

    return NextResponse.json({
      success: true,
      data: { cartId, items, total, email, message: 'Cart recovered successfully' },
    });
  } catch (error) {
    console.error('[Cart Recovery] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to recover cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart/recover - Alternative method accepting token in request body
export async function POST(request: NextRequest) {
  try {
    const cartService = container.resolve<ICartService>(TOKENS.ICartService);
    const body = await request.json();
    const { token: recoveryToken } = body;

    if (!recoveryToken) {
      return NextResponse.json(
        { success: false, error: 'Recovery token is required' },
        { status: 400 }
      );
    }

    const result = await cartService.recoverAbandonedCart(recoveryToken);

    if (!result.success || !result.data) {
      console.error('[Cart Recovery POST] Failed to recover cart:', result.error);
      const isExpired =
        result.error === 'Invalid or expired recovery link' ||
        result.error === 'Recovery link has expired';
      return NextResponse.json(
        { success: false, error: isExpired ? result.error : 'Failed to recover cart' },
        { status: isExpired ? 404 : 500 }
      );
    }

    const { cartId, items, total, email } = result.data;

    return NextResponse.json({
      success: true,
      data: { cartId, items, total, email, message: 'Cart recovered successfully' },
    });
  } catch (error) {
    console.error('[Cart Recovery POST] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
