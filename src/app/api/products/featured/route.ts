import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { IProductService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const productService = container.resolve<IProductService>(TOKENS.IProductService);

export async function GET(request: NextRequest) {
  try {
    const result = await productService.getFeaturedProducts();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Featured products API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}