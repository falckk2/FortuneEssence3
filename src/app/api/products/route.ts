export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { IProductService, IProductRepository, ProductSearchParams } from '@/interfaces';

const productService = container.resolve<IProductService>(TOKENS.IProductService);
const productRepository = container.resolve<IProductRepository>(TOKENS.IProductRepository);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: ProductSearchParams = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice') as string) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice') as string) : undefined,
      inStock: searchParams.get('inStock') === 'true' || undefined,
      search: searchParams.get('search') || undefined,
      locale: (searchParams.get('locale') as 'sv' | 'en') || 'sv',
    };

    const result = await productService.getProducts(params);

    if (!result.success) {
      console.error('Products GET - failed to get products:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = await productRepository.create(body);

    if (!result.success) {
      console.error('Products POST - failed to create product:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
