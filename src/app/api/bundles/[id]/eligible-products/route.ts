import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import type { IBundleService } from '@/interfaces';

const bundleService = container.resolve<IBundleService>(TOKENS.IBundleService);

// GET /api/bundles/[id]/eligible-products - Get products eligible for this bundle
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await bundleService.getEligibleProducts(id);

    if (!result.success) {
      console.error('Eligible products service error:', result.error);
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
    console.error('Eligible products API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
