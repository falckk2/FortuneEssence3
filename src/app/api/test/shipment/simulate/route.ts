export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { IShipmentSimulationService } from '@/interfaces/test';
import { getTestModeStatus } from '@/lib/testMode';

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

const shipmentSimulationService = container.resolve<IShipmentSimulationService>(
  TOKENS.IShipmentSimulationService
);
const orderRepository = container.resolve<any>(TOKENS.IOrderRepository);

export async function POST(request: NextRequest) {
  if (!(await getTestModeStatus())) {
    return NextResponse.json(
      { success: false, error: 'Test endpoints are disabled in production' },
      { status: 403 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, action, status } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

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

    if (!result.success) {
      const isNotFound = result.error?.toLowerCase().includes('not found');
      if (isNotFound) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      console.error('Shipment simulation - failed to process action:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, testMode: true, data: result.data });
  } catch (error) {
    console.error('Shipment simulation POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!(await getTestModeStatus())) {
    return NextResponse.json(
      { success: false, error: 'Test endpoints are disabled in production' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const orderResult = await orderRepository.findById(orderId);

    if (!orderResult.success || !orderResult.data) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.data;

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
    console.error('Shipment simulation GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
