import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import { TOKENS } from '@/config/di-container';
import type { IBundleService } from '@/interfaces';
import '@/config/di-init';

// GET /api/bundles - Get all bundle configurations
export async function GET(request: NextRequest) {
  try {
    const bundleService = container.resolve<IBundleService>(TOKENS.IBundleService);

    const result = await bundleService.getAllBundleConfigurations();

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
    console.error('Bundles API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
