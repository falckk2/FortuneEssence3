import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth/AuthService';
import { signUpSchema } from '@/utils/validation';

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validation = signUpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map(err => err.message).join(', '),
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