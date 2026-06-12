export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
// Server-role client: newsletter_subscriptions is RLS-protected (FABLE-013)
import { getSupabaseServer } from '@/lib/supabase-server';
import crypto from 'crypto';
import { container, TOKENS } from '@/config/di-container';
import type { IEmailService } from '@/interfaces/email';

const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale = 'sv' } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { data: existingSubscription, error: findError } = await getSupabaseServer()
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Database error checking subscription:', findError);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return NextResponse.json(
          {
            success: false,
            error: locale === 'sv'
              ? 'Den här e-postadressen är redan prenumererad på vårt nyhetsbrev'
              : 'This email is already subscribed to our newsletter',
          },
          { status: 400 }
        );
      }

      if (existingSubscription.status === 'unsubscribed') {
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const { error: updateError } = await getSupabaseServer()
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
            { success: false, error: 'Internal server error' },
            { status: 500 }
          );
        }

        const discountCode = `WELCOME10-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        try {
          await emailService.sendNewsletterWelcome(email, discountCode, locale as 'sv' | 'en');
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }

        return NextResponse.json({
          success: true,
          message: locale === 'sv'
            ? 'Välkommen tillbaka! Kolla din e-post för din rabattkod.'
            : 'Welcome back! Check your email for your discount code.',
          data: {
            subscriptionId: existingSubscription.id,
            email,
          },
        });
      }

      if (existingSubscription.status === 'pending') {
        try {
          const discountCode = `WELCOME10-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
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
          },
        });
      }
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const { data: newSubscription, error: insertError } = await getSupabaseServer()
      .from('newsletter_subscriptions')
      .insert({
        email,
        status: 'active',
        verification_token: verificationToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        source: 'website',
        // Subscription time is the row's created_at (defaults to now());
        // the table has no subscribed_at column.
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error creating subscription:', insertError);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    const discountCode = `WELCOME10-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    try {
      const emailResult = await emailService.sendNewsletterWelcome(
        email,
        discountCode,
        locale as 'sv' | 'en'
      );

      if (!emailResult.success) {
        console.error('Email service error:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

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
      },
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { data: subscription, error: findError } = await getSupabaseServer()
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

    if (subscription.verification_token !== token) {
      return NextResponse.json(
        { success: false, error: 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    const { error: updateError } = await getSupabaseServer()
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
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {
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
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
