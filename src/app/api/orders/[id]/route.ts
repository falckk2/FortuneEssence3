import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { IOrderService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await orderService.getOrder(id);

    if (!result.success || !result.data) {
      console.error('Order GET - failed to get order:', result.error);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!session.user.isAdmin && result.data.customerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Order GET error:', error);
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
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const orderResult = await orderService.getOrder(id);
    if (!orderResult.success || !orderResult.data) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const isAdmin = session.user.isAdmin === true;

    if (!isAdmin) {
      if (orderResult.data.customerId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }

      const allowedCustomerStatuses = ['cancelled'];
      if (!allowedCustomerStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Status update not allowed' },
          { status: 403 }
        );
      }
    }

    const result = await orderService.updateOrderStatus(id, status);

    if (!result.success) {
      console.error('Order PATCH - failed to update status:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Order PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
