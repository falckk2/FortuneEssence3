import { IAuthService, SignUpData } from '@/interfaces/services';
import { Customer, ApiResponse } from '@/types';
import { CustomerRepository } from '@/repositories/customers/CustomerRepository';
import { signUpSchema } from '@/utils/validation';
import { signIn, signOut, getSession } from 'next-auth/react';

export class AuthService implements IAuthService {
  private customerRepository: CustomerRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  async signIn(email: string, password: string): Promise<ApiResponse<{ user: Customer; token: string }>> {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      // Get the customer data
      const customerResult = await this.customerRepository.findByEmail(email);
      if (!customerResult.success || !customerResult.data) {
        return {
          success: false,
          error: 'Failed to retrieve user data',
        };
      }

      return {
        success: true,
        data: {
          user: customerResult.data,
          token: 'jwt_token', // This would be the actual JWT token
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Sign in failed: ${error}`,
      };
    }
  }

  async signUp(userData: SignUpData): Promise<ApiResponse<Customer>> {
    try {
      // Validate input data
      const validation = signUpSchema.safeParse(userData);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.errors.map(err => err.message).join(', '),
        };
      }

      const validatedData = validation.data;

      // Check if customer already exists
      const existingCustomer = await this.customerRepository.findByEmail(validatedData.email);
      if (existingCustomer.success) {
        return {
          success: false,
          error: 'Customer with this email already exists',
        };
      }

      // Create customer record
      const customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        address: {
          street: '', // Will be updated in profile
          city: '',
          postalCode: '',
          country: 'Sweden',
        },
        consentGiven: validatedData.consentGiven,
        marketingOptIn: validatedData.marketingOptIn,
      };

      const result = await this.customerRepository.createWithPassword(
        customerData,
        validatedData.password
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to create customer account',
        };
      }

      return {
        success: true,
        data: result.data!,
      };
    } catch (error) {
      return {
        success: false,
        error: `Sign up failed: ${error}`,
      };
    }
  }

  async signOut(): Promise<ApiResponse<void>> {
    try {
      await signOut({ redirect: false });
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Sign out failed: ${error}`,
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<Customer>> {
    try {
      const session = await getSession();
      
      if (!session?.user?.email) {
        return {
          success: false,
          error: 'No active session',
        };
      }

      const result = await this.customerRepository.findByEmail(session.user.email);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to retrieve user data',
        };
      }

      return {
        success: true,
        data: result.data!,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get current user: ${error}`,
      };
    }
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      // Check if customer exists
      const customerResult = await this.customerRepository.findByEmail(email);
      if (!customerResult.success) {
        // Don't reveal whether the email exists or not for security
        return {
          success: true,
        };
      }

      // In a real implementation, this would:
      // 1. Generate a password reset token
      // 2. Send an email with the reset link
      // 3. Store the token with expiration time

      // For now, we'll just return success
      console.log(`Password reset requested for: ${email}`);
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Password reset failed: ${error}`,
      };
    }
  }

  // Additional utility methods
  async updateProfile(userId: string, profileData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    try {
      const result = await this.customerRepository.update(userId, profileData);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to update profile: ${error}`,
      };
    }
  }

  async deleteAccount(userId: string): Promise<ApiResponse<void>> {
    try {
      const result = await this.customerRepository.delete(userId);
      
      if (result.success) {
        // Sign out the user after account deletion
        await this.signOut();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete account: ${error}`,
      };
    }
  }
}