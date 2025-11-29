import { NextRequest, NextResponse } from 'next/server';

// Mock tracking data for demonstration
const mockOrderTracking = {
  'ORD-001': {
    orderId: 'ord-abc123',
    orderNumber: 'ORD-001',
    status: 'shipped',
    trackingNumber: 'PN1234567890SE',
    carrier: 'PostNord',
    estimatedDelivery: '2024-11-18T12:00:00Z',
    items: [
      {
        id: 'item-1',
        productName: 'Lavendelolja 10ml',
        quantity: 2,
        price: 149.00,
      },
      {
        id: 'item-2',
        productName: 'Pepparmyntaolja 10ml',
        quantity: 1,
        price: 139.00,
      },
    ],
    total: 437.00,
    shippingAddress: {
      street: 'Storgatan 12',
      city: 'Stockholm',
      postalCode: '11455',
      country: 'Sverige',
    },
    trackingHistory: [
      {
        status: 'Paket i transit',
        location: 'Stockholm, Sverige',
        timestamp: '2024-11-16T14:30:00Z',
        description: 'Paketet är på väg till destinationen',
      },
      {
        status: 'Paket sorterat',
        location: 'Göteborg Terminal, Sverige',
        timestamp: '2024-11-16T09:15:00Z',
        description: 'Paketet har sorterats vid Göteborg terminal',
      },
      {
        status: 'Paket hämtat från avsändare',
        location: 'Malmö, Sverige',
        timestamp: '2024-11-15T16:45:00Z',
        description: 'Paketet har hämtats från avsändaren',
      },
      {
        status: 'Fraktetikett skapad',
        location: 'Malmö, Sverige',
        timestamp: '2024-11-15T10:20:00Z',
        description: 'Fraktetikett har skapats och order bekräftad',
      },
    ],
  },
};

const mockTrackingNumbers: { [key: string]: string } = {
  'PN1234567890SE': 'ORD-001',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const trackingNumber = searchParams.get('trackingNumber');

    if (!orderId && !trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'Order ID or tracking number is required' },
        { status: 400 }
      );
    }

    // TODO: Implement database lookup
    /*
    let order;

    if (trackingNumber) {
      // Find order by tracking number
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            product:products (
              id,
              translations
            )
          ),
          shipping_address:addresses (
            street,
            city,
            postalCode,
            country
          )
        `)
        .eq('trackingNumber', trackingNumber)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: 'Order not found with this tracking number' },
          { status: 404 }
        );
      }

      order = data;
    } else if (orderId) {
      // Find order by order ID (could be internal ID or order number)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            product:products (
              id,
              translations
            )
          ),
          shipping_address:addresses (
            street,
            city,
            postalCode,
            country
          )
        `)
        .or(`id.eq.${orderId},orderNumber.eq.${orderId}`)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      order = data;
    }

    // Fetch tracking history from carrier API or database
    let trackingHistory = [];

    if (order.trackingNumber && order.carrier) {
      // In production, fetch from carrier API
      // For now, get from database
      const { data: history } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('trackingNumber', order.trackingNumber)
        .order('timestamp', { ascending: false });

      trackingHistory = history || [];
    }

    // Format response
    const trackingData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      items: order.order_items.map(item => ({
        id: item.id,
        productName: item.product.translations.sv.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
      shippingAddress: order.shipping_address,
      trackingHistory,
    };

    return NextResponse.json({
      success: true,
      data: trackingData
    });
    */

    // For now, return mock data
    let orderKey: string | null = null;

    if (orderId) {
      orderKey = orderId;
    } else if (trackingNumber && mockTrackingNumbers[trackingNumber]) {
      orderKey = mockTrackingNumbers[trackingNumber];
    }

    if (orderKey && mockOrderTracking[orderKey as keyof typeof mockOrderTracking]) {
      return NextResponse.json({
        success: true,
        data: mockOrderTracking[orderKey as keyof typeof mockOrderTracking]
      });
    }

    return NextResponse.json(
      { success: false, error: 'Order not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Track order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track order' },
      { status: 500 }
    );
  }
}
