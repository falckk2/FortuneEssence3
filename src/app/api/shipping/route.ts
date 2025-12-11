import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { IShippingService } from '@/interfaces';
import { container, TOKENS } from '@/config/di-container';

const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

export async function GET(request: NextRequest) {
  try {
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
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Shipping API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Shipping POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
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
        {
          success: false,
          error: 'Weight parameter is required',
        },
        { status: 400 }
      );
    }

    const weight = parseFloat(weightParam);
    const result = await shippingService.getShippingRates(country, weight);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get shipping rates: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleGetCountries() {
  try {
    const result = await shippingService.getSupportedCountries();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get countries: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleGetCarrierServices() {
  try {
    const result = await shippingService.getSwedishCarrierServices();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get carrier services: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleValidatePostalCode(searchParams: URLSearchParams) {
  try {
    const postalCode = searchParams.get('postalCode');
    
    if (!postalCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Postal code is required',
        },
        { status: 400 }
      );
    }

    const result = await shippingService.validateSwedishPostalCode(postalCode);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to validate postal code: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleCalculateShipping(body: any) {
  try {
    const { items, country, postalCode } = body;

    if (!items || !country) {
      return NextResponse.json(
        {
          success: false,
          error: 'Items and country are required',
        },
        { status: 400 }
      );
    }

    // If Swedish postal code provided, use Swedish-specific calculation
    if (country === 'Sweden' && postalCode) {
      const result = await shippingService.calculateSwedishShippingWithZones(items, postalCode);

      if (!result.success || !result.data) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to calculate shipping',
          },
          { status: 400 }
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
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to calculate shipping: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleCalculateEcoShipping(body: any) {
  try {
    const { items, country } = body;

    if (!items || !country) {
      return NextResponse.json(
        {
          success: false,
          error: 'Items and country are required',
        },
        { status: 400 }
      );
    }

    const result = await shippingService.calculateEcoShipping(items, country);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to calculate eco shipping: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleCalculateSwedishShipping(body: any) {
  try {
    const { items, postalCode } = body;

    if (!items || !postalCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Items and postal code are required',
        },
        { status: 400 }
      );
    }

    const result = await shippingService.calculateSwedishShippingWithZones(items, postalCode);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to calculate Swedish shipping: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleValidateAddress(body: any) {
  try {
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address is required',
        },
        { status: 400 }
      );
    }

    const result = await shippingService.validateDeliveryAddress(address);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to validate address: ${error}`,
      },
      { status: 500 }
    );
  }
}

async function handleGetHolidayImpact(body: any) {
  try {
    const { deliveryDate } = body;

    if (!deliveryDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delivery date is required',
        },
        { status: 400 }
      );
    }

    const date = new Date(deliveryDate);
    const result = await shippingService.getSwedishHolidayImpact(date.toISOString());

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get holiday impact: ${error}`,
      },
      { status: 500 }
    );
  }
}