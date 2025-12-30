/**
 * Shipping Labels API
 *
 * POST /api/shipping/labels - Generate label
 * GET /api/shipping/labels?orderId=xyz - Get label data
 */

import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import { IShippingService, IOrderService } from '@/interfaces';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
        },
        { status: 400 }
      );
    }

    // Get order
    const orderService = container.resolve<IOrderService>('IOrderService');
    const orderResult = await orderService.getOrderById(orderId);

    if (!orderResult.success || !orderResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Generate label
    const shippingService = container.resolve<IShippingService>('IShippingService');
    const labelResult = await shippingService.generateShippingLabel(orderResult.data);

    if (!labelResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: labelResult.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: labelResult.data,
    });
  } catch (error) {
    console.error('Label generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate shipping label',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
        },
        { status: 400 }
      );
    }

    // Get label
    const shippingService = container.resolve<IShippingService>('IShippingService');
    const labelResult = await shippingService.getShippingLabel(orderId);

    if (!labelResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: labelResult.error,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: labelResult.data,
    });
  } catch (error) {
    console.error('Label retrieval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve shipping label',
      },
      { status: 500 }
    );
  }
}
