export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { ITestCheckoutService } from '@/interfaces/test';
import { getTestModeStatus } from '@/lib/testMode';

const testCheckoutService = container.resolve<ITestCheckoutService>(TOKENS.ITestCheckoutService);

/**
 * TEST MODE CHECKOUT API
 *
 * This endpoint simulates the entire checkout and payment process without
 * actually processing real payments. Use this for testing order flow,
 * database storage, order history, and shipment tracking.
 *
 * REFACTORED: Now follows SOLID principles
 * - Single Responsibility: Route handler only handles HTTP concerns
 * - Dependency Inversion: Depends on ITestCheckoutService abstraction
 * - Open/Closed: Business logic extensible without modifying this route
 *
 * WARNING: This is for testing only and should be disabled in production!
 */

export async function POST(request: NextRequest) {
  if (!(await getTestModeStatus())) {
    return NextResponse.json(
      {
        success: false,
        error: 'Test endpoints are disabled in production',
      },
      { status: 403 }
    );
  }

  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const sessionId = request.headers.get('x-session-id');

    if (!session?.user?.id && !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate customer ID matches session if user is logged in
    if (session?.user?.id && body.customerId && body.customerId !== session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID mismatch',
      }, { status: 403 });
    }

    const result = await testCheckoutService.processTestCheckout(body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        testMode: true,
        data: result.data,
      });
    } else {
      console.error('Test checkout - failed to process checkout:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
