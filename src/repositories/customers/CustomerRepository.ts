import { ICustomerRepository } from '@/interfaces';
import { Customer, ApiResponse } from '@/types';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export class CustomerRepository implements ICustomerRepository {
  private readonly tableName = 'customers';

  async findById(id: string): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Customer not found',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find customer: ${error}`,
      };
    }
  }

  async findByEmail(email: string): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Customer not found',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find customer: ${error}`,
      };
    }
  }

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> {
    try {
      // Hash password if provided
      const customerData = {
        email: customer.email.toLowerCase(),
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone: customer.phone,
        street: customer.address.street,
        city: customer.address.city,
        postal_code: customer.address.postalCode,
        country: customer.address.country,
        region: customer.address.region,
        consent_given: customer.consentGiven,
        marketing_opt_in: customer.marketingOptIn,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(customerData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Customer with this email already exists',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create customer: ${error}`,
      };
    }
  }

  async update(id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>> {
    try {
      const updateData: any = {};

      if (customer.email) updateData.email = customer.email.toLowerCase();
      if (customer.firstName) updateData.first_name = customer.firstName;
      if (customer.lastName) updateData.last_name = customer.lastName;
      if (customer.phone !== undefined) updateData.phone = customer.phone;
      if (customer.address) {
        if (customer.address.street) updateData.street = customer.address.street;
        if (customer.address.city) updateData.city = customer.address.city;
        if (customer.address.postalCode) updateData.postal_code = customer.address.postalCode;
        if (customer.address.country) updateData.country = customer.address.country;
        if (customer.address.region !== undefined) updateData.region = customer.address.region;
      }
      if (customer.consentGiven !== undefined) updateData.consent_given = customer.consentGiven;
      if (customer.marketingOptIn !== undefined) updateData.marketing_opt_in = customer.marketingOptIn;

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Customer not found',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update customer: ${error}`,
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete customer: ${error}`,
      };
    }
  }

  private transformDbRecord(record: any): Customer {
    return {
      id: record.id,
      email: record.email,
      firstName: record.first_name,
      lastName: record.last_name,
      phone: record.phone,
      address: {
        street: record.street,
        city: record.city,
        postalCode: record.postal_code,
        country: record.country,
        region: record.region,
      },
      consentGiven: record.consent_given,
      marketingOptIn: record.marketing_opt_in,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  // Additional methods for authentication
  async createWithPassword(
    customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>,
    password: string
  ): Promise<ApiResponse<Customer>> {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);

      const customerData = {
        email: customer.email.toLowerCase(),
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone: customer.phone,
        street: customer.address.street,
        city: customer.address.city,
        postal_code: customer.address.postalCode,
        country: customer.address.country,
        region: customer.address.region,
        consent_given: customer.consentGiven,
        marketing_opt_in: customer.marketingOptIn,
        password_hash: hashedPassword,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(customerData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Customer with this email already exists',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create customer: ${error}`,
      };
    }
  }

  async verifyPassword(email: string, password: string): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      const isValidPassword = await bcrypt.compare(password, data.password_hash);

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Authentication failed: ${error}`,
      };
    }
  }
}