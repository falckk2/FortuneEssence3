import { CustomerRepository } from '@/repositories/customers/CustomerRepository';
import { createMockSupabaseClient, mockSupabaseSuccess, mockSupabaseError, mockSupabaseNotFound } from '../helpers/mockSupabase';
import type { Customer, Address } from '@/types';
import bcrypt from 'bcryptjs';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: null,
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

describe('CustomerRepository', () => {
  let repository: CustomerRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockAddress: Address = {
    street: '123 Main St',
    city: 'Stockholm',
    postalCode: '11122',
    country: 'Sweden',
  };

  const mockDbCustomer = {
    id: 'customer-1',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+46701234567',
    street: '123 Main St',
    city: 'Stockholm',
    postal_code: '11122',
    country: 'Sweden',
    region: null,
    consent_given: true,
    marketing_opt_in: false,
    password_hash: 'hashed_password',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    const supabaseModule = require('@/lib/supabase');
    supabaseModule.supabase = mockSupabase;
    repository = new CustomerRepository();
  });

  describe('findById', () => {
    it('should return customer by id', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCustomer)
      );

      const result = await repository.findById('customer-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('customer-1');
      expect(result.data?.email).toBe('test@example.com');
      expect(result.data?.firstName).toBe('John');
      expect(result.data?.lastName).toBe('Doe');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'customer-1');
    });

    it('should return error when customer not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.findById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer not found');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Connection failed')
      );

      const result = await repository.findById('customer-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });

  describe('findByEmail', () => {
    it('should return customer by email', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCustomer)
      );

      const result = await repository.findByEmail('test@example.com');

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('email', 'test@example.com');
    });

    it('should lowercase email before searching', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCustomer)
      );

      const result = await repository.findByEmail('TEST@EXAMPLE.COM');

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('email', 'test@example.com');
    });

    it('should return error when customer not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.findByEmail('notfound@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer not found');
    });
  });

  describe('create', () => {
    it('should create a new customer successfully', async () => {
      const newCustomer = {
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+46701234567',
        address: mockAddress,
        consentGiven: true,
        marketingOptIn: true,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({
          ...mockDbCustomer,
          email: 'new@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
        })
      );

      const result = await repository.create(newCustomer);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('new@example.com');
      expect(result.data?.firstName).toBe('Jane');
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalled();
    });

    it('should lowercase email before creating', async () => {
      const newCustomer = {
        email: 'NEW@EXAMPLE.COM',
        firstName: 'Jane',
        lastName: 'Smith',
        address: mockAddress,
        consentGiven: true,
        marketingOptIn: false,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCustomer)
      );

      await repository.create(newCustomer);

      const insertCall = (mockSupabase.mockQuery.insert as jest.Mock).mock.calls[0][0];
      expect(insertCall.email).toBe('new@example.com');
    });

    it('should return error when email already exists', async () => {
      const newCustomer = {
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        address: mockAddress,
        consentGiven: true,
        marketingOptIn: false,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Duplicate key', '23505')
      );

      const result = await repository.create(newCustomer);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer with this email already exists');
    });
  });

  describe('update', () => {
    it('should update customer successfully', async () => {
      const updates = {
        firstName: 'Johnny',
        phone: '+46709999999',
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({
          ...mockDbCustomer,
          first_name: 'Johnny',
          phone: '+46709999999',
        })
      );

      const result = await repository.update('customer-1', updates);

      expect(result.success).toBe(true);
      expect(result.data?.firstName).toBe('Johnny');
      expect(result.data?.phone).toBe('+46709999999');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'customer-1');
    });

    it('should update address fields', async () => {
      const updates = {
        address: {
          street: '456 New St',
          city: 'Gothenburg',
          postalCode: '40000',
          country: 'Sweden',
        },
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({
          ...mockDbCustomer,
          street: '456 New St',
          city: 'Gothenburg',
          postal_code: '40000',
        })
      );

      const result = await repository.update('customer-1', updates);

      expect(result.success).toBe(true);
      expect(result.data?.address.street).toBe('456 New St');
      expect(result.data?.address.city).toBe('Gothenburg');
    });

    it('should return error when customer not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.update('nonexistent', { firstName: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer not found');
    });
  });

  describe('delete', () => {
    it('should delete customer successfully', async () => {
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.delete('customer-1');

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.delete).toHaveBeenCalled();
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'customer-1');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseError('Delete failed')
      );

      const result = await repository.delete('customer-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Delete failed');
    });
  });

  describe('createWithPassword', () => {
    it('should create customer with hashed password', async () => {
      const newCustomer = {
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        address: mockAddress,
        consentGiven: true,
        marketingOptIn: false,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCustomer)
      );

      const result = await repository.createWithPassword(newCustomer, 'password123');

      expect(result.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalled();
    });

    it('should return error when email already exists', async () => {
      const newCustomer = {
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        address: mockAddress,
        consentGiven: true,
        marketingOptIn: false,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Duplicate key', '23505')
      );

      const result = await repository.createWithPassword(newCustomer, 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Customer with this email already exists');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCustomer)
      );

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await repository.verifyPassword('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should return error for incorrect password', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCustomer)
      );

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await repository.verifyPassword('test@example.com', 'wrong_password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should return error when customer not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.verifyPassword('notfound@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should lowercase email before verification', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCustomer)
      );

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await repository.verifyPassword('TEST@EXAMPLE.COM', 'password123');

      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('email', 'test@example.com');
    });
  });

  describe('data transformation', () => {
    it('should correctly transform database record to domain model', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbCustomer)
      );

      const result = await repository.findById('customer-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('customer-1');
      expect(result.data?.email).toBe('test@example.com');
      expect(result.data?.firstName).toBe('John');
      expect(result.data?.lastName).toBe('Doe');
      expect(result.data?.phone).toBe('+46701234567');
      expect(result.data?.address).toEqual(mockAddress);
      expect(result.data?.consentGiven).toBe(true);
      expect(result.data?.marketingOptIn).toBe(false);
      expect(result.data?.createdAt).toBeInstanceOf(Date);
      expect(result.data?.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle optional fields', async () => {
      const customerWithOptionals = {
        ...mockDbCustomer,
        phone: null,
        region: 'Stockholm County',
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(customerWithOptionals)
      );

      const result = await repository.findById('customer-1');

      expect(result.success).toBe(true);
      expect(result.data?.phone).toBeNull();
      expect(result.data?.address.region).toBe('Stockholm County');
    });
  });
});
