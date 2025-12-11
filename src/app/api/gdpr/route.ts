import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { IGDPRService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const gdprService = container.resolve<IGDPRService>(TOKENS.IGDPRService);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'consent-status':
        return handleGetConsentStatus(session.user.id);
      
      case 'data-export':
        return handleDataExport(session.user.id);
      
      case 'data-portability':
        const format = searchParams.get('format') as 'json' | 'csv' || 'json';
        return handleDataPortability(session.user.id, format);
      
      case 'processing-purposes':
        return handleGetProcessingPurposes();
      
      case 'retention-policies':
        return handleGetRetentionPolicies();
      
      case 'activity-log':
        return handleGetActivityLog(session.user.id);
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GDPR API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update-consent':
        return handleUpdateConsent(body, session.user.id);
      
      case 'request-deletion':
        return handleRequestDeletion(session.user.id);
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GDPR POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function handleGetConsentStatus(userId: string) {
  try {
    const result = await gdprService.getConsentStatus(userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get consent status: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleUpdateConsent(body: any, userId: string) {
  try {
    const { marketing, analytics, functional } = body;

    if (typeof marketing !== 'boolean' || typeof analytics !== 'boolean' || typeof functional !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid consent data',
        },
        { status: 400 }
      );
    }

    const consentData = {
      marketing,
      analytics,
      functional,
      updatedAt: new Date(),
    };

    const result = await gdprService.updateConsent(userId, consentData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Consent updated successfully' },
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update consent: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleDataExport(userId: string) {
  try {
    const result = await gdprService.exportUserData(userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to export user data: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleDataPortability(userId: string, format: 'json' | 'csv') {
  try {
    const result = await gdprService.requestDataPortability(userId, format);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    const contentType = format === 'json' ? 'application/json' : 'text/csv';
    const filename = `user-data-${userId}.${format}`;

    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to process data portability request: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleRequestDeletion(userId: string) {
  try {
    // In a real implementation, this might queue the deletion for manual review
    // For now, we'll perform immediate deletion
    const result = await gdprService.deleteUserData(userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Account deletion request processed successfully' },
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to process deletion request: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleGetProcessingPurposes() {
  try {
    const result = await gdprService.getDataProcessingPurposes();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get processing purposes: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleGetRetentionPolicies() {
  try {
    const result = await gdprService.getDataRetentionPolicies();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get retention policies: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleGetActivityLog(userId: string) {
  try {
    const result = await gdprService.getGDPRActivityLog(userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get activity log: ${error}`,
      },
      { status: 500 }
    );
  }
}