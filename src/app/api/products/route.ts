import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/config/di-container';
import { TOKENS } from '@/config/di-container';
import { IProductService, ProductSearchParams } from '@/interfaces/services';
import '@/config/di-init'; // Initialize DI container

export async function GET(request: NextRequest) {
  const productService = container.resolve<IProductService>(TOKENS.IProductService);
  try {
    const { searchParams } = new URL(request.url);
    
    const params: ProductSearchParams = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') === 'true' || undefined,
      search: searchParams.get('search') || undefined,
      locale: (searchParams.get('locale') as 'sv' | 'en') || 'sv',
    };

    const result = await productService.getProducts(params);

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
    console.error('Products API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}