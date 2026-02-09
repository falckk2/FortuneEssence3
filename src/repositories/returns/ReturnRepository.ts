import { IReturnRepository } from '@/interfaces/repositories';
import { Return, ReturnItem, ReturnStatus, ReturnFilters, CreateReturnItemData, ApiResponse } from '@/types';
import { supabase } from '@/lib/supabase';

export class ReturnRepository implements IReturnRepository {
  private readonly tableName = 'returns';
  private readonly itemsTableName = 'return_items';

  async create(
    returnData: Omit<Return, 'id' | 'items' | 'createdAt' | 'updatedAt'>,
    items: CreateReturnItemData[]
  ): Promise<ApiResponse<Return>> {
    try {
      const dbData = {
        order_id: returnData.orderId,
        customer_id: returnData.customerId,
        status: returnData.status || 'pending',
        reason: returnData.reason,
        refund_amount: returnData.refundAmount,
        refund_method: returnData.refundMethod,
        admin_notes: returnData.adminNotes,
        tracking_number: returnData.trackingNumber,
      };

      const { data: returnRecord, error: returnError } = await supabase
        .from(this.tableName)
        .insert(dbData)
        .select()
        .single();

      if (returnError) {
        return { success: false, error: returnError.message };
      }

      // Insert return items
      // Note: order_item_id uses productId as a reference key since orders store
      // items as JSON (no order_items table). If duplicate products exist in an
      // order (e.g. different bundle selections), the first match is used for
      // price enrichment, which is acceptable for refund calculation purposes.
      const returnItems = items.map(item => ({
        return_id: returnRecord.id,
        order_item_id: item.productId,
        product_id: item.productId,
        quantity: item.quantity,
        reason: item.reason,
        condition: item.condition,
      }));

      const { error: itemsError } = await supabase
        .from(this.itemsTableName)
        .insert(returnItems);

      if (itemsError) {
        // Best-effort cleanup: ideally this would be wrapped in a DB transaction
        // via an RPC function to guarantee atomicity. If this delete fails, an
        // orphaned return record remains and should be cleaned up manually.
        await supabase.from(this.tableName).delete().eq('id', returnRecord.id);
        return { success: false, error: itemsError.message };
      }

      return this.findById(returnRecord.id);
    } catch (error) {
      return { success: false, error: `Failed to create return: ${error}` };
    }
  }

  async findById(id: string): Promise<ApiResponse<Return>> {
    try {
      const { data: returnRecord, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Return not found' };
        }
        return { success: false, error: error.message };
      }

      // Fetch return items
      const { data: items, error: itemsError } = await supabase
        .from(this.itemsTableName)
        .select('*')
        .eq('return_id', id);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      // Fetch order info for enrichment
      const { data: orderData } = await supabase
        .from('orders')
        .select('total, payment_id, payment_method, items')
        .eq('id', returnRecord.order_id)
        .single();

      // Fetch customer info
      const { data: customerData } = await supabase
        .from('customers')
        .select('first_name, last_name, email')
        .eq('id', returnRecord.customer_id)
        .single();

      const result = this.enrichReturn(returnRecord, items || [], orderData, customerData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: `Failed to find return: ${error}` };
    }
  }

  async findByOrderId(orderId: string): Promise<ApiResponse<Return[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('order_id', orderId)
        .not('status', 'in', '("rejected","cancelled")')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: (data || []).map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return { success: false, error: `Failed to find returns by order: ${error}` };
    }
  }

  async findAll(filters?: ReturnFilters): Promise<ApiResponse<Return[]>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (!filters?.search) {
        // Standard pagination
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
      } else {
        // Search needs post-enrichment filtering (customer name lives in a
        // separate table), so we skip page-based pagination but cap the result
        // set to prevent loading the entire table on large datasets.
        const SEARCH_MAX_RESULTS = 200;
        query = query.range(0, SEARCH_MAX_RESULTS - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: true, data: [] };
      }

      // Batch-fetch related data to avoid N+1 queries
      const returnIds = data.map(r => r.id);
      const customerIds = [...new Set(data.map(r => r.customer_id))];
      const orderIds = [...new Set(data.map(r => r.order_id))];

      const [itemsResult, customersResult, ordersResult] = await Promise.all([
        supabase.from(this.itemsTableName).select('*').in('return_id', returnIds),
        supabase.from('customers').select('id, first_name, last_name, email').in('id', customerIds),
        supabase.from('orders').select('id, items, total, payment_id, payment_method').in('id', orderIds),
      ]);

      const itemsByReturnId = new Map<string, any[]>();
      for (const item of (itemsResult.data || [])) {
        const list = itemsByReturnId.get(item.return_id) || [];
        list.push(item);
        itemsByReturnId.set(item.return_id, list);
      }

      const customersById = new Map<string, any>();
      for (const c of (customersResult.data || [])) {
        customersById.set(c.id, c);
      }

      const ordersById = new Map<string, any>();
      for (const o of (ordersResult.data || [])) {
        ordersById.set(o.id, o);
      }

      // Enrich returns in memory
      let returns: Return[] = data.map(record => {
        const items = itemsByReturnId.get(record.id) || [];
        const customer = customersById.get(record.customer_id);
        const orderData = ordersById.get(record.order_id);
        return this.enrichReturn(record, items, orderData, customer);
      });

      // Apply search filter after enrichment (needed for customer name)
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        returns = returns.filter(r =>
          r.customerName?.toLowerCase().includes(search) ||
          r.orderId.toLowerCase().includes(search) ||
          r.id.toLowerCase().includes(search)
        );
      }

      return { success: true, data: returns };
    } catch (error) {
      return { success: false, error: `Failed to fetch returns: ${error}` };
    }
  }

  async updateStatus(
    id: string,
    status: ReturnStatus,
    additionalData?: Partial<Return>
  ): Promise<ApiResponse<Return>> {
    try {
      const updateData: any = { status };

      // Set appropriate timestamp based on status
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'received') {
        updateData.received_at = new Date().toISOString();
      } else if (status === 'refunded') {
        updateData.refunded_at = new Date().toISOString();
      }

      if (additionalData?.adminNotes !== undefined) {
        updateData.admin_notes = additionalData.adminNotes;
      }
      if (additionalData?.trackingNumber !== undefined) {
        updateData.tracking_number = additionalData.trackingNumber;
      }
      if (additionalData?.refundAmount !== undefined) {
        updateData.refund_amount = additionalData.refundAmount;
      }
      if (additionalData?.reason !== undefined) {
        updateData.reason = additionalData.reason;
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Return not found' };
      }

      return this.findById(id);
    } catch (error) {
      return { success: false, error: `Failed to update return status: ${error}` };
    }
  }

  async update(id: string, data: Partial<Return>): Promise<ApiResponse<Return>> {
    try {
      const updateData: any = {};
      if (data.adminNotes !== undefined) updateData.admin_notes = data.adminNotes;
      if (data.trackingNumber !== undefined) updateData.tracking_number = data.trackingNumber;
      if (data.refundAmount !== undefined) updateData.refund_amount = data.refundAmount;
      if (data.refundMethod !== undefined) updateData.refund_method = data.refundMethod;

      if (Object.keys(updateData).length === 0) {
        return this.findById(id);
      }

      const { error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return this.findById(id);
    } catch (error) {
      return { success: false, error: `Failed to update return: ${error}` };
    }
  }

  async getStatusCounts(): Promise<ApiResponse<Record<string, number>>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('status');

      if (error) {
        return { success: false, error: error.message };
      }

      const counts: Record<string, number> = {};
      for (const row of (data || [])) {
        counts[row.status] = (counts[row.status] || 0) + 1;
      }
      return { success: true, data: counts };
    } catch (error) {
      return { success: false, error: `Failed to fetch status counts: ${error}` };
    }
  }

  private enrichReturn(record: any, items: any[], orderData: any, customerData: any): Return {
    const orderItems = orderData?.items || [];
    const enrichedItems = items.map((item: any) => {
      const orderItem = orderItems.find((oi: any) =>
        oi.productId === item.product_id
      );
      return this.transformItemRecord(item, orderItem);
    });

    const result = this.transformDbRecord(record);
    result.items = enrichedItems;
    if (customerData) {
      result.customerName = `${customerData.first_name} ${customerData.last_name}`;
      result.customerEmail = customerData.email;
    }
    if (orderData) {
      result.orderTotal = orderData.total;
      result.orderPaymentId = orderData.payment_id;
      result.orderPaymentMethod = orderData.payment_method;
    }
    return result;
  }

  private transformDbRecord(record: any): Return {
    return {
      id: record.id,
      orderId: record.order_id,
      customerId: record.customer_id,
      status: record.status as ReturnStatus,
      reason: record.reason,
      refundAmount: parseFloat(record.refund_amount),
      refundMethod: record.refund_method,
      adminNotes: record.admin_notes,
      trackingNumber: record.tracking_number,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      approvedAt: record.approved_at ? new Date(record.approved_at) : undefined,
      receivedAt: record.received_at ? new Date(record.received_at) : undefined,
      refundedAt: record.refunded_at ? new Date(record.refunded_at) : undefined,
      items: [],
    };
  }

  private transformItemRecord(record: any, orderItem?: any): ReturnItem {
    return {
      id: record.id,
      returnId: record.return_id,
      orderItemId: record.order_item_id,
      productId: record.product_id,
      quantity: record.quantity,
      reason: record.reason,
      condition: record.condition,
      createdAt: new Date(record.created_at),
      productName: orderItem?.productName,
      price: orderItem?.price,
    };
  }
}
