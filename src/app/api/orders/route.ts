import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { IOrderService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = session.user.id;

    switch (action) {
      case 'user-orders':
        return handleGetUserOrders(userId);
      
      case 'statistics':
        return handleGetOrderStatistics(userId);
      
      case 'recent':
        const days = parseInt(searchParams.get('days') || '30');
        const limit = parseInt(searchParams.get('limit') || '50');
        return handleGetRecentOrders(days, limit);
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
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
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Orders POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID and status are required',
        },
        { status: 400 }
      );
    }

    return handleUpdateOrderStatus(orderId, status, session.user.id);

  } catch (error) {
    console.error('Orders PATCH API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function handleCreateOrder(body: any, userId: string) {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, shippingRateId } = body;

    if (!items || !shippingAddress || !billingAddress || !paymentMethod || !shippingRateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required order data',
        },
        { status: 400 }
      );
    }

    const orderData = {
      customerId: userId,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingRateId,
    };

    const result = await orderService.createOrder(orderData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create order: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleGetUserOrders(userId: string) {
  try {
    const result = await orderService.getUserOrders(userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get user orders: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleGetOrderStatistics(userId: string) {
  try {
    const result = await orderService.getOrderStatistics(userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get order statistics: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleGetRecentOrders(days: number, limit: number) {
  try {
    const result = await orderService.getRecentOrders(days, limit);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get recent orders: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleCancelOrder(orderId: string, userId: string) {
  try {
    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
        },
        { status: 400 }
      );
    }

    // Verify order belongs to user
    const orderResult = await orderService.getOrder(orderId);
    if (!orderResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    if (orderResult.data!.customerId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      );
    }

    const result = await orderService.cancelOrder(orderId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to cancel order: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleTrackOrder(trackingNumber: string) {
  try {
    if (!trackingNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tracking number is required',
        },
        { status: 400 }
      );
    }

    const result = await orderService.trackOrder(trackingNumber);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to track order: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleUpdateOrderStatus(orderId: string, status: string, userId: string) {
  try {
    // Verify order belongs to user (for status updates that customers can make)
    const orderResult = await orderService.getOrder(orderId);
    if (!orderResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    if (orderResult.data!.customerId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      );
    }

    // Only allow certain status updates from customers
    const allowedCustomerStatuses = ['cancelled'];
    if (!allowedCustomerStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status update not allowed',
        },
        { status: 403 }
      );
    }

    const result = await orderService.updateOrderStatus(orderId, status);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update order status: ${error}`,
      },
      { status: 500 }
    );
  }
}