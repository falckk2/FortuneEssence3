export const dynamic = 'force-dynamic'
import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import type { IShippingService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';
import { checkRateLimit, getClientIp } from '@/utils/rateLimit';

const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const SHIPPING_RATE_FORM_TYPE = 'shipping-api';

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(SHIPPING_RATE_FORM_TYPE, ip, MAX_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW_MS);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'rates':
        return handleGetRates(searchParams);

      case 'countries':
        return handleGetCountries();

      case 'carrier-services':
        return handleGetCarrierServices();

      case 'validate-postal-code':
        return handleValidatePostalCode(searchParams);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Shipping GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(SHIPPING_RATE_FORM_TYPE, ip, MAX_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW_MS);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'calculate-shipping':
        return handleCalculateShipping(body);

      case 'calculate-eco-shipping':
        return handleCalculateEcoShipping(body);

      case 'calculate-swedish-shipping':
        return handleCalculateSwedishShipping(body);

      case 'validate-address':
        return handleValidateAddress(body);

      case 'get-holiday-impact':
        return handleGetHolidayImpact(body);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Shipping POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetRates(searchParams: URLSearchParams) {
  try {
    const country = searchParams.get('country') || 'Sweden';
    const weightParam = searchParams.get('weight');

    if (!weightParam) {
      return NextResponse.json(
        { success: false, error: 'Weight parameter is required' },
        { status: 400 }
      );
    }

    const weight = parseFloat(weightParam);
    const result = await shippingService.getShippingRates(country, weight);

    if (!result.success) {
      console.error('Shipping - failed to get rates:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping - get rates error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetCountries() {
  try {
    const result = await shippingService.getSupportedCountries();

    if (!result.success) {
      console.error('Shipping - failed to get countries:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping - get countries error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetCarrierServices() {
  try {
    const result = await shippingService.getSwedishCarrierServices();

    if (!result.success) {
      console.error('Shipping - failed to get carrier services:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping - get carrier services error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleValidatePostalCode(searchParams: URLSearchParams) {
  try {
    const postalCode = searchParams.get('postalCode');

    if (!postalCode) {
      return NextResponse.json(
        { success: false, error: 'Postal code is required' },
        { status: 400 }
      );
    }

    const result = await shippingService.validateSwedishPostalCode(postalCode);

    if (!result.success) {
      console.error('Shipping - failed to validate postal code:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping - validate postal code error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCalculateShipping(body: any) {
  try {
    const { items, country, postalCode } = body;

    if (!items || !country) {
      return NextResponse.json(
        { success: false, error: 'Items and country are required' },
        { status: 400 }
      );
    }

    // If Swedish postal code provided, use Swedish-specific calculation
    if (country === 'Sweden' && postalCode) {
      const result = await shippingService.calculateSwedishShippingWithZones(items, postalCode);

      if (!result.success || !result.data) {
        console.error('Shipping - failed to calculate Swedish shipping with zones:', result.error);
        return NextResponse.json(
          { success: false, error: 'Internal server error' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          options: [(result.data as any).adjustedRate],
          recommended: (result.data as any).adjustedRate,
          zoneInfo: (result.data as any).zoneInfo,
        },
      });
    }

    // Standard shipping calculation
    const result = await shippingService.getShippingCosts(items, country);

    if (!result.success) {
      console.error('Shipping - failed to calculate shipping:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping - calculate shipping error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCalculateEcoShipping(body: any) {
  try {
    const { items, country } = body;

    if (!items || !country) {
      return NextResponse.json(
        { success: false, error: 'Items and country are required' },
        { status: 400 }
      );
    }

    const result = await shippingService.calculateEcoShipping(items, country);

    if (!result.success) {
      console.error('Shipping - failed to calculate eco shipping:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping - calculate eco shipping error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCalculateSwedishShipping(body: any) {
  try {
    const { items, postalCode } = body;

    if (!items || !postalCode) {
      return NextResponse.json(
        { success: false, error: 'Items and postal code are required' },
        { status: 400 }
      );
    }

    const result = await shippingService.calculateSwedishShippingWithZones(items, postalCode);

    if (!result.success) {
      console.error('Shipping - failed to calculate Swedish shipping:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping - calculate Swedish shipping error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleValidateAddress(body: any) {
  try {
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    const result = await shippingService.validateDeliveryAddress(address);

    if (!result.success) {
      console.error('Shipping - failed to validate address:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping - validate address error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetHolidayImpact(body: any) {
  try {
    const { deliveryDate } = body;

    if (!deliveryDate) {
      return NextResponse.json(
        { success: false, error: 'Delivery date is required' },
        { status: 400 }
      );
    }

    const date = new Date(deliveryDate);
    const result = await shippingService.getSwedishHolidayImpact(date.toISOString());

    if (!result.success) {
      console.error('Shipping - failed to get holiday impact:', result.error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Shipping - get holiday impact error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
