export const dynamic = 'force-dynamic';
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { container, TOKENS } from '@/config/di-container';
import type { ICustomerRepository } from '@/interfaces';

const customerRepository = container.resolve<ICustomerRepository>(TOKENS.ICustomerRepository);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const limitParam = parseInt(searchParams.get('limit') || '100');
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 100;

    const result = await customerRepository.findAll({ search, limit });

    if (!result.success) {
      console.error('Failed to fetch customers:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new customer (admin-initiated, no password — use /api/auth/signup for self-registration)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, marketingOptIn } = body;

    if (!firstName || String(firstName).trim().length < 1) {
      return NextResponse.json(
        { success: false, error: 'firstName is required' },
        { status: 400 }
      );
    }
    if (!lastName || String(lastName).trim().length < 1) {
      return NextResponse.json(
        { success: false, error: 'lastName is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const result = await customerRepository.create({
      email: String(email).trim().toLowerCase(),
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      phone: phone ? String(phone).trim() : undefined,
      address: { street: '', city: '', postalCode: '', country: 'Sweden' },
      consentGiven: true,
      marketingOptIn: marketingOptIn === true,
    });

    if (!result.success) {
      if (result.error?.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      console.error('Failed to create customer:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
