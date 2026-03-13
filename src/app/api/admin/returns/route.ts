import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { IReturnService } from '@/interfaces/services';
import type { ReturnStatus } from '@/types';

const VALID_STATUSES: ReturnStatus[] = ['pending', 'approved', 'rejected', 'received', 'refunded', 'cancelled'];

const returnService = container.resolve<IReturnService>(TOKENS.IReturnService);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    if (searchParams.get('counts') === 'true') {
      const countsResult = await returnService.getStatusCounts();
      if (!countsResult.success) {
        console.error('Failed to get return status counts:', countsResult.error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: countsResult.data });
    }

    const statusParam = searchParams.get('status');
    const status = statusParam && VALID_STATUSES.includes(statusParam as ReturnStatus)
      ? (statusParam as ReturnStatus)
      : undefined;

    const parsePage = parseInt(searchParams.get('page') || '');
    const parseLimit = parseInt(searchParams.get('limit') || '');

    const filters = {
      status,
      page: Number.isFinite(parsePage) && parsePage > 0 ? parsePage : 1,
      limit: Number.isFinite(parseLimit) && parseLimit > 0 ? parseLimit : 20,
      search: searchParams.get('search') || undefined,
    };

    const result = await returnService.getAllReturns(filters);

    if (!result.success) {
      console.error('Failed to fetch returns:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Failed to fetch returns:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, reason, items } = body;

    if (!orderId || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderId, reason, and items[] are required' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'Each item must have productId and quantity >= 1' },
          { status: 400 }
        );
      }
    }

    const result = await returnService.createReturn(orderId, items, reason);

    if (!result.success) {
      console.error('Failed to create return:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Failed to create return:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    if (searchParams.get('orphaned') === 'preview') {
      const result = await returnService.findOrphanedReturns();
      if (!result.success) {
        console.error('Failed to find orphaned returns:', result.error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    if (searchParams.get('orphaned') === 'delete') {
      const result = await returnService.deleteOrphanedReturns();
      if (!result.success) {
        console.error('Failed to delete orphaned returns:', result.error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use ?orphaned=preview or ?orphaned=delete' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to process return deletion:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
