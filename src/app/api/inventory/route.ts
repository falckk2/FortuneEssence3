import '@/config/di-init';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase-server';
import { InventoryRepository } from '@/repositories/inventory/InventoryRepository';

const inventoryRepo = new InventoryRepository();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const [reportResult, lowStockResult] = await Promise.all([
      inventoryRepo.getInventoryReport(),
      inventoryRepo.getLowStockItems(),
    ]);

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
      console.error('Inventory GET - DB error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        report: reportResult.success ? reportResult.data : null,
        lowStockIds: lowStockResult.success && lowStockResult.data
          ? lowStockResult.data.map(i => i.productId)
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
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
    }

    const { adjustment, reason } = await request.json();
    if (typeof adjustment !== 'number') {
      return NextResponse.json({ success: false, error: 'adjustment (number) required' }, { status: 400 });
    }

    const result = await inventoryRepo.adjustStock(productId, adjustment, reason);

    if (!result.success) {
      console.error('Inventory PATCH - failed to adjust stock:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Inventory PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
    }

    const { reorderLevel } = await request.json();
    if (typeof reorderLevel !== 'number') {
      return NextResponse.json({ success: false, error: 'reorderLevel (number) required' }, { status: 400 });
    }

    const result = await inventoryRepo.updateReorderLevel(productId, reorderLevel);

    if (!result.success) {
      console.error('Inventory PUT - failed to update reorder level:', result.error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Inventory PUT error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
