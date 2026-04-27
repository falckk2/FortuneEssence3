export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { IOrderService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Track-by-order doesn't require authentication
    if (action === 'track-by-order') {
      const orderNumber = searchParams.get('orderNumber');
      if (!orderNumber) {
        return NextResponse.json(
          { success: false, error: 'Order number is required' },
          { status: 400 }
        );
      }
      return handleTrackByOrderNumber(orderNumber);
    }

    // All other actions require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    switch (action) {
      case 'user-orders':
        return handleGetUserOrders(userId);

      case 'statistics':
        return handleGetOrderStatistics(userId);

      case 'recent': {
        if (!session.user.isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
          );
        }
        const daysParam = parseInt(searchParams.get('days') || '30');
        const limitParam = parseInt(searchParams.get('limit') || '50');
        const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50;
        return handleGetRecentOrders(days, limit);
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Orders GET error:', error);
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

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return handleCreateOrder(body, session.user.id);
      case 'cancel':
        return handleCancelOrder(body.orderId, session.user.id);
      case 'track':
        return handleTrackOrder(body.trackingNumber);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    return handleUpdateOrderStatus(orderId, status, session.user.id);
  } catch (error) {
    console.error('Orders PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCreateOrder(body: any, userId: string) {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, shippingRateId } = body;

    if (!items || !shippingAddress || !billingAddress || !paymentMethod || !shippingRateId) {
      return NextResponse.json(
        { success: false, error: 'Missing required order data' },
        { status: 400 }
      );
    }

    const result = await orderService.createOrder({
      customerId: userId,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingRateId,
    });

    if (!result.success) {
      console.error('Orders - failed to create order:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Orders - create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetUserOrders(userId: string) {
  try {
    const result = await orderService.getUserOrders(userId);

    if (!result.success) {
      console.error('Orders - failed to get user orders:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Orders - get user orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetOrderStatistics(userId: string) {
  try {
    const result = await orderService.getOrderStatistics(userId);

    if (!result.success) {
      console.error('Orders - failed to get order statistics:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Orders - get order statistics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetRecentOrders(days: number, limit: number) {
  try {
    const result = await orderService.getRecentOrders(days, limit);

    if (!result.success) {
      console.error('Orders - failed to get recent orders:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Orders - get recent orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCancelOrder(orderId: string, userId: string) {
  try {
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

    if (orderResult.data.customerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const result = await orderService.cancelOrder(orderId);

    if (!result.success) {
      console.error('Orders - failed to cancel order:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Orders - cancel order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTrackOrder(trackingNumber: string) {
  try {
    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'Tracking number is required' },
        { status: 400 }
      );
    }

    const result = await orderService.trackOrder(trackingNumber);

    if (!result.success) {
      console.error('Orders - failed to track order:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Orders - track order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUpdateOrderStatus(orderId: string, status: string, userId: string) {
  try {
    const orderResult = await orderService.getOrder(orderId);
    if (!orderResult.success || !orderResult.data) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (orderResult.data.customerId !== userId) {
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

    const result = await orderService.updateOrderStatus(orderId, status as import('@/types').OrderStatus);

    if (!result.success) {
      console.error('Orders - failed to update order status:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Orders - update order status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTrackByOrderNumber(orderNumber: string) {
  try {
    const result = await orderService.getOrder(orderNumber);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = result.data;

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier || 'PostNord',
      },
    });
  } catch (error) {
    console.error('Orders - track by order number error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
