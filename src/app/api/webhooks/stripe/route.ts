import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
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

    // TODO: Update order in database
    /*
    await updateOrder(orderId, {
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentIntentId: paymentIntent.id,
      paidAt: new Date(),
    });
    */

    // TODO: Send order confirmation email to customer
    /*
    await sendEmail({
      to: paymentIntent.receipt_email || '',
      subject: 'Orderbekräftelse - Fortune Essence',
      template: 'order-confirmation',
      data: {
        orderId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        trackingUrl: `${process.env.NEXTAUTH_URL}/account/orders/${orderId}`
      }
    });
    */

    // TODO: Trigger inventory update
    /*
    await updateInventoryForOrder(orderId);
    */

    // TODO: Notify admin of new paid order
    /*
    await sendAdminNotification({
      type: 'new-order',
      orderId,
      amount: paymentIntent.amount / 100,
      paymentMethod: 'stripe',
    });
    */

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
    const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

    console.log('Payment failed:', {
      paymentIntentId: paymentIntent.id,
      orderId,
      failureMessage,
    });

    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }

    // TODO: Update order in database
    /*
    await updateOrder(orderId, {
      status: 'payment_failed',
      paymentStatus: 'failed',
      paymentFailureReason: failureMessage,
    });
    */

    // TODO: Send payment failed notification to customer
    /*
    await sendEmail({
      to: paymentIntent.receipt_email || '',
      subject: 'Betalningen misslyckades - Fortune Essence',
      template: 'payment-failed',
      data: {
        orderId,
        failureMessage,
        retryUrl: `${process.env.NEXTAUTH_URL}/checkout?orderId=${orderId}`,
      }
    });
    */

    // TODO: Notify admin of failed payment
    /*
    await sendAdminNotification({
      type: 'payment-failed',
      orderId,
      reason: failureMessage,
    });
    */

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

    // TODO: Update order in database
    /*
    await updateOrder(orderId, {
      status: 'cancelled',
      paymentStatus: 'cancelled',
      cancelledAt: new Date(),
    });
    */

    // TODO: Release inventory hold
    /*
    await releaseInventoryHold(orderId);
    */

    console.log(`Order ${orderId} marked as cancelled`);

  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error);
    throw error;
  }
}

// Handler for refunded charge
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    const paymentIntentId = charge.payment_intent as string;

    console.log('Charge refunded:', {
      chargeId: charge.id,
      paymentIntentId,
      amountRefunded: charge.amount_refunded,
    });

    // TODO: Find order by payment intent ID and update
    /*
    const order = await findOrderByPaymentIntentId(paymentIntentId);

    if (order) {
      await updateOrder(order.id, {
        status: 'refunded',
        paymentStatus: 'refunded',
        refundedAmount: charge.amount_refunded / 100,
        refundedAt: new Date(),
      });

      // Send refund confirmation email
      await sendEmail({
        to: charge.receipt_email || order.customerEmail,
        subject: 'Återbetalning bekräftad - Fortune Essence',
        template: 'refund-confirmation',
        data: {
          orderId: order.id,
          refundAmount: charge.amount_refunded / 100,
          currency: charge.currency.toUpperCase(),
          expectedDays: '5-10 arbetsdagar',
        }
      });
    }
    */

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

    console.log('Dispute created:', {
      disputeId: dispute.id,
      chargeId,
      reason,
      amount: dispute.amount,
    });

    // TODO: Find order by charge ID and flag for review
    /*
    const order = await findOrderByChargeId(chargeId);

    if (order) {
      await updateOrder(order.id, {
        status: 'disputed',
        disputeId: dispute.id,
        disputeReason: reason,
        disputeAmount: dispute.amount / 100,
      });

      // Notify admin urgently
      await sendAdminNotification({
        type: 'urgent-dispute',
        orderId: order.id,
        disputeId: dispute.id,
        reason,
        amount: dispute.amount / 100,
        deadline: new Date(dispute.evidence_details?.due_by || 0),
      });
    }
    */

  } catch (error) {
    console.error('Error handling charge.dispute.created:', error);
    throw error;
  }
}

// Verify webhook endpoint is reachable (for Stripe CLI testing)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
