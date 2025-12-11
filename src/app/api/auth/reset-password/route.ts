import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/config/di-container';
import { TOKENS } from '@/config/di-container';
import type { IAuthService } from '@/interfaces';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain uppercase, lowercase, and number' },
        { status: 400 }
      );
    }

    // Get AuthService from DI container
    const authService = container.resolve<IAuthService>(TOKENS.IAuthService);

    // Complete password reset
    const result = await authService.completePasswordReset(token, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to reset password' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
