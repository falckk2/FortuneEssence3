import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { CartService } from '@/services/cart/CartService';
import { ShippingService } from '@/services/shipping/ShippingService';
import { PaymentService } from '@/services/payment/PaymentService';
import { orderSchema } from '@/utils/validation';

const cartService = new CartService();
const shippingService = new ShippingService();
const paymentService = new PaymentService();

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
    const shippingResult = await shippingService.getShippingCosts(items, country);
    
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
        error: validation.error.errors.map(err => err.message).join(', '),
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

    // Calculate total amount
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.25; // 25% VAT
    
    // Get shipping cost
    const shippingResult = await shippingService.calculateShipping(orderData.items, orderData.shippingAddress.country);
    
    if (!shippingResult.success) {
      return NextResponse.json({
        success: false,
        error: `Shipping calculation failed: ${shippingResult.error}`,
      }, { status: 400 });
    }

    const shippingCost = shippingResult.data!.price;
    const totalAmount = subtotal + tax + shippingCost;

    // Process payment
    const paymentResult = await paymentService.processPayment({
      amount: totalAmount,
      currency: 'SEK',
      method: orderData.paymentMethod,
      orderId: `temp_${Date.now()}`, // Temporary ID, will be replaced with actual order ID
      customerId: orderData.customerId,
      metadata: {
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
      },
    });

    if (!paymentResult.success) {
      return NextResponse.json({
        success: false,
        error: paymentResult.error,
      }, { status: 400 });
    }

    // Create order (this would typically be done in OrderService)
    const orderSummary = {
      customerId: orderData.customerId,
      items: orderData.items,
      subtotal,
      tax,
      shipping: shippingCost,
      total: totalAmount,
      paymentId: paymentResult.data!.paymentId,
      paymentStatus: paymentResult.data!.status,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentMethod: orderData.paymentMethod,
    };

    return NextResponse.json({
      success: true,
      data: {
        order: orderSummary,
        payment: paymentResult.data,
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