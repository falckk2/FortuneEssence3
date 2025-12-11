import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { container } from '@/config/di-container';
import { TOKENS } from '@/config/di-container';
import type { IEmailService } from '@/interfaces/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale = 'sv' } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Extract metadata for tracking
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check for existing subscription
    const { data: existingSubscription, error: findError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Database error checking subscription:', findError);
      return NextResponse.json(
        { success: false, error: 'Failed to process subscription' },
        { status: 500 }
      );
    }

    // Handle existing subscriptions
    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return NextResponse.json(
          {
            success: false,
            error: locale === 'sv'
              ? 'Den här e-postadressen är redan prenumererad på vårt nyhetsbrev'
              : 'This email is already subscribed to our newsletter'
          },
          { status: 400 }
        );
      }

      if (existingSubscription.status === 'unsubscribed') {
        // Re-subscribe: update status to active
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const { error: updateError } = await supabase
          .from('newsletter_subscriptions')
          .update({
            status: 'active',
            verification_token: verificationToken,
            updated_at: new Date().toISOString(),
            ip_address: ipAddress,
            user_agent: userAgent,
          })
          .eq('email', email);

        if (updateError) {
          console.error('Database error re-subscribing:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to re-subscribe' },
            { status: 500 }
          );
        }

        // Generate and send welcome email with discount code
        const discountCode = `WELCOME10-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        try {
          const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);
          await emailService.sendNewsletterWelcome(email, discountCode, locale as 'sv' | 'en');
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the subscription if email fails - they're still subscribed
        }

        return NextResponse.json({
          success: true,
          message: locale === 'sv'
            ? 'Välkommen tillbaka! Kolla din e-post för din rabattkod.'
            : 'Welcome back! Check your email for your discount code.',
          data: {
            subscriptionId: existingSubscription.id,
            email,
            discountCode,
          }
        });
      }

      if (existingSubscription.status === 'pending') {
        // Resend verification email
        try {
          const discountCode = `WELCOME10-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);
          await emailService.sendNewsletterWelcome(email, discountCode, locale as 'sv' | 'en');
        } catch (emailError) {
          console.error('Failed to resend welcome email:', emailError);
        }

        return NextResponse.json({
          success: true,
          message: locale === 'sv'
            ? 'Verifieringsmail skickat igen. Kolla din e-post.'
            : 'Verification email resent. Check your email.',
          data: {
            subscriptionId: existingSubscription.id,
            email,
          }
        });
      }
    }

    // Create new subscription
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const { data: newSubscription, error: insertError } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email,
        status: 'active', // Using active instead of pending for immediate subscription
        verification_token: verificationToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        source: 'website',
        subscribed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error creating subscription:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Generate unique discount code
    const discountCode = `WELCOME10-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Send welcome email with discount code
    try {
      const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);
      const emailResult = await emailService.sendNewsletterWelcome(
        email,
        discountCode,
        locale as 'sv' | 'en'
      );

      if (!emailResult.success) {
        console.error('Email service error:', emailResult.error);
        // Don't fail the subscription - they're still subscribed
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue - subscription is still successful
    }

    // Log successful subscription
    console.log(`Newsletter subscription created: ${email} (ID: ${newSubscription.id})`);

    return NextResponse.json({
      success: true,
      message: locale === 'sv'
        ? 'Tack för att du prenumererar! Kolla din e-post för din välkomstrabatt.'
        : 'Thank you for subscribing! Check your email for your welcome discount.',
      data: {
        subscriptionId: newSubscription.id,
        email,
        discountCode,
        message: locale === 'sv'
          ? 'Du har fått 10% rabatt på din första beställning!'
          : 'You received 10% off your first order!',
      }
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}

// Unsubscribe endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing email or unsubscribe token' },
        { status: 400 }
      );
    }

    // Find subscription
    const { data: subscription, error: findError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Verify token matches
    if (subscription.verification_token !== token) {
      return NextResponse.json(
        { success: false, error: 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    // Update subscription status to unsubscribed
    const { error: updateError } = await supabase
      .from('newsletter_subscriptions')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (updateError) {
      console.error('Database error unsubscribing:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // Send confirmation email (optional - graceful failure)
    try {
      const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);
      await emailService.sendEmail({
        to: email,
        subject: 'Du har avregistrerats från vårt nyhetsbrev',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Du har avregistrerats</h2>
              <p>Du har framgångsrikt avregistrerats från vårt nyhetsbrev.</p>
              <p>Vi kommer att sakna dig! Om du ändrar dig kan du prenumerera igen när som helst.</p>
              <p>
                <a href="${process.env.NEXTAUTH_URL || 'https://fortuneessence.se'}" style="color: #8B4513;">
                  Tillbaka till Fortune Essence
                </a>
              </p>
            </div>
          </body>
          </html>
        `,
        text: 'Du har framgångsrikt avregistrerats från vårt nyhetsbrev.',
      });
    } catch (emailError) {
      console.error('Failed to send unsubscribe confirmation email:', emailError);
      // Continue - unsubscribe was still successful
    }

    console.log(`Newsletter unsubscribe successful: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
