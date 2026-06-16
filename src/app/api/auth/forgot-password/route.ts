export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import type { IAuthService } from '@/interfaces';
import { checkRateLimit, getClientIp } from '@/utils/rateLimit';

const authService = container.resolve<IAuthService>(TOKENS.IAuthService);

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit('forgot-password', ip, 3);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const result = await authService.resetPassword(email);

    if (!result.success) {
      console.error('Password reset failed:', result.error);
    }

    // Always return success message for security (prevent email enumeration)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
