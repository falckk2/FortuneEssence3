export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import type { IInventoryService } from '@/interfaces';

const inventoryService = container.resolve<IInventoryService>(TOKENS.IInventoryService);

/**
 * Cron job endpoint to clean up expired stock reservations
 * Should be called every 5-10 minutes via cron service (Vercel Cron, GitHub Actions, etc.)
 *
 * Example Vercel Cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-reservations",
 *     "schedule": "every 10 minutes"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await inventoryService.cleanupExpiredReservations();

    if (!result.success) {
      console.error('Cleanup reservations cron failed:', result.error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.data?.expiredCount || 0} expired reservations`,
      expiredCount: result.data?.expiredCount || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
