import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // TODO: Implement in production
    /*
    // Optional: Track who marked it as helpful to prevent spam
    // const session = await getServerSession();
    // const userId = session?.user?.id;

    // if (userId) {
    //   // Check if user already marked this review as helpful
    //   const { data: existing } = await supabase
    //     .from('review_helpful')
    //     .select('id')
    //     .eq('reviewId', id)
    //     .eq('userId', userId)
    //     .single();

    //   if (existing) {
    //     return NextResponse.json(
    //       { success: false, error: 'You have already marked this review as helpful' },
    //       { status: 400 }
    //     );
    //   }

    //   // Record the helpful mark
    //   await supabase
    //     .from('review_helpful')
    //     .insert({
    //       reviewId: id,
    //       userId,
    //       createdAt: new Date().toISOString(),
    //     });
    // }

    // Increment helpful count
    const { data: review, error } = await supabase
      .from('reviews')
      .select('helpful')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Review not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    const { error: updateError } = await supabase
      .from('reviews')
      .update({ helpful: review.helpful + 1 })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: { helpful: review.helpful + 1 }
    });
    */

    console.log(`Would mark review ${id} as helpful`);

    return NextResponse.json({
      success: true,
      message: 'Review marked as helpful (requires database implementation)'
    });

  } catch (error) {
    console.error('Mark review as helpful error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark review as helpful' },
      { status: 500 }
    );
  }
}
