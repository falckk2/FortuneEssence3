import { NextRequest } from 'next/server';

jest.mock('@/config/di-init', () => ({}));
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/config/di-container', () => {
  const { moduleMocks } = require('../helpers/moduleMocks');
  return {
    TOKENS: { IOrderService: Symbol.for('IOrderService') },
    container: {
      resolve: jest.fn(() => moduleMocks.orderService),
      register: jest.fn(),
    },
  };
});

import { PATCH } from '@/app/api/orders/route';
import { getServerSession } from 'next-auth/next';
import { moduleMocks } from '../helpers/moduleMocks';

describe('Orders PATCH status validation (ISSUE-036)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', isAdmin: false },
    });
    moduleMocks.orderService.getOrder.mockResolvedValue({
      success: true,
      data: { customerId: 'user-1', id: 'order-1' },
    });
    moduleMocks.orderService.updateOrderStatus.mockResolvedValue({
      success: true,
      data: { id: 'order-1', status: 'cancelled' },
    });
  });

  it('rejects arbitrary status strings with 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ orderId: 'order-1', status: 'hacked' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid order status');
    expect(moduleMocks.orderService.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('accepts valid OrderStatus values', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ orderId: 'order-1', status: 'cancelled' }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(moduleMocks.orderService.updateOrderStatus).toHaveBeenCalledWith('order-1', 'cancelled');
  });
});