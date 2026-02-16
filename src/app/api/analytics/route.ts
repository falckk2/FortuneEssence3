import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import type { IAnalyticsService, AnalyticsRange } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const analyticsService = container.resolve<IAnalyticsService>(TOKENS.IAnalyticsService);

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    if (!['week', 'month', 'year'].includes(range)) {
      return NextResponse.json(
        { success: false, error: 'Invalid range parameter' },
        { status: 400 }
      );
    }

    const result = await analyticsService.getAnalytics(range as AnalyticsRange);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
