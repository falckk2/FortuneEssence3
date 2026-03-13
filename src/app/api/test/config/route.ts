import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * TEST MODE CONFIGURATION API
 *
 * Allows toggling test endpoints on/off via API or admin interface.
 * Configuration is stored in .env.local
 */

const ENV_LOCAL_PATH = join(process.cwd(), '.env.local');

function getTestModeStatus(): boolean {
  if (process.env.ENABLE_TEST_ENDPOINTS === 'true') {
    return true;
  }
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

function updateEnvFile(enabled: boolean) {
  try {
    let envContent = '';
    if (existsSync(ENV_LOCAL_PATH)) {
      envContent = readFileSync(ENV_LOCAL_PATH, 'utf-8');
    }
    const lines = envContent.split('\n').filter(line =>
      !line.trim().startsWith('ENABLE_TEST_ENDPOINTS')
    );
    lines.push(`ENABLE_TEST_ENDPOINTS=${enabled ? 'true' : 'false'}`);
    writeFileSync(ENV_LOCAL_PATH, lines.join('\n'));
    return true;
  } catch (error) {
    console.error('Failed to update .env.local:', error);
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

    const isEnabled = getTestModeStatus();

    return NextResponse.json({
      success: true,
      data: {
        enabled: isEnabled,
        environment: process.env.NODE_ENV,
        canToggle: process.env.NODE_ENV !== 'production',
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

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot toggle test endpoints in production environment. Update environment variables manually.'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled must be a boolean value' },
        { status: 400 }
      );
    }

    const updated = updateEnvFile(enabled);

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
          ? 'Test endpoints ENABLED - Restart server for changes to take effect'
          : 'Test endpoints DISABLED - Restart server for changes to take effect',
        requiresRestart: true,
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
