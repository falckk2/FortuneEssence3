export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { IReviewRepository } from '@/repositories/reviews/ReviewRepository';
import { container, TOKENS } from '@/config/di-container';

const reviewRepository = container.resolve<IReviewRepository>(TOKENS.IReviewRepository);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 50;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const result = await reviewRepository.findByProductId(productId, limit);

    if (!result.success) {
      console.error('Get reviews failed:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get reviews error:', error);
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
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, rating, title, comment } = body;

    // Validation
    if (!productId || !rating || !title || !comment) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (title.trim().length < 5 || title.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: 'Title must be between 5 and 100 characters' },
        { status: 400 }
      );
    }

    if (comment.trim().length < 20 || comment.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Comment must be between 20 and 1000 characters' },
        { status: 400 }
      );
    }

    const result = await reviewRepository.create({
      productId,
      customerId: session.user.id,
      rating: Math.round(rating),
      title: title.trim(),
      comment: comment.trim(),
    });

    if (!result.success) {
      if (result.error === 'You have already reviewed this product') {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      console.error('Create review failed:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Review submitted successfully', data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
