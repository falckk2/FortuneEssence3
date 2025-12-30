import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import { TOKENS } from '@/config/di-container';
import type { IBundleService } from '@/interfaces';

// GET /api/bundles/[id] - Get bundle configuration by bundle product ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const bundleService = container.resolve<IBundleService>(TOKENS.IBundleService);
    const { id } = await params;

    const result = await bundleService.getBundleConfiguration(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Bundle API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
