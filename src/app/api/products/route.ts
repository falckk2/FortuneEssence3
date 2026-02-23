import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/config/di-container';
import { TOKENS } from '@/config/di-container';
import { IProductService, IProductRepository, ProductSearchParams } from '@/interfaces';
import '@/config/di-init'; // Initialize DI container
import { getToken } from 'next-auth/jwt';

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

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const productRepository = container.resolve<IProductRepository>(TOKENS.IProductRepository);
  try {
    const body = await request.json();
    const result = await productRepository.create(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}