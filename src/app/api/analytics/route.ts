import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { IAnalyticsService, AnalyticsRange } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const analyticsService = container.resolve<IAnalyticsService>(TOKENS.IAnalyticsService);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

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
      console.error('Analytics service error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
