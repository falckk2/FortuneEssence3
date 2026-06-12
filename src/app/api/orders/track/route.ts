export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import type { IOrderService, ICustomerRepository } from '@/interfaces';
import type { Order } from '@/types';
import type { TrackingInfo } from '@/interfaces/shipping';
import { container, TOKENS } from '@/config/di-container';

const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);
const customerRepository = container.resolve<ICustomerRepository>(TOKENS.ICustomerRepository);

/**
 * Public order tracking — the single canonical tracking endpoint.
 *
 * Two lookup modes:
 *   ?trackingNumber=X        — public; a tracking number is itself a bearer secret
 *   ?orderId=X&email=Y       — guest lookup; email acts as the second factor so a
 *                              leaked order ID alone discloses nothing (ISSUE-022)
 *
 * Both modes return a reduced field set (no totals, no full address) to minimise
 * information disclosure when tracking links are shared.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('trackingNumber');
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');

    if (trackingNumber) {
      return handleTrackByTrackingNumber(trackingNumber.trim());
    }

    if (orderId && email) {
      return handleTrackByOrderId(orderId.trim(), email);
    }

    return NextResponse.json(
      { success: false, error: 'Provide a tracking number, or an order number and email' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Track order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildTrackingResponse(order: Order, tracking: TrackingInfo | null) {
  return {
    orderId: order.id,
    orderNumber: order.id,
    status: order.status,
    trackingNumber: order.trackingNumber ?? null,
    carrier: order.carrier ?? null,
    estimatedDelivery: tracking?.estimatedDelivery ?? null,
    trackingHistory: (tracking?.history ?? []).map(event => ({
      status: event.status,
      location: event.location,
      timestamp: event.date,
      description: event.description,
    })),
  };
}

async function handleTrackByTrackingNumber(trackingNumber: string) {
  const result = await orderService.trackOrder(trackingNumber);

  if (!result.success || !result.data) {
    return NextResponse.json(
      { success: false, error: 'Order not found' },
      { status: 404 }
    );
  }

  const { order, tracking } = result.data;
  return NextResponse.json({
    success: true,
    data: buildTrackingResponse(order, tracking ?? null),
  });
}

async function handleTrackByOrderId(orderId: string, email: string) {
  const result = await orderService.getOrder(orderId);

  if (!result.success || !result.data) {
    return NextResponse.json(
      { success: false, error: 'Order not found' },
      { status: 404 }
    );
  }

  const order = result.data;

  // Verify the supplied email matches the customer on this order.
  // Return 404 on mismatch to avoid confirming the order exists.
  const customerResult = await customerRepository.findById(order.customerId);
  const customerEmail = (customerResult.data?.email ?? '').toLowerCase().trim();
  const suppliedEmail = email.toLowerCase().trim();
  if (!customerEmail || customerEmail !== suppliedEmail) {
    return NextResponse.json(
      { success: false, error: 'Order not found' },
      { status: 404 }
    );
  }

  // Enrich with shipment history when the order already has a tracking number.
  let tracking: TrackingInfo | null = null;
  if (order.trackingNumber) {
    const trackingResult = await orderService.trackOrder(order.trackingNumber);
    if (trackingResult.success && trackingResult.data) {
      tracking = trackingResult.data.tracking ?? null;
    }
  }

  return NextResponse.json({
    success: true,
    data: buildTrackingResponse(order, tracking),
  });
}
