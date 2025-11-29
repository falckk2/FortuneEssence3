import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // TODO: Add authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Fetch customer from database with all related data
    /*
    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders (
          id,
          total,
          status,
          createdAt,
          items:order_items (
            id,
            quantity,
            price,
            product:products (
              id,
              translations
            )
          )
        ),
        addresses (
          id,
          type,
          street,
          city,
          postalCode,
          country,
          isDefault
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Calculate customer statistics
    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = totalOrders > 0
      ? customer.orders.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0].createdAt
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        statistics: {
          totalOrders,
          totalSpent,
          avgOrderValue,
          lastOrderDate,
        }
      }
    });
    */

    console.log(`Would fetch customer details for ID: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Customer details endpoint (requires database implementation)',
      data: {
        id,
        name: 'Mock Customer',
        email: 'customer@example.com',
        phone: '+46 70 123 4567',
        createdAt: new Date().toISOString(),
        status: 'active',
        newsletter: true,
      }
    });

  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();

    // TODO: Add authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Update customer in database
    /*
    const updateData: any = {};

    if (body.name !== undefined) {
      if (body.name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: 'Name must be at least 2 characters' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
      updateData.email = body.email.trim().toLowerCase();
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone?.trim() || null;
    }

    if (body.status !== undefined) {
      if (!['active', 'inactive'].includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.newsletter !== undefined) {
      updateData.newsletter = body.newsletter;
    }

    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: updatedCustomer
    });
    */

    console.log(`Would update customer ${id} with:`, body);

    return NextResponse.json({
      success: true,
      message: 'Customer updated (requires database implementation)',
      data: { id, ...body }
    });

  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // TODO: Add authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Delete customer from database (GDPR compliant)
    /*
    // In production, consider soft delete or anonymization for compliance
    // Hard delete should remove all associated data:
    // - Customer record
    // - Addresses
    // - Order associations (or anonymize orders)
    // - Wishlist items
    // - Newsletter subscriptions
    // - GDPR consents

    const { error: addressError } = await supabase
      .from('addresses')
      .delete()
      .eq('customerId', id);

    if (addressError) throw addressError;

    const { error: wishlistError } = await supabase
      .from('wishlist')
      .delete()
      .eq('customerId', id);

    if (wishlistError) throw wishlistError;

    // Anonymize orders instead of deleting for business records
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        customerId: null,
        customerName: 'Deleted Customer',
        customerEmail: 'deleted@example.com',
      })
      .eq('customerId', id);

    if (orderError) throw orderError;

    // Finally delete customer
    const { error: customerError } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (customerError) {
      if (customerError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }
      throw customerError;
    }

    // Log deletion for audit trail
    await supabase
      .from('audit_log')
      .insert({
        action: 'customer_deleted',
        resourceType: 'customer',
        resourceId: id,
        performedBy: session.user.id,
        timestamp: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });
    */

    console.log(`Would delete customer: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Customer deletion endpoint (requires database implementation)'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
