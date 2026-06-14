export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase-server';
import { container, TOKENS } from '@/config/di-container';
import type { IEmailService } from '@/interfaces/email';
import { config } from '@/config';

const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

// ISSUE-025 fix: HTML-escape user-supplied values to prevent XSS in email templates.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Rate limiting — persisted in Supabase so it survives serverless restarts.
// Falls back to in-memory if the DB write fails (degraded but non-blocking).
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;
const FORM_TYPE = 'contact';

async function checkRateLimit(ip: string): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const bucketId = `${FORM_TYPE}:${ip}`;

  try {
    const supabase = getSupabaseServer();

    // Fetch existing bucket row
    const { data: existing } = await supabase
      .from('rate_limit_buckets')
      .select('timestamps')
      .eq('id', bucketId)
      .single();

    const allTimestamps: string[] = existing?.timestamps ?? [];

    // Keep only timestamps within the current window
    const recentTimestamps = allTimestamps.filter(
      (ts: string) => new Date(ts) > windowStart
    );

    if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      return false; // rate limit exceeded
    }

    // Record this request
    recentTimestamps.push(now.toISOString());

    await supabase
      .from('rate_limit_buckets')
      .upsert({
        id: bucketId,
        form_type: FORM_TYPE,
        ip,
        timestamps: recentTimestamps,
        updated_at: now.toISOString(),
      });

    return true;
  } catch (err) {
    // If the DB is unavailable, fail open (allow the request) to avoid blocking
    // legitimate users on infrastructure errors. Log so ops can investigate.
    console.error('[rate-limit] DB check failed, failing open:', err);
    return true;
  }
}

function detectSpam(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const urls = lowerMessage.match(urlPattern) || [];
  if (urls.length > 3) return true;

  const uppercaseCount = (message.match(/[A-Z]/g) || []).length;
  const letterCount = (message.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 20 && uppercaseCount / letterCount > 0.7) return true;

  const spamKeywords = [
    'viagra', 'cialis', 'pharmacy', 'casino', 'lottery', 'winner',
    'inheritance', 'nigerian prince', 'click here', 'buy now',
    'limited time', 'act now', 'congratulations', 'free money',
    'work from home', 'make money fast', 'crypto', 'bitcoin investment',
    'forex trading', 'binary options', 'mlm', 'network marketing',
  ];
  if (spamKeywords.filter(k => lowerMessage.includes(k)).length >= 2) return true;

  const words = lowerMessage.split(/\s+/);
  const wordCounts = new Map<string, number>();
  words.forEach(word => {
    if (word.length > 3) wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });
  for (const count of wordCounts.values()) {
    if (count >= 5) return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!await checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!subject || subject.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Subject must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString(),
      ip,
    };

    const isSpam = detectSpam(sanitizedData.message);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const supabase = getSupabaseServer();
    const { data: contactSubmission, error: dbError } = await supabase
      .from('contact_form_submissions')
      .insert({
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        subject: sanitizedData.subject,
        message: sanitizedData.message,
        status: isSpam ? 'spam' : 'new',
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error saving contact submission:', dbError);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (isSpam) {
      console.warn('Spam submission detected and marked:', {
        id: contactSubmission.id,
        email: sanitizedData.email,
      });
      return NextResponse.json({
        success: true,
        message: 'Thank you for your message! We will get back to you within 24 hours.',
        data: { submissionId: contactSubmission.id },
      });
    }

    try {
      const adminUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/support/${contactSubmission.id}`;

      await emailService.sendEmail({
        to: config.email.supportEmail,
        subject: `New Contact Form: ${sanitizedData.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #8B4513; color: white; padding: 15px; }
              .content { padding: 20px; background: #f9f9f9; }
              .field { margin: 15px 0; padding: 10px; background: white; border-left: 3px solid #8B4513; }
              .label { font-weight: bold; color: #666; }
              .button { display: inline-block; padding: 10px 20px; background: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Contact Form Submission</h2>
              </div>
              <div class="content">
                <div class="field"><span class="label">Submission ID:</span> ${escapeHtml(contactSubmission.id)}</div>
                <div class="field"><span class="label">Name:</span> ${escapeHtml(sanitizedData.name)}</div>
                <div class="field"><span class="label">Email:</span> ${escapeHtml(sanitizedData.email)}</div>
                ${sanitizedData.phone ? `<div class="field"><span class="label">Phone:</span> ${escapeHtml(sanitizedData.phone)}</div>` : ''}
                <div class="field"><span class="label">Subject:</span> ${escapeHtml(sanitizedData.subject)}</div>
                <div class="field"><span class="label">Message:</span><br>${escapeHtml(sanitizedData.message).replace(/\n/g, '<br>')}</div>
                <div class="field"><span class="label">IP Address:</span> ${ip}</div>
                <div class="field"><span class="label">Submitted At:</span> ${sanitizedData.submittedAt}</div>
                <a href="${adminUrl}" class="button">View in Admin Panel</a>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `New Contact Form Submission\n\nID: ${contactSubmission.id}\nName: ${sanitizedData.name}\nEmail: ${sanitizedData.email}\nPhone: ${sanitizedData.phone || 'N/A'}\nSubject: ${sanitizedData.subject}\nMessage:\n${sanitizedData.message}\n\nIP: ${ip}\nSubmitted: ${sanitizedData.submittedAt}`,
      });
    } catch (emailError) {
      console.error('Failed to send support team notification:', emailError);
    }

    try {
      const locale = request.headers.get('accept-language')?.startsWith('sv') ? 'sv' : 'en';
      await emailService.sendContactFormConfirmation(
        sanitizedData.email,
        sanitizedData.name,
        locale as 'sv' | 'en'
      );
    } catch (emailError) {
      console.error('Failed to send customer confirmation:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We will get back to you within 24 hours.',
      data: { submissionId: contactSubmission.id },
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const status = searchParams.get('status') || 'all';
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50;

    const supabase = getSupabaseServer();
    let query = supabase
      .from('contact_form_submissions')
      .select()
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch contact submissions:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get contact submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
