import { NextRequest, NextResponse } from 'next/server';

// Mock analytics data for demonstration
// In production, this would calculate from real order and customer data
const mockAnalytics = {
  week: {
    revenue: {
      total: 12450.00,
      today: 1850.00,
      thisWeek: 12450.00,
      thisMonth: 45230.00,
      change: 15.3,
    },
    orders: {
      total: 87,
      today: 12,
      thisWeek: 87,
      thisMonth: 312,
      change: 8.7,
    },
    customers: {
      total: 245,
      new: 18,
      returning: 69,
      change: 12.4,
    },
    products: {
      totalSold: 187,
      topSelling: [
        {
          id: 'lavender-oil-10ml',
          name: 'Lavendelolja 10ml',
          quantity: 45,
          revenue: 6705.00,
        },
        {
          id: 'peppermint-oil-10ml',
          name: 'Pepparmyntaolja 10ml',
          quantity: 32,
          revenue: 4448.00,
        },
        {
          id: 'eucalyptus-oil-10ml',
          name: 'Eucalyptusolja 10ml',
          quantity: 28,
          revenue: 4172.00,
        },
        {
          id: 'tea-tree-oil-10ml',
          name: 'Tea Tree olja 10ml',
          quantity: 24,
          revenue: 3576.00,
        },
        {
          id: 'rose-oil-5ml',
          name: 'Rosolja 5ml',
          quantity: 18,
          revenue: 5382.00,
        },
      ],
    },
    revenueByCategory: [
      {
        category: 'essential-oils',
        revenue: 7845.00,
        percentage: 63.0,
      },
      {
        category: 'carrier-oils',
        revenue: 2234.00,
        percentage: 17.9,
      },
      {
        category: 'diffusers',
        revenue: 1456.00,
        percentage: 11.7,
      },
      {
        category: 'accessories',
        revenue: 615.00,
        percentage: 4.9,
      },
      {
        category: 'gift-sets',
        revenue: 300.00,
        percentage: 2.4,
      },
    ],
    recentSales: [
      { date: '2024-11-16', revenue: 2450.00, orders: 18 },
      { date: '2024-11-15', revenue: 1890.00, orders: 14 },
      { date: '2024-11-14', revenue: 2120.00, orders: 15 },
      { date: '2024-11-13', revenue: 1670.00, orders: 12 },
      { date: '2024-11-12', revenue: 1980.00, orders: 13 },
      { date: '2024-11-11', revenue: 1340.00, orders: 9 },
      { date: '2024-11-10', revenue: 1000.00, orders: 6 },
    ],
  },
  month: {
    revenue: {
      total: 45230.00,
      today: 1850.00,
      thisWeek: 12450.00,
      thisMonth: 45230.00,
      change: 22.5,
    },
    orders: {
      total: 312,
      today: 12,
      thisWeek: 87,
      thisMonth: 312,
      change: 18.2,
    },
    customers: {
      total: 245,
      new: 65,
      returning: 180,
      change: 28.6,
    },
    products: {
      totalSold: 687,
      topSelling: [
        {
          id: 'lavender-oil-10ml',
          name: 'Lavendelolja 10ml',
          quantity: 165,
          revenue: 24585.00,
        },
        {
          id: 'peppermint-oil-10ml',
          name: 'Pepparmyntaolja 10ml',
          quantity: 142,
          revenue: 19738.00,
        },
        {
          id: 'eucalyptus-oil-10ml',
          name: 'Eucalyptusolja 10ml',
          quantity: 98,
          revenue: 14602.00,
        },
        {
          id: 'tea-tree-oil-10ml',
          name: 'Tea Tree olja 10ml',
          quantity: 87,
          revenue: 12963.00,
        },
        {
          id: 'rose-oil-5ml',
          name: 'Rosolja 5ml',
          quantity: 56,
          revenue: 16744.00,
        },
      ],
    },
    revenueByCategory: [
      {
        category: 'essential-oils',
        revenue: 28495.00,
        percentage: 63.0,
      },
      {
        category: 'carrier-oils',
        revenue: 8096.00,
        percentage: 17.9,
      },
      {
        category: 'diffusers',
        revenue: 5292.00,
        percentage: 11.7,
      },
      {
        category: 'accessories',
        revenue: 2216.00,
        percentage: 4.9,
      },
      {
        category: 'gift-sets',
        revenue: 1085.00,
        percentage: 2.4,
      },
    ],
    recentSales: [
      { date: '2024-11-16', revenue: 2450.00, orders: 18 },
      { date: '2024-11-15', revenue: 1890.00, orders: 14 },
      { date: '2024-11-14', revenue: 2120.00, orders: 15 },
      { date: '2024-11-13', revenue: 1670.00, orders: 12 },
      { date: '2024-11-12', revenue: 1980.00, orders: 13 },
      { date: '2024-11-11', revenue: 1340.00, orders: 9 },
      { date: '2024-11-10', revenue: 1000.00, orders: 6 },
      { date: '2024-11-09', revenue: 1560.00, orders: 11 },
      { date: '2024-11-08', revenue: 1780.00, orders: 12 },
      { date: '2024-11-07', revenue: 1920.00, orders: 14 },
      { date: '2024-11-06', revenue: 1450.00, orders: 10 },
      { date: '2024-11-05', revenue: 2230.00, orders: 16 },
      { date: '2024-11-04', revenue: 1670.00, orders: 12 },
      { date: '2024-11-03', revenue: 890.00, orders: 6 },
    ],
  },
  year: {
    revenue: {
      total: 487650.00,
      today: 1850.00,
      thisWeek: 12450.00,
      thisMonth: 45230.00,
      change: 35.8,
    },
    orders: {
      total: 3456,
      today: 12,
      thisWeek: 87,
      thisMonth: 312,
      change: 42.3,
    },
    customers: {
      total: 1234,
      new: 456,
      returning: 778,
      change: 38.9,
    },
    products: {
      totalSold: 7845,
      topSelling: [
        {
          id: 'lavender-oil-10ml',
          name: 'Lavendelolja 10ml',
          quantity: 1876,
          revenue: 279524.00,
        },
        {
          id: 'peppermint-oil-10ml',
          name: 'Pepparmyntaolja 10ml',
          quantity: 1542,
          revenue: 214338.00,
        },
        {
          id: 'eucalyptus-oil-10ml',
          name: 'Eucalyptusolja 10ml',
          quantity: 1123,
          revenue: 167307.00,
        },
        {
          id: 'tea-tree-oil-10ml',
          name: 'Tea Tree olja 10ml',
          quantity: 987,
          revenue: 147063.00,
        },
        {
          id: 'rose-oil-5ml',
          name: 'Rosolja 5ml',
          quantity: 654,
          revenue: 195546.00,
        },
      ],
    },
    revenueByCategory: [
      {
        category: 'essential-oils',
        revenue: 307219.50,
        percentage: 63.0,
      },
      {
        category: 'carrier-oils',
        revenue: 87289.35,
        percentage: 17.9,
      },
      {
        category: 'diffusers',
        revenue: 57055.05,
        percentage: 11.7,
      },
      {
        category: 'accessories',
        revenue: 23894.85,
        percentage: 4.9,
      },
      {
        category: 'gift-sets',
        revenue: 11703.60,
        percentage: 2.4,
      },
    ],
    recentSales: [
      { date: '2024-11', revenue: 45230.00, orders: 312 },
      { date: '2024-10', revenue: 42156.00, orders: 298 },
      { date: '2024-09', revenue: 38920.00, orders: 276 },
      { date: '2024-08', revenue: 41235.00, orders: 289 },
      { date: '2024-07', revenue: 39670.00, orders: 281 },
      { date: '2024-06', revenue: 37890.00, orders: 267 },
      { date: '2024-05', revenue: 40125.00, orders: 285 },
      { date: '2024-04', revenue: 38456.00, orders: 272 },
      { date: '2024-03', revenue: 35678.00, orders: 251 },
      { date: '2024-02', revenue: 33490.00, orders: 238 },
      { date: '2024-01', revenue: 36800.00, orders: 260 },
      { date: '2023-12', revenue: 58000.00, orders: 427 },
    ],
  },
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    if (!['week', 'month', 'year'].includes(range)) {
      return NextResponse.json(
        { success: false, error: 'Invalid range parameter' },
        { status: 400 }
      );
    }

    // TODO: Implement database queries
    /*
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    // Calculate revenue metrics
    const { data: orders } = await supabase
      .from('orders')
      .select('total, createdAt, status')
      .gte('createdAt', startDate.toISOString())
      .eq('status', 'delivered');

    const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;

    // Calculate orders metrics
    const totalOrders = orders?.length || 0;

    // Calculate customer metrics
    const { data: customers } = await supabase
      .from('customers')
      .select('id, createdAt')
      .gte('createdAt', startDate.toISOString());

    const { data: returningCustomers } = await supabase
      .from('orders')
      .select('customerId')
      .gte('createdAt', startDate.toISOString())
      .then(result => {
        const customerOrders = new Map();
        result.data?.forEach(order => {
          customerOrders.set(
            order.customerId,
            (customerOrders.get(order.customerId) || 0) + 1
          );
        });
        return Array.from(customerOrders.values()).filter(count => count > 1).length;
      });

    // Top selling products
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        product:products (
          id,
          translations
        )
      `)
      .gte('createdAt', startDate.toISOString());

    const productStats = new Map();
    orderItems?.forEach(item => {
      const productId = item.product.id;
      if (!productStats.has(productId)) {
        productStats.set(productId, {
          id: productId,
          name: item.product.translations.sv.name,
          quantity: 0,
          revenue: 0,
        });
      }
      const stats = productStats.get(productId);
      stats.quantity += item.quantity;
      stats.revenue += item.price * item.quantity;
    });

    const topSelling = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Revenue by category
    // ... similar calculations

    return NextResponse.json({
      success: true,
      data: {
        revenue: { ... },
        orders: { ... },
        customers: { ... },
        products: { topSelling, ... },
        revenueByCategory: [ ... ],
        recentSales: [ ... ],
      }
    });
    */

    // For now, return mock data
    const analyticsData = mockAnalytics[range as keyof typeof mockAnalytics];

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
