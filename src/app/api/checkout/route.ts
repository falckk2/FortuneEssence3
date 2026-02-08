import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ICartService, IShippingService, IPaymentService, IOrderService } from '@/interfaces';
import { IEmailService } from '@/interfaces/email';
import { container, TOKENS } from '@/config/di-container';
import { config } from '@/config';
import { orderSchema } from '@/utils/validation';

const cartService = container.resolve<ICartService>(TOKENS.ICartService);
const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);
const paymentService = container.resolve<IPaymentService>(TOKENS.IPaymentService);
const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);
const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = request.headers.get('x-session-id');

    if (!session?.user?.id && !sessionId) {
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
      case 'validate-cart':
        return handleValidateCart(session?.user?.id, sessionId);
      
      case 'calculate-shipping':
        return handleCalculateShipping(body);
      
      case 'create-payment-intent':
        return handleCreatePaymentIntent(body);
      
      case 'process-payment':
        return handleProcessPayment(body, session?.user?.id);
      
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
    console.error('Checkout API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function handleValidateCart(userId?: string, sessionId?: string | null) {
  try {
    const cartResult = await cartService.getCart(userId, sessionId || undefined);
    
    if (!cartResult.success) {
      return NextResponse.json({
        success: false,
        error: cartResult.error,
      }, { status: 400 });
    }

    const cart = cartResult.data!;
    
    if (cart.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Cart is empty',
      }, { status: 400 });
    }

    // Validate cart items
    const validationResult = await cartService.validateCartItems(cart.id);
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: validationResult.error,
      }, { status: 400 });
    }

    // Get cart summary
    const summaryResult = await cartService.getCartSummary(cart.id);
    
    if (!summaryResult.success) {
      return NextResponse.json({
        success: false,
        error: summaryResult.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        cart,
        validation: validationResult.data,
        summary: summaryResult.data,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Cart validation failed: ${error}`,
    }, { status: 500 });
  }
}

async function handleCalculateShipping(body: any) {
  try {
    const { items, country, address } = body;
    
    if (!items || !country) {
      return NextResponse.json({
        success: false,
        error: 'Items and country are required',
      }, { status: 400 });
    }

    // Validate delivery address if provided
    if (address) {
      const addressValidation = await shippingService.validateDeliveryAddress(address);
      if (!addressValidation.success) {
        return NextResponse.json({
          success: false,
          error: addressValidation.error,
        }, { status: 400 });
      }
    }

    // Get shipping costs
    const shippingResult = await shippingService.calculateShipping(items, country);
    
    if (!shippingResult.success) {
      return NextResponse.json({
        success: false,
        error: shippingResult.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: shippingResult.data,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Shipping calculation failed: ${error}`,
    }, { status: 500 });
  }
}

async function handleCreatePaymentIntent(body: any) {
  try {
    const { amount, currency = 'SEK' } = body;
    
    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Valid amount is required',
      }, { status: 400 });
    }

    const result = await paymentService.createPaymentIntent(amount, currency);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: result.data,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Payment intent creation failed: ${error}`,
    }, { status: 500 });
  }
}

async function handleProcessPayment(body: any, userId?: string) {
  try {
    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.issues.map((issue) => issue.message).join(', '),
      }, { status: 400 });
    }

    const orderData = validation.data;

    // Ensure customer ID matches session
    if (userId && orderData.customerId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID mismatch',
      }, { status: 403 });
    }

    // Ensure all items have prices
    const itemsWithPrices = orderData.items.map(item => ({
      ...item,
      price: item.price || 0
    }));

    // Create order using OrderService (this handles payment, stock reservation, and DB persistence)
    const orderResult = await orderService.createOrder({
      ...orderData,
      items: itemsWithPrices
    });

    if (!orderResult.success) {
      return NextResponse.json({
        success: false,
        error: orderResult.error,
      }, { status: 400 });
    }

    const order = orderResult.data!;

    // Generate shipping label for confirmed orders
    let shippingLabel = null;
    if (order.status === 'confirmed') {
      try {
        const labelResult = await shippingService.generateShippingLabel(order);
        if (labelResult.success && labelResult.data) {
          shippingLabel = labelResult.data;
          console.log(`Shipping label generated for order ${order.id}: ${labelResult.data.trackingNumber}`);
        } else {
          console.error(`Failed to generate shipping label for order ${order.id}:`, labelResult.error);
        }
      } catch (labelError) {
        // Log error but don't fail the order
        console.error(`Error generating shipping label for order ${order.id}:`, labelError);
      }
    }

    // Send order confirmation emails
    const customerEmail = body.email;
    const customerName = `${body.firstName || ''} ${body.lastName || ''}`.trim() || 'Kund';

    if (customerEmail) {
      try {
        // Send confirmation to customer
        await emailService.sendOrderConfirmation(
          customerEmail,
          {
            orderId: order.id,
            customerName,
            items: order.items.map((item: any) => ({
              name: item.productName || item.name || 'Produkt',
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: order.total - order.tax - order.shipping,
            tax: order.tax,
            shippingCost: order.shipping,
            total: order.total,
            shippingAddress: formatAddress(order.shippingAddress),
            trackingNumber: order.trackingNumber,
          },
          'sv'
        );
        console.log(`Order confirmation email sent to ${customerEmail}`);
      } catch (emailError) {
        console.error(`Failed to send customer confirmation email:`, emailError);
      }

      try {
        // Send order copy to company for packaging
        const itemRows = order.items.map((item: any) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${item.productName || item.name || 'Produkt'}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${(item.price * item.quantity).toFixed(2)} kr</td>
          </tr>`
        ).join('');

        await emailService.sendEmail({
          to: config.email.supportEmail,
          subject: `Ny order - ${order.id.slice(0, 8)} - ${customerName}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#8B4513;">Ny order mottagen</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <tr><td style="padding:4px 0;font-weight:bold;">Order ID:</td><td>${order.id}</td></tr>
                <tr><td style="padding:4px 0;font-weight:bold;">Kund:</td><td>${customerName}</td></tr>
                <tr><td style="padding:4px 0;font-weight:bold;">E-post:</td><td>${customerEmail}</td></tr>
                <tr><td style="padding:4px 0;font-weight:bold;">Telefon:</td><td>${body.phone || 'Ej angivet'}</td></tr>
                <tr><td style="padding:4px 0;font-weight:bold;">Betalningsmetod:</td><td>${order.paymentMethod}</td></tr>
                <tr><td style="padding:4px 0;font-weight:bold;">Status:</td><td>${order.status}</td></tr>
              </table>

              <h3 style="color:#8B4513;">Produkter att packa</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <thead>
                  <tr style="background:#f5f5f5;">
                    <th style="padding:8px;text-align:left;">Produkt</th>
                    <th style="padding:8px;text-align:center;">Antal</th>
                    <th style="padding:8px;text-align:right;">Pris</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
                <tfoot>
                  <tr><td colspan="2" style="padding:8px;text-align:right;">Delsumma:</td><td style="padding:8px;text-align:right;">${(order.total - order.tax - order.shipping).toFixed(2)} kr</td></tr>
                  <tr><td colspan="2" style="padding:8px;text-align:right;">Moms (25%):</td><td style="padding:8px;text-align:right;">${order.tax.toFixed(2)} kr</td></tr>
                  <tr><td colspan="2" style="padding:8px;text-align:right;">Frakt:</td><td style="padding:8px;text-align:right;">${order.shipping.toFixed(2)} kr</td></tr>
                  <tr style="font-weight:bold;"><td colspan="2" style="padding:8px;text-align:right;border-top:2px solid #333;">Totalt:</td><td style="padding:8px;text-align:right;border-top:2px solid #333;">${order.total.toFixed(2)} kr</td></tr>
                </tfoot>
              </table>

              <h3 style="color:#8B4513;">Leveransadress</h3>
              <p style="white-space:pre-line;">${formatAddress(order.shippingAddress)}</p>

              <h3 style="color:#8B4513;">Faktureringsadress</h3>
              <p style="white-space:pre-line;">${formatAddress(order.billingAddress)}</p>

              ${shippingLabel ? `
                <h3 style="color:#8B4513;">Fraktinformation</h3>
                <p><strong>Transportör:</strong> ${shippingLabel.carrierCode}</p>
                <p><strong>Spårningsnummer:</strong> ${shippingLabel.trackingNumber}</p>
              ` : ''}

              <p style="margin-top:24px;"><a href="${process.env.NEXTAUTH_URL || ''}/admin/orders/${order.id}" style="color:#8B4513;">Visa order i admin</a></p>
            </div>
          `,
        });
        console.log(`Order copy sent to ${config.email.supportEmail}`);
      } catch (emailError) {
        console.error(`Failed to send admin order notification:`, emailError);
      }
    } else {
      console.warn(`Order ${order.id} created but no customer email provided for confirmation`);
    }

    // Determine if we need to redirect for payment
    const paymentRedirectUrl = order.paymentMethod === 'swish' || order.paymentMethod === 'klarna'
      ? `/checkout/${order.paymentMethod}?orderId=${order.id}`
      : null;

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          customerId: order.customerId,
          items: order.items,
          subtotal: order.total - order.tax - order.shipping,
          tax: order.tax,
          shipping: order.shipping,
          total: order.total,
          paymentId: order.paymentId,
          paymentStatus: order.status,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          paymentMethod: order.paymentMethod,
          carrier: order.carrier,
        },
        payment: {
          paymentId: order.paymentId,
          status: order.status === 'confirmed' ? 'success' : 'pending',
          redirectUrl: paymentRedirectUrl,
        },
        shippingLabel: shippingLabel ? {
          trackingNumber: shippingLabel.trackingNumber,
          carrierCode: shippingLabel.carrierCode,
          labelUrl: shippingLabel.labelPdfUrl,
        } : null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Payment processing failed: ${error}`,
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'payment-methods':
        return handleGetPaymentMethods();
      
      case 'shipping-countries':
        return handleGetShippingCountries();
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Checkout GET API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

async function handleGetPaymentMethods() {
  try {
    const result = await paymentService.getPaymentMethods();
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Failed to get payment methods: ${error}`,
    }, { status: 500 });
  }
}

async function handleGetShippingCountries() {
  try {
    const result = await shippingService.getSupportedCountries();

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Failed to get shipping countries: ${error}`,
    }, { status: 500 });
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