import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import { TOKENS } from '@/config/di-container';
import type { IBundleService } from '@/interfaces';

// GET /api/bundles/[id]/eligible-products - Get products eligible for this bundle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const bundleService = container.resolve<IBundleService>(TOKENS.IBundleService);
    const { id } = await params;

    const result = await bundleService.getEligibleProducts(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
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
