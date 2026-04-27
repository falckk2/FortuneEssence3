export const dynamic = 'force-dynamic'
/**
 * Shipping Labels API
 *
 * POST /api/shipping/labels - Generate label
 * GET /api/shipping/labels?orderId=xyz - Get label data
 */

import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { IShippingService, IOrderService } from '@/interfaces';

const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);
const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

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
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderResult = await orderService.getOrder(orderId);

    if (!orderResult.success || !orderResult.data) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const labelResult = await shippingService.generateShippingLabel(orderResult.data);

    if (!labelResult.success) {
      console.error('Shipping labels POST - failed to generate label:', labelResult.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: labelResult.data });
  } catch (error) {
    console.error('Label generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
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
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const labelResult = await shippingService.getShippingLabel(orderId);

    if (!labelResult.success) {
      console.error('Shipping labels GET - failed to get label:', labelResult.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: labelResult.data });
  } catch (error) {
    console.error('Label retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
