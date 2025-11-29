import { NextRequest, NextResponse } from 'next/server';

// Rate limiting helper (in-memory, for production use Redis or similar)
const contactRequests = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

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

    // TODO: Implement the following in production:
    // 1. Save contact form submission to database for tracking
    // 2. Send email to support team
    // 3. Send auto-reply confirmation email to user
    // 4. Optionally create support ticket in CRM/helpdesk system
    // 5. Add spam detection (check for suspicious patterns)

    // Example implementation outline:
    /*
    // Save to database
    const contactSubmission = await createContactSubmission({
      ...sanitizedData,
      status: 'new',
      assignedTo: null,
    });

    // Send notification to support team
    await sendEmail({
      to: 'support@fortuneessence.se',
      subject: `New Contact Form: ${sanitizedData.subject}`,
      template: 'contact-notification',
      data: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        subject: sanitizedData.subject,
        message: sanitizedData.message,
        submissionId: contactSubmission.id,
        adminUrl: `${process.env.NEXTAUTH_URL}/admin/support/${contactSubmission.id}`
      }
    });

    // Send auto-reply to customer
    await sendEmail({
      to: sanitizedData.email,
      subject: 'Vi har tagit emot ditt meddelande - Fortune Essence',
      template: 'contact-auto-reply',
      data: {
        name: sanitizedData.name,
        subject: sanitizedData.subject,
        ticketNumber: contactSubmission.id.substring(0, 8),
        expectedResponseTime: '24 timmar'
      }
    });

    // Spam detection
    const spamScore = await checkSpamScore(sanitizedData.message);
    if (spamScore > 0.8) {
      await markAsSpam(contactSubmission.id);
    }
    */

    // For now, just log the submission
    console.log('Contact form submission received:');
    console.log(JSON.stringify(sanitizedData, null, 2));
    console.log('In production, would send emails to support team and customer');

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We will get back to you within 24 hours.',
      data: {
        ticketNumber: `CF${Date.now().toString().slice(-8)}`,
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
