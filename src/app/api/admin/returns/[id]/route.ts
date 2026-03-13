import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { IReturnService } from '@/interfaces/services';
import type { ApiResponse, Return } from '@/types';

const returnService = container.resolve<IReturnService>(TOKENS.IReturnService);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const result = await returnService.getReturnById(id);

    if (!result.success) {
      const isNotFound = result.error?.toLowerCase().includes('not found');
      if (isNotFound) {
        return NextResponse.json({ success: false, error: 'Return not found' }, { status: 404 });
      }
      console.error('Failed to fetch return:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Failed to fetch return:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { action, adminNotes, reason } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required (approve, reject, receive, refund, mark-refunded)' },
        { status: 400 }
      );
    }

    let result: ApiResponse<Return>;

    switch (action) {
      case 'approve':
        result = await returnService.approveReturn(id, adminNotes);
        break;

      case 'reject':
        if (!reason) {
          return NextResponse.json(
            { success: false, error: 'reason is required when rejecting' },
            { status: 400 }
          );
        }
        result = await returnService.rejectReturn(id, reason);
        break;

      case 'receive':
        result = await returnService.markReceived(id, adminNotes);
        break;

      case 'refund':
        result = await returnService.processRefund(id);
        break;

      case 'mark-refunded':
        result = await returnService.markRefundedManually(id, adminNotes);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Must be one of: approve, reject, receive, refund, mark-refunded' },
          { status: 400 }
        );
    }

    if (!result.success) {
      console.error('Failed to update return:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Failed to update return:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
