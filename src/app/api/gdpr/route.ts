import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { IGDPRService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const gdprService = container.resolve<IGDPRService>(TOKENS.IGDPRService);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
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
      case 'data-portability': {
        const format = searchParams.get('format') as 'json' | 'csv' | 'pdf' || 'json';
        return handleDataPortability(session.user.id, format);
      }
      case 'processing-purposes':
        return handleGetProcessingPurposes();
      case 'retention-policies':
        return handleGetRetentionPolicies();
      case 'activity-log':
        return handleGetActivityLog(session.user.id);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GDPR GET error:', error);
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

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update-consent':
        return handleUpdateConsent(body, session.user.id);
      case 'request-deletion':
        return handleRequestDeletion(session.user.id);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GDPR POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetConsentStatus(userId: string) {
  try {
    const result = await gdprService.getConsentStatus(userId);

    if (!result.success) {
      console.error('GDPR - failed to get consent status:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('GDPR - get consent status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUpdateConsent(body: any, userId: string) {
  try {
    const { marketing, analytics, functional } = body;

    if (typeof marketing !== 'boolean' || typeof analytics !== 'boolean' || typeof functional !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid consent data' },
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
      console.error('GDPR - failed to update consent:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Consent updated successfully' },
    });
  } catch (error) {
    console.error('GDPR - update consent error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDataExport(userId: string) {
  try {
    const result = await gdprService.exportUserData(userId);

    if (!result.success) {
      console.error('GDPR - failed to export user data:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('GDPR - data export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDataPortability(userId: string, format: 'json' | 'csv' | 'pdf') {
  try {
    const result = await gdprService.requestDataPortability(userId, format);

    if (!result.success || !result.data) {
      console.error('GDPR - failed to process data portability request:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (format === 'pdf') {
      const pdfBuffer = Buffer.from(result.data, 'base64');
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="user-data-${userId}.pdf"`,
        },
      });
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
    console.error('GDPR - data portability error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleRequestDeletion(userId: string) {
  try {
    const result = await gdprService.deleteUserData(userId);

    if (!result.success) {
      console.error('GDPR - failed to process deletion request:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Account deletion request processed successfully' },
    });
  } catch (error) {
    console.error('GDPR - deletion request error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetProcessingPurposes() {
  try {
    const result = await gdprService.getDataProcessingPurposes();

    if (!result.success) {
      console.error('GDPR - failed to get processing purposes:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('GDPR - get processing purposes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetRetentionPolicies() {
  try {
    const result = await gdprService.getDataRetentionPolicies();

    if (!result.success) {
      console.error('GDPR - failed to get retention policies:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('GDPR - get retention policies error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetActivityLog(userId: string) {
  try {
    const result = await gdprService.getGDPRActivityLog(userId);

    if (!result.success) {
      console.error('GDPR - failed to get activity log:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('GDPR - get activity log error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
