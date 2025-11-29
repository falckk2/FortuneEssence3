import { NextRequest, NextResponse } from 'next/server';

// Mock reviews data for demonstration
// In production, this would be stored in the database
const mockReviews = [
  {
    id: 'rev-001',
    productId: 'lavender-oil-10ml',
    userId: 'user-001',
    userName: 'Anna S.',
    rating: 5,
    title: 'Fantastisk kvalitet!',
    comment: 'Denna lavendelolja är helt underbar. Doften är ren och naturlig, inte kemisk som vissa andra märken. Jag använder den i min diffuser varje kväll och sover mycket bättre nu. Kommer definitivt köpa igen!',
    verified: true,
    helpful: 12,
    createdAt: '2024-10-15T14:30:00Z',
  },
  {
    id: 'rev-002',
    productId: 'lavender-oil-10ml',
    userId: 'user-002',
    userName: 'Emma L.',
    rating: 4,
    title: 'Bra produkt',
    comment: 'Mycket nöjd med oljan. Doften är härlig och lugnar verkligen. Bara minuspoängen är att flaskan är ganska liten för priset, men kvaliteten är värd det.',
    verified: true,
    helpful: 8,
    createdAt: '2024-10-22T09:15:00Z',
  },
  {
    id: 'rev-003',
    productId: 'peppermint-oil-10ml',
    userId: 'user-003',
    userName: 'Sofia M.',
    rating: 5,
    title: 'Perfekt mot huvudvärk',
    comment: 'Använder denna vid huvudvärk och det fungerar verkligen! Blandad med lite kokosolja på tinningarna ger det omedelbar lindring. Stark men behaglig mintdoft.',
    verified: true,
    helpful: 15,
    createdAt: '2024-11-01T16:45:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // TODO: Fetch from database
    /*
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users (
          id,
          name
        )
      `)
      .eq('productId', productId)
      .eq('status', 'approved') // Only show approved reviews
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Check if reviews are from verified purchases
    const reviewsWithVerification = await Promise.all(
      reviews.map(async (review) => {
        const { data: order } = await supabase
          .from('orders')
          .select('id')
          .eq('userId', review.userId)
          .eq('status', 'delivered')
          .contains('items', [{ productId }])
          .single();

        return {
          ...review,
          userName: review.user.name,
          verified: !!order,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: reviewsWithVerification
    });
    */

    // For now, return mock data filtered by productId
    const filteredReviews = mockReviews
      .filter(r => r.productId === productId)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: filteredReviews
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user) {
    //   return NextResponse.json(
    //     { success: false, error: 'You must be logged in to submit a review' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { productId, rating, title, comment } = body;

    // Validation
    if (!productId || !rating || !title || !comment) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
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

    // TODO: Implement in production
    /*
    const userId = session.user.id;

    // Check if user has already reviewed this product
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('productId', productId)
      .eq('userId', userId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Check if user has purchased this product
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('userId', userId)
      .eq('status', 'delivered')
      .contains('items', [{ productId }])
      .single();

    const verified = !!order;

    // Create review (with pending status for moderation)
    const { data: newReview, error } = await supabase
      .from('reviews')
      .insert({
        productId,
        userId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verified,
        status: 'pending', // Will be approved by admin
        helpful: 0,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update product rating statistics
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('productId', productId)
      .eq('status', 'approved');

    if (allReviews) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      const reviewCount = allReviews.length;

      await supabase
        .from('products')
        .update({
          averageRating: avgRating,
          reviewCount: reviewCount,
        })
        .eq('id', productId);
    }

    // Notify admin of new review for moderation
    await sendAdminNotification({
      type: 'new-review',
      productId,
      reviewId: newReview.id,
      rating,
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      data: newReview
    });
    */

    console.log('Would create review:', { productId, rating, title, comment });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully (requires database implementation)',
      data: {
        id: `rev-${Date.now()}`,
        productId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verified: false,
        helpful: 0,
        createdAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
