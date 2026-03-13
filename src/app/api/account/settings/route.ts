import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CustomerRepository } from '@/repositories/customers/CustomerRepository';

const customerRepository = new CustomerRepository();

// GET - Fetch user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const result = await customerRepository.findById(session.user.id);
    if (!result.success || !result.data) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        email: result.data.email,
        phone: result.data.phone || '',
        marketingOptIn: result.data.marketingOptIn ?? false,
        address: {
          street: result.data.address.street || '',
          city: result.data.address.city || '',
          postalCode: result.data.address.postalCode || '',
          country: result.data.address.country || 'Sweden',
          region: result.data.address.region || '',
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'change-password') {
      return handlePasswordChange(session.user.id, body);
    }

    const { firstName, lastName, phone, marketingOptIn, address } = body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const result = await customerRepository.update(session.user.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || undefined,
      marketingOptIn: typeof marketingOptIn === 'boolean' ? marketingOptIn : undefined,
      address: {
        street: address?.street?.trim() || '',
        city: address?.city?.trim() || '',
        postalCode: address?.postalCode?.trim() || '',
        country: address?.country?.trim() || 'Sweden',
        region: address?.region?.trim() || '',
      },
    });

    if (!result.success) {
      console.error('Failed to update profile:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function handlePasswordChange(userId: string, body: { currentPassword: string; newPassword: string }) {
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { success: false, error: 'Current and new passwords are required' },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { success: false, error: 'New password must be at least 8 characters' },
      { status: 400 }
    );
  }

  const result = await customerRepository.changePassword(userId, currentPassword, newPassword);

  if (!result.success) {
    if (result.error === 'User not found') {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (result.error === 'Current password is incorrect') {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
    }
    console.error('Failed to change password:', result.error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
