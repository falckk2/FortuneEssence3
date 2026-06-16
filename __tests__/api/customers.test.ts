/**
 * ISSUE-006: /api/customers must use real CustomerRepository, not mock data.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('@/lib/supabase-server', () => ({ getSupabaseServer: jest.fn(() => ({ from: jest.fn() })) }));
jest.mock('@/config/di-init', () => ({}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/config/di-container', () => {
  const mockCustomerRepository = {
    findAll: jest.fn(),
    create: jest.fn(),
  };
  return {
    TOKENS: { ICustomerRepository: Symbol.for('ICustomerRepository') },
    container: {
      resolve: jest.fn(() => mockCustomerRepository),
      register: jest.fn(),
    },
    mockCustomerRepository,
  };
});

import { GET, POST } from '@/app/api/customers/route';
import { getServerSession } from 'next-auth/next';
import { mockCustomerRepository } from '@/config/di-container';

describe('/api/customers (ISSUE-006)', () => {
  const adminSession = {
    user: { id: 'admin-1', email: 'admin@test.com', isAdmin: true },
  };

  const mockCustomer = {
    id: 'cust-real-1',
    email: 'anna@test.com',
    firstName: 'Anna',
    lastName: 'Andersson',
    phone: null,
    address: { street: 'St', city: 'Stockholm', postalCode: '11122', country: 'SE' },
    consentGiven: true,
    marketingOptIn: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(adminSession);
  });

  it('GET returns data from CustomerRepository.findAll, not hardcoded mocks', async () => {
    mockCustomerRepository.findAll.mockResolvedValue({
      success: true,
      data: [mockCustomer],
    });

    const request = new NextRequest('http://localhost:3000/api/customers?search=anna');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: 'cust-real-1',
      email: 'anna@test.com',
      firstName: 'Anna',
      lastName: 'Andersson',
    });
    expect(mockCustomerRepository.findAll).toHaveBeenCalledWith({ search: 'anna', limit: 100 });
    expect(JSON.stringify(body)).not.toMatch(/cust-00[0-9]/);
  });

  it('POST creates customer via repository with real persisted id', async () => {
    mockCustomerRepository.create.mockResolvedValue({
      success: true,
      data: mockCustomer,
    });

    const request = new NextRequest('http://localhost:3000/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Anna',
        lastName: 'Andersson',
        email: 'anna@test.com',
        marketingOptIn: false,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('cust-real-1');
    expect(mockCustomerRepository.create).toHaveBeenCalled();
    expect(body.data.id).not.toMatch(/^cust-\$\{Date/);
  });

  it('rejects non-admin users', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', isAdmin: false },
    });

    const request = new NextRequest('http://localhost:3000/api/customers');
    const response = await GET(request);

    expect(response.status).toBe(403);
    expect(mockCustomerRepository.findAll).not.toHaveBeenCalled();
  });
});