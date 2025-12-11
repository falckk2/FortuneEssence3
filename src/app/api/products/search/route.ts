import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { IProductService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const productService = container.resolve<IProductService>(TOKENS.IProductService);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const locale = (searchParams.get('locale') as 'sv' | 'en') || 'sv';

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    const result = await productService.searchProducts(query.trim(), locale);

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
      query: query.trim(),
      resultsCount: result.data?.length || 0,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}