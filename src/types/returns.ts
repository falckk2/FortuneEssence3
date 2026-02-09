export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'received' | 'refunded' | 'cancelled';

export type ReturnCondition = 'unopened' | 'opened' | 'damaged' | 'defective';

export interface ReturnItem {
  id: string;
  returnId: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  reason?: string;
  condition?: ReturnCondition;
  createdAt: Date;
  // Enriched fields from order items JSON
  productName?: string;
  price?: number;
}

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  status: ReturnStatus;
  reason: string;
  refundAmount: number;
  refundMethod?: string;
  adminNotes?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  receivedAt?: Date;
  refundedAt?: Date;
  items: ReturnItem[];
  // Enriched fields from joins
  customerName?: string;
  customerEmail?: string;
  orderTotal?: number;
  orderPaymentId?: string;
  orderPaymentMethod?: string;
}

export interface CreateReturnItemData {
  productId: string;
  quantity: number;
  reason?: string;
  condition?: ReturnCondition;
}

export interface CreateReturnData {
  orderId: string;
  reason: string;
  items: CreateReturnItemData[];
}

export interface ReturnFilters {
  status?: ReturnStatus;
  page?: number;
  limit?: number;
  search?: string;
}
