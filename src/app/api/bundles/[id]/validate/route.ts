import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import type { IBundleService } from '@/interfaces';

const bundleService = container.resolve<IBundleService>(TOKENS.IBundleService);

// POST /api/bundles/[id]/validate - Validate bundle selection before adding to cart
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { selectedProductIds, quantities } = body;

    if (!selectedProductIds || !Array.isArray(selectedProductIds)) {
      return NextResponse.json(
        { success: false, error: 'selectedProductIds array is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const result = await bundleService.validateBundleSelection(
      id,
      selectedProductIds,
      quantities
    );

    if (!result.success) {
      console.error('Bundle validation service error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Bundle validation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
