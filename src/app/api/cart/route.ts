export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { ICartService } from '@/interfaces';
import { SessionHelper } from '@/utils/helpers';

const cartService = container.resolve<ICartService>(TOKENS.ICartService);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = request.headers.get('x-session-id');

    if (!session?.user?.id && !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session required' },
        { status: 401 }
      );
    }

    const result = await cartService.getCart(
      session?.user?.id,
      sessionId || undefined
    );

    if (!result.success) {
      console.error('Cart GET error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = request.headers.get('x-session-id') || SessionHelper.generateSessionId();
    const body = await request.json();

    if (!session?.user?.id && !request.headers.get('x-session-id')) {
      return NextResponse.json(
        { success: false, error: 'Session required' },
        { status: 401 }
      );
    }

    const { action, productId, quantity, cartId, cartItemId } = body;

    const cartResult = await cartService.getCart(
      session?.user?.id,
      sessionId
    );

    if (!cartResult.success || !cartResult.data) {
      console.error('Cart POST - failed to get cart:', cartResult.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (cartId && cartId !== cartResult.data.id) {
      console.warn('[DEBUG-ISSUE-044] Rejected cartId that does not match session cart', {
        suppliedCartId: cartId,
        ownedCartId: cartResult.data.id,
        userId: session?.user?.id ?? null,
        action,
      });
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const targetCartId = cartResult.data.id;

    let result;

    switch (action) {
      case 'add': {
        if (!productId || !quantity) {
          return NextResponse.json(
            { success: false, error: 'Product ID and quantity are required' },
            { status: 400 }
          );
        }
        result = await cartService.addItem(targetCartId, {
          productId,
          quantity,
          price: 0,
        });
        break;
      }

      case 'add-bundle': {
        if (!body.bundleProductId || !body.selectedProductIds) {
          return NextResponse.json(
            { success: false, error: 'Bundle product ID and selected product IDs are required' },
            { status: 400 }
          );
        }
        const bundleQuantity = body.quantity || 1;
        result = await cartService.addBundleToCart(
          targetCartId,
          body.bundleProductId,
          body.selectedProductIds,
          bundleQuantity
        );
        break;
      }

      case 'remove': {
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'Product ID is required' },
            { status: 400 }
          );
        }
        result = await cartService.removeItem(targetCartId, productId, cartItemId);
        break;
      }

      case 'update': {
        if (!productId || quantity === undefined) {
          return NextResponse.json(
            { success: false, error: 'Product ID and quantity are required' },
            { status: 400 }
          );
        }
        result = await cartService.updateQuantity(targetCartId, productId, quantity, cartItemId);
        break;
      }

      case 'clear': {
        result = await cartService.clearCart(targetCartId);
        if (result.success) {
          return NextResponse.json({
            success: true,
            message: 'Cart cleared successfully',
          });
        }
        break;
      }

      case 'validate': {
        const validationResult = await cartService.validateCartItems(targetCartId);
        return NextResponse.json({
          success: validationResult.success,
          data: validationResult.data,
        });
      }

      case 'sync-prices': {
        result = await cartService.syncCartPrices(targetCartId);
        break;
      }

      case 'merge': {
        if (!session?.user?.id) {
          return NextResponse.json(
            { success: false, error: 'User must be logged in to merge cart' },
            { status: 401 }
          );
        }
        result = await cartService.mergeGuestCart(sessionId, session.user.id);
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!result?.success) {
      console.error('Cart POST action failed:', action, result?.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: result.data,
    });

    if (!session?.user?.id && sessionId) {
      response.headers.set('x-session-id', sessionId);
    }

    return response;
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
