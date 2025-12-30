import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import { ITestCheckoutService } from '@/interfaces/test';

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
  // Check if we're in development/test mode
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
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

    // Resolve the test checkout service from DI container
    const testCheckoutService = container.resolve<ITestCheckoutService>(
      TOKENS.ITestCheckoutService
    );

    // Delegate all business logic to the service
    const result = await testCheckoutService.processTestCheckout(body);

    // Return appropriate HTTP response based on service result
    if (result.success) {
      return NextResponse.json({
        success: true,
        testMode: true,
        data: result.data,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('🧪 TEST MODE: Error in checkout route:', error);
    return NextResponse.json({
      success: false,
      error: `Test checkout failed: ${error}`,
    }, { status: 500 });
  }
}
