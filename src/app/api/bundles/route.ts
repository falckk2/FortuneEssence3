import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { container, TOKENS } from '@/config/di-container';
import type { IBundleService, IBundleRepository } from '@/interfaces';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const bundleService = container.resolve<IBundleService>(TOKENS.IBundleService);
const bundleRepo = container.resolve<IBundleRepository>(TOKENS.IBundleRepository);

// GET /api/bundles - Get all bundle configurations
export async function GET() {
  try {
    const result = await bundleService.getAllBundleConfigurations();

    if (!result.success) {
      console.error('Bundles GET - failed to get configurations:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Bundles GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = await bundleRepo.create(body);

    if (!result.success) {
      console.error('Bundles POST - failed to create bundle:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Bundles POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
