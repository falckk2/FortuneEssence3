/**
 * ISSUE-007: is_admin lookup failures must be logged, not silently swallowed.
 */

import type { Customer } from '@/types';

const mockVerifyPassword = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/repositories/customers/CustomerRepository', () => ({
  CustomerRepository: jest.fn().mockImplementation(() => ({
    verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
  })),
}));

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: mockFrom,
  })),
}));

jest.mock('@/config', () => ({
  config: {
    database: { supabaseUrl: 'http://test', supabaseSecretKey: 'secret' },
    auth: { nextAuthSecret: 'auth-secret' },
  },
}));

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: (config: { authorize: (c: unknown) => Promise<unknown> }) => config,
}));

jest.mock('@next-auth/supabase-adapter', () => ({
  SupabaseAdapter: jest.fn(() => ({})),
}));

import { authOptions } from '@/lib/auth';

describe('auth is_admin lookup (ISSUE-007)', () => {
  const mockUser: Customer = {
    id: 'user-1',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: null,
    address: { street: 'St', city: 'City', postalCode: '11122', country: 'SE' },
    consentGiven: true,
    marketingOptIn: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const credentialsProvider = authOptions.providers[0] as {
    authorize: (credentials: { email: string; password: string }) => Promise<unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyPassword.mockResolvedValue({ success: true, data: mockUser });

    mockSingle.mockResolvedValue({ data: { is_admin: true }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('logs Supabase error and defaults to non-admin', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    });

    const result = await credentialsProvider.authorize({
      email: 'admin@test.com',
      password: 'secret',
    });

    expect(result).toMatchObject({ isAdmin: false });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[auth] is_admin lookup returned Supabase error',
      expect.objectContaining({ userId: 'user-1', code: 'PGRST116' })
    );

    consoleErrorSpy.mockRestore();
  });

  it('logs warning when admin row is null', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockSingle.mockResolvedValue({ data: null, error: null });

    const result = await credentialsProvider.authorize({
      email: 'admin@test.com',
      password: 'secret',
    });

    expect(result).toMatchObject({ isAdmin: false });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[auth] is_admin lookup returned no row — defaulting to non-admin',
      { userId: 'user-1' }
    );

    consoleWarnSpy.mockRestore();
  });

  it('logs exception in catch block and defaults to non-admin', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const thrown = new Error('network down');
    mockFrom.mockImplementation(() => {
      throw thrown;
    });

    const result = await credentialsProvider.authorize({
      email: 'admin@test.com',
      password: 'secret',
    });

    expect(result).toMatchObject({ isAdmin: false });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[auth] is_admin lookup threw an exception — defaulting to non-admin',
      expect.objectContaining({ userId: 'user-1', error: thrown })
    );

    consoleErrorSpy.mockRestore();
  });

  it('returns isAdmin true when lookup succeeds', async () => {
    const result = await credentialsProvider.authorize({
      email: 'admin@test.com',
      password: 'secret',
    });

    expect(result).toMatchObject({ isAdmin: true, id: 'user-1' });
  });
});