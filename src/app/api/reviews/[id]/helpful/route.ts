export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { IReviewRepository } from '@/repositories/reviews/ReviewRepository';
import { container, TOKENS } from '@/config/di-container';

const reviewRepository = container.resolve<IReviewRepository>(TOKENS.IReviewRepository);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  _request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Voting requires a session — one vote per customer per review.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Du måste vara inloggad för att rösta' },
        { status: 401 }
      );
    }

    const result = await reviewRepository.markHelpful(id, session.user.id);

    if (!result.success) {
      if (result.error === 'You have already marked this review as helpful') {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      if (result.error === 'Review not found') {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 404 }
        );
      }
      console.error('Mark review as helpful failed:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Mark review as helpful error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
