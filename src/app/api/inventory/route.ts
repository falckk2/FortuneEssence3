import { NextRequest, NextResponse } from 'next/server';
import '@/config/di-init';
import { getToken } from 'next-auth/jwt';
import { getSupabaseServer } from '@/lib/supabase-server';
import { InventoryRepository } from '@/repositories/inventory/InventoryRepository';

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const inventoryRepo = new InventoryRepository();

    // Get summary report and per-product data in parallel
    const [reportResult, lowStockResult] = await Promise.all([
      inventoryRepo.getInventoryReport(),
      inventoryRepo.getLowStockItems(),
    ]);

    // Get all inventory with product info
    const supabase = getSupabaseServer();
    const { data: inventoryData, error } = await supabase
      .from('inventory')
      .select(`
        *,
        products (
          id,
          name_en,
          name_sv,
          sku,
          is_active
        )
      `)
      .order('product_id');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        report: reportResult.success ? reportResult.data : null,
        lowStockIds: lowStockResult.success
          ? lowStockResult.data!.map(i => i.productId)
          : [],
        items: inventoryData.map((row: any) => ({
          productId: row.product_id,
          quantity: row.quantity,
          reservedQuantity: row.reserved_quantity,
          reorderLevel: row.reorder_level,
          lastUpdated: row.last_updated,
          product: row.products
            ? {
                id: row.products.id,
                nameSv: row.products.name_sv,
                nameEn: row.products.name_en,
                sku: row.products.sku,
                isActive: row.products.is_active,
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
    }

    const { adjustment, reason } = await request.json();
    if (typeof adjustment !== 'number') {
      return NextResponse.json({ success: false, error: 'adjustment (number) required' }, { status: 400 });
    }

    const inventoryRepo = new InventoryRepository();
    const result = await inventoryRepo.adjustStock(productId, adjustment, reason);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Inventory PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
    }

    const { reorderLevel } = await request.json();
    if (typeof reorderLevel !== 'number') {
      return NextResponse.json({ success: false, error: 'reorderLevel (number) required' }, { status: 400 });
    }

    const inventoryRepo = new InventoryRepository();
    const result = await inventoryRepo.updateReorderLevel(productId, reorderLevel);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Inventory PUT error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
