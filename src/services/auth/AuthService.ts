import 'reflect-metadata';
import { injectable, inject } from 'tsyringe';
import type { IAuthService, SignUpData, IEmailService } from '@/interfaces';
import { Customer, ApiResponse } from '@/types';
import { CustomerRepository } from '@/repositories/customers/CustomerRepository';
import { signUpSchema } from '@/utils/validation';
import { signIn, signOut, getSession } from 'next-auth/react';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { TOKENS } from '@/config/di-container';

@injectable()
export class AuthService implements IAuthService {
  private customerRepository: CustomerRepository;
  private emailService: IEmailService;

  constructor(@inject(TOKENS.IEmailService) emailService: IEmailService) {
    this.customerRepository = new CustomerRepository();
    this.emailService = emailService;
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
          error: validation.error.issues.map((issue) => issue.message).join(', '),
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
        consentGiven: true, // Always true after validation (z.literal(true))
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
      console.log(`Password reset requested for: ${email}`);

      // Check if customer exists
      const customerResult = await this.customerRepository.findByEmail(email);

      // Generate token and send email only if customer exists
      // But always return success to prevent email enumeration attacks
      if (customerResult.success && customerResult.data) {
        const customer = customerResult.data;

        // Generate secure random token (32 bytes = 64 hex characters)
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');

        // Set expiration to 1 hour from now
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour = 3600000ms

        console.log(`Generated reset token for customer ${customer.id}, expires at ${expiresAt.toISOString()}`);

        // Store token in password_reset_tokens table
        const { error: insertError } = await supabase
          .from('password_reset_tokens')
          .insert({
            customer_id: customer.id,
            token: token,
            email: email.toLowerCase(),
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`Failed to store reset token: ${insertError.message}`);
          // Don't reveal the error to the user
          return {
            success: true,
          };
        }

        // Send password reset email
        const emailResult = await this.emailService.sendPasswordReset(email, token);

        if (!emailResult.success) {
          console.error(`Failed to send reset email: ${emailResult.error}`);
          // Don't reveal the error to the user
        } else {
          console.log(`Password reset email sent to ${email}`);
        }
      }

      // Always return success to prevent email enumeration
      return {
        success: true,
      };
    } catch (error) {
      console.error(`Password reset error: ${error}`);
      // Return success even on error to prevent information leakage
      return {
        success: true,
      };
    }
  }

  async verifyResetToken(token: string): Promise<ApiResponse<{ email: string }>> {
    try {
      console.log(`Verifying reset token: ${token.substring(0, 10)}...`);

      // Query password_reset_tokens table for the token
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        console.log(`Token not found in database`);
        return {
          success: false,
          error: 'Invalid or expired reset token',
        };
      }

      // Check if token has been used
      if (data.used_at) {
        console.log(`Token already used at ${data.used_at}`);
        return {
          success: false,
          error: 'Reset token has already been used',
        };
      }

      // Check if token is expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();

      if (now > expiresAt) {
        console.log(`Token expired at ${expiresAt.toISOString()}`);
        return {
          success: false,
          error: 'Reset token has expired',
        };
      }

      console.log(`Token verified successfully for email: ${data.email}`);

      return {
        success: true,
        data: { email: data.email },
      };
    } catch (error) {
      console.error(`Token verification error: ${error}`);
      return {
        success: false,
        error: `Failed to verify reset token: ${error}`,
      };
    }
  }

  async completePasswordReset(token: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      console.log(`Completing password reset with token: ${token.substring(0, 10)}...`);

      // Verify token is valid
      const tokenVerification = await this.verifyResetToken(token);

      if (!tokenVerification.success || !tokenVerification.data) {
        console.log(`Token verification failed: ${tokenVerification.error}`);
        return {
          success: false,
          error: tokenVerification.error || 'Invalid reset token',
        };
      }

      const email = tokenVerification.data.email;

      // Get customer by email
      const customerResult = await this.customerRepository.findByEmail(email);

      if (!customerResult.success || !customerResult.data) {
        console.error(`Customer not found for email: ${email}`);
        return {
          success: false,
          error: 'Customer not found',
        };
      }

      const customer = customerResult.data;

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      console.log(`Updating password for customer: ${customer.id}`);

      // Update customer password in database
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id);

      if (updateError) {
        console.error(`Failed to update password: ${updateError.message}`);
        return {
          success: false,
          error: 'Failed to update password',
        };
      }

      // Mark token as used
      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      if (tokenError) {
        console.error(`Failed to mark token as used: ${tokenError.message}`);
        // Don't fail the operation if we can't mark the token as used
      }

      console.log(`Password reset completed successfully for customer: ${customer.id}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error(`Password reset completion error: ${error}`);
      return {
        success: false,
        error: `Failed to reset password: ${error}`,
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