import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { IAuthService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';
import { signUpSchema } from '@/utils/validation';

const authService = container.resolve<IAuthService>(TOKENS.IAuthService);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validation = signUpSchema.safeParse(body);
    if (!validation.success) {
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

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // Return success response (don't include sensitive data)
    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.data!.id,
          email: result.data!.email,
          firstName: result.data!.firstName,
          lastName: result.data!.lastName,
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