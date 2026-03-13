import '@/config/di-init';
import { NextResponse } from 'next/server';
import type { IProductService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const productService = container.resolve<IProductService>(TOKENS.IProductService);

export async function GET() {
  try {
    const result = await productService.getFeaturedProducts();

    if (!result.success) {
      console.error('Featured products GET - failed to get featured products:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Featured products GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}