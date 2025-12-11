/**
 * Mock Supabase client for testing
 */

export interface MockSupabaseQuery {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
}

export function createMockSupabaseClient() {
  const mockQuery: Partial<MockSupabaseQuery> = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  const mockFrom = jest.fn(() => mockQuery);

  return {
    from: mockFrom,
    mockQuery,
  };
}

export function mockSupabaseSuccess(data: any) {
  return {
    data,
    error: null,
  };
}

export function mockSupabaseError(message: string, code?: string) {
  return {
    data: null,
    error: {
      message,
      code: code || 'PGRST000',
    },
  };
}

export function mockSupabaseNotFound() {
  return {
    data: null,
    error: {
      message: 'No rows found',
      code: 'PGRST116',
    },
  };
}
