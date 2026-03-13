import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { IWishlistRepository } from '@/repositories/wishlist/WishlistRepository';

const wishlistRepository = container.resolve<IWishlistRepository>(TOKENS.IWishlistRepository);

// GET /api/wishlist - Get user's wishlist
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await wishlistRepository.findByCustomerId(session.user.id);

    if (!result.success) {
      console.error('Wishlist GET - failed to get wishlist:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add/Remove items from wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, productId } = body;

    if (!action || !productId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'add') {
      const result = await wishlistRepository.add(session.user.id, productId);
      if (!result.success) {
        console.error('Wishlist POST - failed to add item:', result.error);
        return NextResponse.json(
          { success: false, error: 'Internal server error' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, data: result.data });
    } else if (action === 'remove') {
      const result = await wishlistRepository.remove(session.user.id, productId);
      if (!result.success) {
        console.error('Wishlist POST - failed to remove item:', result.error);
        return NextResponse.json(
          { success: false, error: 'Internal server error' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    } else if (action === 'clear') {
      const result = await wishlistRepository.clear(session.user.id);
      if (!result.success) {
        console.error('Wishlist POST - failed to clear wishlist:', result.error);
        return NextResponse.json(
          { success: false, error: 'Internal server error' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
