import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import { IReturnService } from '@/interfaces/services';
import { ReturnStatus } from '@/types';

const VALID_STATUSES: ReturnStatus[] = ['pending', 'approved', 'rejected', 'received', 'refunded', 'cancelled'];

function getReturnService() {
  return container.resolve<IReturnService>(TOKENS.IReturnService);
}

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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const returnService = getReturnService();
    const { searchParams } = new URL(request.url);

    // Lightweight counts-only endpoint for stat cards
    if (searchParams.get('counts') === 'true') {
      const countsResult = await returnService.getStatusCounts();
      return NextResponse.json(countsResult, {
        status: countsResult.success ? 200 : 500,
      });
    }

    const statusParam = searchParams.get('status');
    const status = statusParam && VALID_STATUSES.includes(statusParam as ReturnStatus)
      ? (statusParam as ReturnStatus)
      : undefined;

    const filters = {
      status,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
    };

    const result = await returnService.getAllReturns(filters);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const returnService = getReturnService();
    const body = await request.json();

    const { orderId, reason, items } = body;

    if (!orderId || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderId, reason, and items[] are required' },
        { status: 400 }
      );
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'Each item must have productId and quantity >= 1' },
          { status: 400 }
        );
      }
    }

    const result = await returnService.createReturn(orderId, items, reason);

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const returnService = getReturnService();
    const { searchParams } = new URL(request.url);

    if (searchParams.get('orphaned') === 'preview') {
      const result = await returnService.findOrphanedReturns();
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    if (searchParams.get('orphaned') === 'delete') {
      const result = await returnService.deleteOrphanedReturns();
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use ?orphaned=preview or ?orphaned=delete' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}
