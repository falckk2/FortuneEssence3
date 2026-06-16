import { CustomerRepository } from '@/repositories/customers/CustomerRepository';
import { createMockSupabaseClient, mockSupabaseSuccess } from '../helpers/mockSupabase';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(),
}));

describe('CustomerRepository.findAll LIKE escaping (ISSUE-030)', () => {
  let repository: CustomerRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    const { getSupabaseServer } = require('@/lib/supabase-server');
    (getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase);
    repository = new CustomerRepository();

    mockSupabase.mockQuery.order = jest.fn().mockReturnValue(mockSupabase.mockQuery);
    (mockSupabase.mockQuery as { then?: jest.Mock }).then = jest.fn((resolve) =>
      resolve(mockSupabaseSuccess([]))
    );
  });

  it('escapes LIKE wildcards in search before building the or() filter', async () => {
    await repository.findAll({ search: '100%_off' });

    expect(mockSupabase.mockQuery.or).toHaveBeenCalledWith(
      'email.ilike.%100\\%\\_off%,first_name.ilike.%100\\%\\_off%,last_name.ilike.%100\\%\\_off%,phone.ilike.%100\\%\\_off%'
    );
  });
});