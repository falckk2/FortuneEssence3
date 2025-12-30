import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';

/**
 * TEST ORDERS API
 *
 * This endpoint provides utilities for viewing and managing test orders.
 * Use this to verify that orders are stored correctly in the database.
 */

export async function GET(request: NextRequest) {
  // Check if we're in development/test mode
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
    return NextResponse.json(
      {
        success: false,
        error: 'Test endpoints are disabled in production',
      },
      { status: 403 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId') || session?.user?.id;

    const orderRepository = container.resolve<any>(TOKENS.IOrderRepository);

    switch (action) {
      case 'get-order':
        if (!orderId) {
          return NextResponse.json({
            success: false,
            error: 'Order ID is required',
          }, { status: 400 });
        }
        return await getOrderDetails(orderId, orderRepository);

      case 'list-user-orders':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'User ID is required',
          }, { status: 400 });
        }
        return await listUserOrders(userId, orderRepository);

      case 'list-all-test-orders':
        return await listAllTestOrders(orderRepository);

      case 'order-statistics':
        return await getOrderStatistics(userId, orderRepository);

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: get-order, list-user-orders, list-all-test-orders, or order-statistics',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('🧪 TEST MODE: Error in test orders API:', error);
    return NextResponse.json({
      success: false,
      error: `Test orders API failed: ${error}`,
    }, { status: 500 });
  }
}

async function getOrderDetails(orderId: string, orderRepository: any) {
  const orderResult = await orderRepository.findById(orderId);

  if (!orderResult.success) {
    return NextResponse.json({
      success: false,
      error: `Order not found: ${orderResult.error}`,
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    testMode: true,
    data: {
      order: orderResult.data,
      message: '✅ Order retrieved successfully',
    },
  });
}

async function listUserOrders(userId: string, orderRepository: any) {
  const ordersResult = await orderRepository.findByCustomerId(userId);

  if (!ordersResult.success) {
    return NextResponse.json({
      success: false,
      error: `Failed to get user orders: ${ordersResult.error}`,
    }, { status: 400 });
  }

  const orders = ordersResult.data || [];

  return NextResponse.json({
    success: true,
    testMode: true,
    data: {
      userId,
      orderCount: orders.length,
      orders: orders.map((order: any) => ({
        id: order.id,
        status: order.status,
        total: order.total,
        paymentMethod: order.paymentMethod,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        items: order.items,
      })),
      message: `✅ Found ${orders.length} orders for user ${userId}`,
    },
  });
}

async function listAllTestOrders(orderRepository: any) {
  // Get recent orders (last 30 days)
  const ordersResult = await orderRepository.getRecentOrders(30, 100);

  if (!ordersResult.success) {
    return NextResponse.json({
      success: false,
      error: `Failed to get orders: ${ordersResult.error}`,
    }, { status: 400 });
  }

  const orders = ordersResult.data || [];

  // Filter for test orders (payment method contains '_test')
  const testOrders = orders.filter((order: any) =>
    order.paymentMethod?.includes('_test') || order.paymentId?.includes('test_payment')
  );

  return NextResponse.json({
    success: true,
    testMode: true,
    data: {
      totalOrders: orders.length,
      testOrders: testOrders.length,
      orders: testOrders.map((order: any) => ({
        id: order.id,
        customerId: order.customerId,
        status: order.status,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentId: order.paymentId,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
      })),
      message: `✅ Found ${testOrders.length} test orders`,
    },
  });
}

async function getOrderStatistics(userId: string | undefined, orderRepository: any) {
  const statsResult = await orderRepository.getOrderStatistics(userId);

  if (!statsResult.success) {
    return NextResponse.json({
      success: false,
      error: `Failed to get statistics: ${statsResult.error}`,
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    testMode: true,
    data: {
      userId: userId || 'all',
      statistics: statsResult.data,
      message: '✅ Statistics retrieved successfully',
    },
  });
}

export async function DELETE(request: NextRequest) {
  // Check if we're in development/test mode
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
    return NextResponse.json(
      {
        success: false,
        error: 'Test endpoints are disabled in production',
      },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const orderRepository = container.resolve<any>(TOKENS.IOrderRepository);

    switch (action) {
      case 'delete-order':
        const orderId = searchParams.get('orderId');
        if (!orderId) {
          return NextResponse.json({
            success: false,
            error: 'Order ID is required',
          }, { status: 400 });
        }
        return await deleteOrder(orderId, orderRepository);

      case 'cleanup-test-orders':
        return await cleanupTestOrders(orderRepository);

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: delete-order or cleanup-test-orders',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('🧪 TEST MODE: Error deleting test orders:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to delete orders: ${error}`,
    }, { status: 500 });
  }
}

async function deleteOrder(orderId: string, orderRepository: any) {
  console.log(`🧪 TEST MODE: Deleting order ${orderId}`);

  const deleteResult = await orderRepository.delete(orderId);

  if (!deleteResult.success) {
    return NextResponse.json({
      success: false,
      error: `Failed to delete order: ${deleteResult.error}`,
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    testMode: true,
    data: {
      orderId,
      message: `✅ Order ${orderId} deleted successfully`,
    },
  });
}

async function cleanupTestOrders(orderRepository: any) {
  console.log(`🧪 TEST MODE: Cleaning up all test orders`);

  // Get all recent orders
  const ordersResult = await orderRepository.getRecentOrders(30, 1000);

  if (!ordersResult.success) {
    return NextResponse.json({
      success: false,
      error: `Failed to get orders: ${ordersResult.error}`,
    }, { status: 400 });
  }

  const orders = ordersResult.data || [];

  // Filter for test orders
  const testOrders = orders.filter((order: any) =>
    order.paymentMethod?.includes('_test') || order.paymentId?.includes('test_payment')
  );

  const deletedOrders = [];
  const failedDeletions = [];

  for (const order of testOrders) {
    const deleteResult = await orderRepository.delete(order.id);
    if (deleteResult.success) {
      deletedOrders.push(order.id);
    } else {
      failedDeletions.push({ orderId: order.id, error: deleteResult.error });
    }
  }

  return NextResponse.json({
    success: true,
    testMode: true,
    data: {
      totalTestOrders: testOrders.length,
      deleted: deletedOrders.length,
      failed: failedDeletions.length,
      deletedOrderIds: deletedOrders,
      failedDeletions,
      message: `✅ Cleaned up ${deletedOrders.length} test orders`,
    },
  });
}
