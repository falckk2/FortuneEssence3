import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * TEST MODE CONFIGURATION API
 *
 * Allows toggling test endpoints on/off via API or admin interface.
 * Configuration is persisted in the `feature_flags` Supabase table so
 * it works in deployed (serverless) environments where the filesystem
 * is read-only / ephemeral.
 */

const FLAG_KEY = 'enable_test_endpoints';

async function getTestModeStatus(): Promise<boolean> {
  // Env var always takes precedence (useful for CI / dev without DB)
  if (process.env.ENABLE_TEST_ENDPOINTS === 'true') return true;
  if (process.env.NODE_ENV === 'development') return true;

  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('feature_flags')
      .select('value')
      .eq('key', FLAG_KEY)
      .single();
    return data?.value === true;
  } catch {
    return false;
  }
}

async function setTestModeStatus(enabled: boolean): Promise<boolean> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('feature_flags')
      .upsert({
        key: FLAG_KEY,
        value: enabled,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      console.error('Failed to update feature flag:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to update feature flag:', error);
    return false;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const isEnabled = await getTestModeStatus();

    return NextResponse.json({
      success: true,
      data: {
        enabled: isEnabled,
        environment: process.env.NODE_ENV,
        canToggle: session.user.isAdmin === true,
        message: isEnabled
          ? 'Test endpoints are currently ENABLED'
          : 'Test endpoints are currently DISABLED',
      },
    });
  } catch (error) {
    console.error('Test config GET error:', error);
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
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (!session.user.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled must be a boolean value' },
        { status: 400 }
      );
    }

    const updated = await setTestModeStatus(enabled);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled,
        message: enabled
          ? 'Test endpoints ENABLED'
          : 'Test endpoints DISABLED',
      },
    });
  } catch (error) {
    console.error('Test config POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
