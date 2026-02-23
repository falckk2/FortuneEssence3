import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import { IReturnService } from '@/interfaces/services';

function getReturnService() {
  return container.resolve<IReturnService>(TOKENS.IReturnService);
}

export async function GET(
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const returnService = getReturnService();
    const { id } = await params;

    const result = await returnService.getReturnById(id);

    return NextResponse.json(result, {
      status: result.success ? 200 : 404,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const returnService = getReturnService();
    const { id } = await params;
    const body = await request.json();

    const { action, adminNotes, reason } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required (approve, reject, receive, refund, mark-refunded)' },
        { status: 400 }
      );
    }

    let result;

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

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}
