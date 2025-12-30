/**
 * Shipping Label Download API
 *
 * GET /api/shipping/labels/download?orderId=xyz - Download PDF
 */

import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import { IShippingService } from '@/interfaces';
import fs from 'fs/promises';
import path from 'path';

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

    if (!labelResult.success || !labelResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shipping label not found',
        },
        { status: 404 }
      );
    }

    const label = labelResult.data;

    // Read PDF file
    const pdfPath = path.join(process.cwd(), 'public', label.labelPdfUrl);

    try {
      const pdfBuffer = await fs.readFile(pdfPath);

      // Return PDF file - convert Buffer to Uint8Array for NextResponse
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
        {
          success: false,
          error: 'PDF file not found',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Label download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download shipping label',
      },
      { status: 500 }
    );
  }
}
