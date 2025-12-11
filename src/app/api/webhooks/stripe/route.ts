import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { container } from '@/config/di-container';
import { TOKENS } from '@/config/di-container';
import type { IOrderService } from '@/interfaces';
import type { IEmailService } from '@/interfaces/email';

// Get Stripe key with fallback for build time
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

// Initialize Stripe with API key
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-08-27.basil',
});

// Webhook signing secret for verifying webhook authenticity
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      const error = err as Error;
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log the event for debugging
    console.log('Stripe webhook event received:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      received: true,
      eventId: event.id,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handler for successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    console.log('Payment succeeded:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      orderId,
    });

    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    // Get services from DI container
    const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);
    const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

    // Update order status to confirmed
    const updateResult = await orderService.updateOrderStatus(orderId, 'confirmed');
    if (!updateResult.success) {
      console.error('Failed to update order status:', updateResult.error);
      return;
    }
    console.log(`Order ${orderId} marked as confirmed`);

    // Get order details for email
    const orderResult = await orderService.getOrder(orderId);
    if (!orderResult.success || !orderResult.data) {
      console.error('Failed to get order details:', orderResult.error);
      return;
    }

    const order = orderResult.data;
    const customerEmail = paymentIntent.receipt_email || paymentIntent.metadata.customerEmail;

    if (!customerEmail) {
      console.error('No customer email found in payment intent');
      return;
    }

    // Send order confirmation email to customer
    const customerName = `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim();
    await emailService.sendOrderConfirmation(
      customerEmail,
      {
        orderId: order.id,
        customerName: customerName || 'Kund',
        items: order.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        shippingAddress: formatAddress(order.shippingAddress),
      },
      'sv'
    );
    console.log(`Order confirmation email sent to ${customerEmail}`);

    // Send admin notification
    const adminEmail = process.env.EMAIL_SUPPORT || 'support@fortuneessence.se';
    await emailService.sendEmail({
      to: adminEmail,
      subject: `Ny betalning mottagen - Order ${orderId}`,
      html: `
        <h2>Ny betalning mottagen</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Belopp:</strong> ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}</p>
        <p><strong>Betalningsmetod:</strong> Stripe</p>
        <p><strong>Kund:</strong> ${customerEmail}</p>
        <p><strong>PaymentIntent ID:</strong> ${paymentIntent.id}</p>
        <p><a href="${process.env.NEXTAUTH_URL}/admin/orders/${orderId}">Visa order</a></p>
      `,
    });
    console.log('Admin notification sent');

    console.log(`Order ${orderId} marked as confirmed and paid`);

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
}

// Handler for failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const failureMessage = paymentIntent.last_payment_error?.message || 'Betalningen misslyckades';

    console.log('Payment failed:', {
      paymentIntentId: paymentIntent.id,
      orderId,
      failureMessage,
    });

    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    // Get services from DI container
    const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);
    const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

    // Update order status to cancelled (payment failed)
    const updateResult = await orderService.updateOrderStatus(orderId, 'cancelled');
    if (!updateResult.success) {
      console.error('Failed to update order status:', updateResult.error);
    } else {
      console.log(`Order ${orderId} marked as cancelled due to payment failure`);
    }

    // Get customer email
    const customerEmail = paymentIntent.receipt_email || paymentIntent.metadata.customerEmail;

    if (customerEmail) {
      // Send payment failed notification to customer (Swedish)
      await emailService.sendEmail({
        to: customerEmail,
        subject: 'Betalningen misslyckades - Fortune Essence',
        html: `
          <h2>Betalningen misslyckades</h2>
          <p>Tyvärr misslyckades betalningen för din order.</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Anledning:</strong> ${failureMessage}</p>
          <p>Du kan försöka igen genom att gå till kassan och slutföra din beställning.</p>
          <p><a href="${process.env.NEXTAUTH_URL}/checkout?orderId=${orderId}">Försök igen</a></p>
          <p>Om problemet kvarstår, vänligen kontakta vår kundtjänst.</p>
          <br>
          <p>Med vänliga hälsningar,<br>Fortune Essence</p>
        `,
      });
      console.log(`Payment failed notification sent to ${customerEmail}`);
    }

    // Send admin notification about failed payment
    const adminEmail = process.env.EMAIL_SUPPORT || 'support@fortuneessence.se';
    await emailService.sendEmail({
      to: adminEmail,
      subject: `Betalning misslyckades - Order ${orderId}`,
      html: `
        <h2>Betalning misslyckades</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>PaymentIntent ID:</strong> ${paymentIntent.id}</p>
        <p><strong>Belopp:</strong> ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}</p>
        <p><strong>Kund:</strong> ${customerEmail || 'Okänd'}</p>
        <p><strong>Felmeddelande:</strong> ${failureMessage}</p>
        <p><a href="${process.env.NEXTAUTH_URL}/admin/orders/${orderId}">Visa order</a></p>
      `,
    });
    console.log('Admin notification sent about failed payment');

    console.log(`Order ${orderId} marked as payment failed`);

  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw error;
  }
}

// Handler for canceled payment intent
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    console.log('Payment canceled:', {
      paymentIntentId: paymentIntent.id,
      orderId,
    });

    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    // Get OrderService from DI container
    const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);

    // Cancel order (this will also release stock reservation via OrderService)
    const cancelResult = await orderService.cancelOrder(orderId);
    if (!cancelResult.success) {
      console.error('Failed to cancel order:', cancelResult.error);
      return;
    }

    console.log(`Order ${orderId} marked as cancelled and stock reservation released`);

  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error);
    throw error;
  }
}

// Handler for refunded charge
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    const paymentIntentId = charge.payment_intent as string;
    const refundAmount = charge.amount_refunded / 100; // Convert from smallest currency unit

    console.log('Charge refunded:', {
      chargeId: charge.id,
      paymentIntentId,
      amountRefunded: charge.amount_refunded,
    });

    // Get EmailService from DI container
    const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

    // Get customer email from charge metadata or billing details
    const customerEmail = charge.receipt_email || charge.billing_details?.email;
    const orderId = charge.metadata?.orderId;

    if (customerEmail) {
      // Send refund confirmation email to customer (Swedish)
      await emailService.sendEmail({
        to: customerEmail,
        subject: 'Återbetalning bekräftad - Fortune Essence',
        html: `
          <h2>Återbetalning bekräftad</h2>
          <p>Din återbetalning har behandlats.</p>
          ${orderId ? `<p><strong>Order ID:</strong> ${orderId}</p>` : ''}
          <p><strong>Återbetalat belopp:</strong> ${refundAmount.toFixed(2)} ${charge.currency.toUpperCase()}</p>
          <p><strong>Referensnummer:</strong> ${charge.id}</p>
          <p>Pengarna kommer att återbetalas till ditt originalkort inom 5-10 arbetsdagar.</p>
          <p>Observera att det kan ta lite längre tid beroende på din bank.</p>
          <br>
          <p>Om du har några frågor, tveka inte att kontakta vår kundtjänst.</p>
          <br>
          <p>Med vänliga hälsningar,<br>Fortune Essence</p>
        `,
      });
      console.log(`Refund confirmation email sent to ${customerEmail}`);
    } else {
      console.warn('No customer email found for refund notification');
    }

  } catch (error) {
    console.error('Error handling charge.refunded:', error);
    throw error;
  }
}

// Handler for dispute created
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  try {
    const chargeId = dispute.charge as string;
    const reason = dispute.reason;
    const disputeAmount = dispute.amount / 100; // Convert from smallest currency unit
    const evidenceDeadline = dispute.evidence_details?.due_by
      ? new Date(dispute.evidence_details.due_by * 1000).toLocaleString('sv-SE')
      : 'Ej angivet';

    console.log('Dispute created:', {
      disputeId: dispute.id,
      chargeId,
      reason,
      amount: dispute.amount,
    });

    // Get EmailService from DI container
    const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

    // Send URGENT email to admin/support
    const adminEmail = process.env.EMAIL_SUPPORT || 'support@fortuneessence.se';
    await emailService.sendEmail({
      to: adminEmail,
      subject: `🚨 BRÅDSKANDE: Betalningsdispyt skapad - ${dispute.id}`,
      html: `
        <div style="border: 3px solid #dc3545; padding: 20px; background-color: #fff5f5;">
          <h1 style="color: #dc3545;">🚨 BRÅDSKANDE ÅTGÄRD KRÄVS</h1>
          <h2>En betalningsdispyt har skapats</h2>

          <h3>Disputinformation:</h3>
          <ul>
            <li><strong>Dispyt ID:</strong> ${dispute.id}</li>
            <li><strong>Charge ID:</strong> ${chargeId}</li>
            <li><strong>Belopp:</strong> ${disputeAmount.toFixed(2)} ${dispute.currency.toUpperCase()}</li>
            <li><strong>Anledning:</strong> ${reason}</li>
            <li><strong>Status:</strong> ${dispute.status}</li>
            <li><strong>Svarsfrist:</strong> <span style="color: #dc3545; font-weight: bold;">${evidenceDeadline}</span></li>
          </ul>

          <h3>Vad du behöver göra:</h3>
          <ol>
            <li>Granska disputen omedelbart i Stripe Dashboard</li>
            <li>Samla in all relevant dokumentation och bevis</li>
            <li>Svara innan deadline: ${evidenceDeadline}</li>
            <li>Kontakta kunden om möjligt för att lösa situationen</li>
          </ol>

          <p style="margin-top: 20px;">
            <a href="https://dashboard.stripe.com/disputes/${dispute.id}"
               style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Visa dispyt i Stripe Dashboard
            </a>
          </p>

          <p style="color: #dc3545; font-weight: bold; margin-top: 20px;">
            OBS: Om du inte svarar i tid kan disputen leda till förlust av pengarna och eventuella avgifter.
          </p>
        </div>
      `,
    });
    console.log(`URGENT dispute notification sent to ${adminEmail}`);

  } catch (error) {
    console.error('Error handling charge.dispute.created:', error);
    throw error;
  }
}

// Helper function to format address for emails
function formatAddress(address: any): string {
  const parts = [
    address.street,
    `${address.postalCode} ${address.city}`,
    address.country
  ].filter(Boolean);
  return parts.join('\n');
}

// Verify webhook endpoint is reachable (for Stripe CLI testing)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
