import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { CartService } from '@/services/cart/CartService';

const cartService = new CartService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = request.headers.get('x-session-id');
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');

    if (!cartId && !session?.user?.id && !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart ID or session required',
        },
        { status: 401 }
      );
    }

    let targetCartId = cartId;

    // If no cartId provided, get cart from session
    if (!targetCartId) {
      const cartResult = await cartService.getCart(
        session?.user?.id,
        sessionId || undefined
      );
      
      if (!cartResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: cartResult.error,
          },
          { status: 400 }
        );
      }

      targetCartId = cartResult.data!.id;
    }

    const result = await cartService.getCartSummary(targetCartId);

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
    console.error('Cart summary API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}