import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import { IProductService } from '@/interfaces';
import '@/config/di-init';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const productService = container.resolve<IProductService>(TOKENS.IProductService);
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') as 'sv' | 'en') || 'sv';
    const { id } = await params;

    const result = await productService.getProductWithLocalization(id, locale);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: result.error === 'Product not found' ? 404 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}