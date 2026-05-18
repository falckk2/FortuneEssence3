export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import type { IAuthService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';
import { signUpSchema } from '@/utils/validation';

const authService = container.resolve<IAuthService>(TOKENS.IAuthService);

export async function POST(request: NextRequest) {
  console.log('[issue-tracker][signup-route] POST start', { hasAuthService: !!authService }); // [issue-tracker] diagnostic log
  try {
    const body = await request.json();

    // Validate the request body
    const validation = signUpSchema.safeParse(body);
    if (!validation.success) {
      console.warn('[issue-tracker][signup-route] schema validation failed', validation.error.issues); // [issue-tracker] diagnostic log
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues.map((issue) => issue.message).join(', '),
        },
        { status: 400 }
      );
    }

    const signUpData = validation.data;

    // Create the customer account
    const result = await authService.signUp(signUpData);
    // [issue-tracker] diagnostic log — capture signup service result without leaking PII
    console.log('[issue-tracker][signup-route] signUp result', { success: result.success, hasData: !!result.data, error: result.success ? undefined : result.error });

    if (!result.success || !result.data) {
      console.error('Sign up service error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.data.id,
          email: result.data.email,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}