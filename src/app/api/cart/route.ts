import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { container, TOKENS } from '@/config/di-container';
import { ICartService } from '@/interfaces/services';
import { SessionHelper } from '@/utils/helpers';
import '@/config/di-init';

export async function GET(request: NextRequest) {
  try {
    const cartService = container.resolve<ICartService>(TOKENS.ICartService);
    const session = await getServerSession(authOptions);
    const sessionId = request.headers.get('x-session-id');

    if (!session?.user?.id && !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session required',
        },
        { status: 401 }
      );
    }

    const result = await cartService.getCart(
      session?.user?.id,
      sessionId || undefined
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
    console.error('Cart API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cartService = container.resolve<ICartService>(TOKENS.ICartService);
    const session = await getServerSession(authOptions);
    const sessionId = request.headers.get('x-session-id') || SessionHelper.generateSessionId();
    const body = await request.json();

    const { action, productId, quantity, cartId } = body;

    if (!cartId && !session?.user?.id && !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session required',
        },
        { status: 401 }
      );
    }

    let result;
    let targetCartId = cartId;

    // If no cartId provided, get or create cart
    if (!targetCartId) {
      const cartResult = await cartService.getCart(
        session?.user?.id,
        sessionId
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

    switch (action) {
      case 'add':
        if (!productId || !quantity) {
          return NextResponse.json(
            {
              success: false,
              error: 'Product ID and quantity are required',
            },
            { status: 400 }
          );
        }

        result = await cartService.addItem(targetCartId, {
          productId,
          quantity,
          price: 0, // Price will be fetched from product
        });
        break;

      case 'remove':
        if (!productId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Product ID is required',
            },
            { status: 400 }
          );
        }

        result = await cartService.removeItem(targetCartId, productId);
        break;

      case 'update':
        if (!productId || quantity === undefined) {
          return NextResponse.json(
            {
              success: false,
              error: 'Product ID and quantity are required',
            },
            { status: 400 }
          );
        }

        result = await cartService.updateQuantity(targetCartId, productId, quantity);
        break;

      case 'clear':
        result = await cartService.clearCart(targetCartId);
        if (result.success) {
          return NextResponse.json({
            success: true,
            message: 'Cart cleared successfully',
          });
        }
        break;

      case 'validate':
        const validationResult = await cartService.validateCartItems(targetCartId);
        return NextResponse.json({
          success: validationResult.success,
          data: validationResult.data,
          error: validationResult.error,
        });

      case 'sync-prices':
        result = await cartService.syncCartPrices(targetCartId);
        break;

      case 'merge':
        if (!session?.user?.id) {
          return NextResponse.json(
            {
              success: false,
              error: 'User must be logged in to merge cart',
            },
            { status: 401 }
          );
        }

        result = await cartService.mergeGuestCart(sessionId, session.user.id);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }

    if (!result?.success) {
      return NextResponse.json(
        {
          success: false,
          error: result?.error || 'Operation failed',
        },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: result.data,
    });

    // Set session ID in response header for guest users
    if (!session?.user?.id && sessionId) {
      response.headers.set('x-session-id', sessionId);
    }

    return response;
  } catch (error) {
    console.error('Cart API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}