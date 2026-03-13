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
import type { IShippingService } from '@/interfaces';
import fs from 'fs/promises';
import path from 'path';

const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

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

    const labelResult = await shippingService.getShippingLabel(orderId);

    if (!labelResult.success || !labelResult.data) {
      return NextResponse.json(
        { success: false, error: 'Shipping label not found' },
        { status: 404 }
      );
    }

    const label = labelResult.data;

    // Read PDF file
    const pdfPath = path.join(process.cwd(), 'public', label.labelPdfUrl);

    try {
      const pdfBuffer = await fs.readFile(pdfPath);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="shipping-label-${label.trackingNumber}.pdf"`,
        },
      });
    } catch (fileError) {
      console.error('PDF file not found:', fileError);
      return NextResponse.json(
        { success: false, error: 'PDF file not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Label download error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
