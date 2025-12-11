import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { container } from '@/config/di-container';
import { TOKENS } from '@/config/di-container';
import type { IEmailService } from '@/interfaces/email';

// Rate limiting helper (in-memory, for production use Redis or similar)
const contactRequests = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

function detectSpam(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Check for excessive URLs (more than 3)
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const urls = lowerMessage.match(urlPattern) || [];
  if (urls.length > 3) {
    return true;
  }

  // Check if message is mostly uppercase (more than 70%)
  const uppercaseCount = (message.match(/[A-Z]/g) || []).length;
  const letterCount = (message.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 20 && uppercaseCount / letterCount > 0.7) {
    return true;
  }

  // Common spam keywords
  const spamKeywords = [
    'viagra', 'cialis', 'pharmacy', 'casino', 'lottery', 'winner',
    'inheritance', 'nigerian prince', 'click here', 'buy now',
    'limited time', 'act now', 'congratulations', 'free money',
    'work from home', 'make money fast', 'crypto', 'bitcoin investment',
    'forex trading', 'binary options', 'mlm', 'network marketing'
  ];

  const keywordMatches = spamKeywords.filter(keyword =>
    lowerMessage.includes(keyword)
  );

  // If 2 or more spam keywords found, likely spam
  if (keywordMatches.length >= 2) {
    return true;
  }

  // Check for excessive repetition (same word repeated 5+ times)
  const words = lowerMessage.split(/\s+/);
  const wordCounts = new Map<string, number>();
  words.forEach(word => {
    if (word.length > 3) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  });

  for (const count of wordCounts.values()) {
    if (count >= 5) {
      return true;
    }
  }

  return false;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = contactRequests.get(ip) || [];

  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  recentRequests.push(now);
  contactRequests.set(ip, recentRequests);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
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

    // Sanitize inputs (basic)
    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString(),
      ip,
    };

    // Basic spam detection
    const isSpam = detectSpam(sanitizedData.message);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Save to database
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
        { success: false, error: 'Failed to save contact submission' },
        { status: 500 }
      );
    }

    console.log('Contact form submission saved to database:', contactSubmission.id);

    // If marked as spam, log and return success but don't send emails
    if (isSpam) {
      console.warn('Spam submission detected and marked:', {
        id: contactSubmission.id,
        email: sanitizedData.email,
      });
      return NextResponse.json({
        success: true,
        message: 'Thank you for your message! We will get back to you within 24 hours.',
        data: {
          submissionId: contactSubmission.id,
        }
      });
    }

    // Get EmailService from DI container
    const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

    // Send notification to support team
    try {
      const adminUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/support/${contactSubmission.id}`;

      await emailService.sendEmail({
        to: 'support@fortuneessence.se',
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
                <div class="field">
                  <span class="label">Submission ID:</span> ${contactSubmission.id}
                </div>
                <div class="field">
                  <span class="label">Name:</span> ${sanitizedData.name}
                </div>
                <div class="field">
                  <span class="label">Email:</span> ${sanitizedData.email}
                </div>
                ${sanitizedData.phone ? `
                  <div class="field">
                    <span class="label">Phone:</span> ${sanitizedData.phone}
                  </div>
                ` : ''}
                <div class="field">
                  <span class="label">Subject:</span> ${sanitizedData.subject}
                </div>
                <div class="field">
                  <span class="label">Message:</span><br>
                  ${sanitizedData.message.replace(/\n/g, '<br>')}
                </div>
                <div class="field">
                  <span class="label">IP Address:</span> ${ip}
                </div>
                <div class="field">
                  <span class="label">Submitted At:</span> ${sanitizedData.submittedAt}
                </div>
                <a href="${adminUrl}" class="button">View in Admin Panel</a>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `New Contact Form Submission\n\nID: ${contactSubmission.id}\nName: ${sanitizedData.name}\nEmail: ${sanitizedData.email}\nPhone: ${sanitizedData.phone || 'N/A'}\nSubject: ${sanitizedData.subject}\nMessage:\n${sanitizedData.message}\n\nIP: ${ip}\nSubmitted: ${sanitizedData.submittedAt}`,
      });

      console.log('Support team notification email sent');
    } catch (emailError) {
      console.error('Failed to send support team notification:', emailError);
      // Don't fail the request if email fails
    }

    // Send auto-reply confirmation to customer
    try {
      const locale = request.headers.get('accept-language')?.startsWith('sv') ? 'sv' : 'en';
      await emailService.sendContactFormConfirmation(
        sanitizedData.email,
        sanitizedData.name,
        locale as 'sv' | 'en'
      );

      console.log('Customer confirmation email sent');
    } catch (emailError) {
      console.error('Failed to send customer confirmation:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We will get back to you within 24 hours.',
      data: {
        submissionId: contactSubmission.id,
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    // TODO: Fetch from database
    /*
    const submissions = await getContactSubmissions({
      status: status === 'all' ? undefined : status,
      limit,
      orderBy: { submittedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: submissions
    });
    */

    return NextResponse.json({
      success: true,
      data: [],
      message: 'Contact submissions endpoint (requires database implementation)'
    });

  } catch (error) {
    console.error('Get contact submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
