import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/config/di-container';
import { TOKENS } from '@/config/di-container';
import type { IAuthService } from '@/interfaces';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email format
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get AuthService from DI container
    const authService = container.resolve<IAuthService>(TOKENS.IAuthService);

    // Request password reset
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
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
