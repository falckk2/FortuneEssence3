import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/services/products/ProductService';

const productService = new ProductService();

export async function GET(request: NextRequest) {
  try {
    const result = await productService.getProductCategories();

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
    console.error('Categories API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}