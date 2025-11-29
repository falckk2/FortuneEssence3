import { NextRequest, NextResponse } from 'next/server';

// Mock customer data for demonstration
// In production, this would fetch from the database
const mockCustomers = [
  {
    id: 'cust-001',
    name: 'Anna Andersson',
    email: 'anna.andersson@example.com',
    phone: '+46 70 123 4567',
    createdAt: '2024-01-15T10:30:00Z',
    totalOrders: 8,
    totalSpent: 3456.00,
    lastOrderDate: '2024-11-10T14:20:00Z',
    status: 'active' as const,
    newsletter: true,
  },
  {
    id: 'cust-002',
    name: 'Emma Eriksson',
    email: 'emma.eriksson@example.com',
    phone: '+46 70 234 5678',
    createdAt: '2024-02-20T09:15:00Z',
    totalOrders: 5,
    totalSpent: 2134.50,
    lastOrderDate: '2024-11-08T11:45:00Z',
    status: 'active' as const,
    newsletter: true,
  },
  {
    id: 'cust-003',
    name: 'Sofia Svensson',
    email: 'sofia.svensson@example.com',
    phone: '+46 70 345 6789',
    createdAt: '2024-03-12T16:45:00Z',
    totalOrders: 12,
    totalSpent: 5670.25,
    lastOrderDate: '2024-11-12T09:30:00Z',
    status: 'active' as const,
    newsletter: false,
  },
  {
    id: 'cust-004',
    name: 'Olivia Johansson',
    email: 'olivia.johansson@example.com',
    createdAt: '2024-04-05T13:20:00Z',
    totalOrders: 3,
    totalSpent: 892.00,
    lastOrderDate: '2024-10-15T16:10:00Z',
    status: 'active' as const,
    newsletter: true,
  },
  {
    id: 'cust-005',
    name: 'Lisa Larsson',
    email: 'lisa.larsson@example.com',
    phone: '+46 70 456 7890',
    createdAt: '2024-05-18T11:00:00Z',
    totalOrders: 1,
    totalSpent: 299.00,
    lastOrderDate: '2024-06-01T10:20:00Z',
    status: 'inactive' as const,
    newsletter: false,
  },
  {
    id: 'cust-006',
    name: 'Maja Nilsson',
    email: 'maja.nilsson@example.com',
    phone: '+46 70 567 8901',
    createdAt: '2024-06-22T14:30:00Z',
    totalOrders: 6,
    totalSpent: 2789.50,
    lastOrderDate: '2024-11-05T12:15:00Z',
    status: 'active' as const,
    newsletter: true,
  },
  {
    id: 'cust-007',
    name: 'Ebba Petersson',
    email: 'ebba.petersson@example.com',
    createdAt: '2024-07-10T08:45:00Z',
    totalOrders: 4,
    totalSpent: 1456.00,
    lastOrderDate: '2024-10-28T15:40:00Z',
    status: 'active' as const,
    newsletter: false,
  },
  {
    id: 'cust-008',
    name: 'Wilma Gustafsson',
    email: 'wilma.gustafsson@example.com',
    phone: '+46 70 678 9012',
    createdAt: '2024-08-03T10:15:00Z',
    totalOrders: 9,
    totalSpent: 4123.75,
    lastOrderDate: '2024-11-11T13:25:00Z',
    status: 'active' as const,
    newsletter: true,
  },
  {
    id: 'cust-009',
    name: 'Alva Berg',
    email: 'alva.berg@example.com',
    createdAt: '2024-09-14T15:00:00Z',
    totalOrders: 2,
    totalSpent: 598.00,
    lastOrderDate: '2024-09-30T11:50:00Z',
    status: 'inactive' as const,
    newsletter: true,
  },
  {
    id: 'cust-010',
    name: 'Elsa Lundgren',
    email: 'elsa.lundgren@example.com',
    phone: '+46 70 789 0123',
    createdAt: '2024-10-08T12:30:00Z',
    totalOrders: 7,
    totalSpent: 3245.50,
    lastOrderDate: '2024-11-13T10:05:00Z',
    status: 'active' as const,
    newsletter: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');

    // TODO: Fetch from database
    /*
    const query = supabase
      .from('customers')
      .select(`
        *,
        orders (
          id,
          total,
          createdAt
        )
      `)
      .order('createdAt', { ascending: false });

    if (status && status !== 'all') {
      query.eq('status', status);
    }

    if (search) {
      query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    query.limit(limit);

    const { data: customers, error } = await query;

    if (error) throw error;

    // Calculate totals from orders
    const customersWithStats = customers.map(customer => ({
      ...customer,
      totalOrders: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
      lastOrderDate: customer.orders.length > 0
        ? customer.orders.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0].createdAt
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: customersWithStats
    });
    */

    // For now, return mock data
    let filteredCustomers = [...mockCustomers];

    if (status && status !== 'all') {
      filteredCustomers = filteredCustomers.filter(c => c.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower)
      );
    }

    filteredCustomers = filteredCustomers.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: filteredCustomers
    });

  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// Create new customer (usually handled by registration)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { name, email, phone, newsletter } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // TODO: Create customer in database
    /*
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer with this email already exists' },
        { status: 400 }
      );
    }

    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        newsletter: newsletter || false,
        status: 'active',
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: newCustomer
    });
    */

    console.log('Would create customer:', { name, email, phone, newsletter });

    return NextResponse.json({
      success: true,
      message: 'Customer creation endpoint (requires database implementation)',
      data: {
        id: `cust-${Date.now()}`,
        name,
        email,
        phone: phone || null,
        newsletter: newsletter || false,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
