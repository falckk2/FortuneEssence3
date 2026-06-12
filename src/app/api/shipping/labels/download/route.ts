export const dynamic = 'force-dynamic'
/**
 * Shipping Label Download API
 *
 * GET /api/shipping/labels/download?orderId=xyz - Download PDF
 */

import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { IShippingService, IOrderService } from '@/interfaces';
import { getSupabaseServer } from '@/lib/supabase-server';

const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);
const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
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

    // Labels contain the recipient's name and address — only admins or the
    // order's owner may download them.
    if (!session.user.isAdmin) {
      const orderResult = await orderService.getOrder(orderId);
      if (!orderResult.success || orderResult.data?.customerId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Shipping label not found' },
          { status: 404 }
        );
      }
    }

    const labelResult = await shippingService.getShippingLabel(orderId);

    if (!labelResult.success || !labelResult.data) {
      return NextResponse.json(
        { success: false, error: 'Shipping label not found' },
        { status: 404 }
      );
    }

    const label = labelResult.data;

    // label_pdf_url holds the object path inside the private storage bucket.
    const { data: pdfBlob, error: storageError } = await getSupabaseServer()
      .storage
      .from('shipping-labels')
      .download(label.labelPdfUrl);

    if (storageError || !pdfBlob) {
      console.error('Label PDF not found in storage:', storageError);
      return NextResponse.json(
        { success: false, error: 'PDF file not found' },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(await pdfBlob.arrayBuffer()), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="shipping-label-${label.trackingNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Label download error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
