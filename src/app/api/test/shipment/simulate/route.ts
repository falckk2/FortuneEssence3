import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import { IShipmentSimulationService } from '@/interfaces/test';

/**
 * SHIPMENT SIMULATION API
 *
 * This endpoint simulates shipment status progression for testing.
 * It allows you to manually progress an order through different shipment statuses.
 *
 * REFACTORED: Now follows SOLID principles
 * - Single Responsibility: Route handler only handles HTTP concerns
 * - Dependency Inversion: Depends on IShipmentSimulationService abstraction
 * - Open/Closed: Status progression logic extensible via Strategy Pattern
 *
 * Use this to test order tracking, status updates, and notifications.
 */

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { orderId, action, status } = body;

    // Validate required parameters
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required',
      }, { status: 400 });
    }

    // Resolve the shipment simulation service from DI container
    const shipmentSimulationService = container.resolve<IShipmentSimulationService>(
      TOKENS.IShipmentSimulationService
    );

    // Delegate to appropriate service method based on action
    let result;

    switch (action) {
      case 'next-status':
        result = await shipmentSimulationService.progressToNextStatus(orderId);
        break;

      case 'set-status':
        if (!status) {
          return NextResponse.json({
            success: false,
            error: 'Status is required for set-status action',
          }, { status: 400 });
        }
        result = await shipmentSimulationService.setOrderStatus(orderId, status);
        break;

      case 'simulate-delivery':
        result = await shipmentSimulationService.simulateCompleteDelivery(orderId);
        break;

      case 'generate-tracking':
        result = await shipmentSimulationService.generateTrackingEvents(orderId);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: next-status, set-status, simulate-delivery, or generate-tracking',
        }, { status: 400 });
    }

    // Return appropriate HTTP response based on service result
    if (result.success) {
      return NextResponse.json({
        success: true,
        testMode: true,
        data: result.data,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: result.error?.includes('not found') ? 404 : 400 });
    }
  } catch (error) {
    console.error('🧪 TEST MODE: Shipment simulation error:', error);
    return NextResponse.json({
      success: false,
      error: `Shipment simulation failed: ${error}`,
    }, { status: 500 });
  }
}

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

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({
      success: false,
      error: 'Order ID is required',
    }, { status: 400 });
  }

  try {
    const orderRepository = container.resolve<any>(TOKENS.IOrderRepository);
    const orderResult = await orderRepository.findById(orderId);

    if (!orderResult.success) {
      return NextResponse.json({
        success: false,
        error: `Order not found: ${orderResult.error}`,
      }, { status: 404 });
    }

    const order = orderResult.data!;

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        currentStatus: order.status,
        trackingNumber: order.trackingNumber,
        order,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Failed to get order status: ${error}`,
    }, { status: 500 });
  }
}
