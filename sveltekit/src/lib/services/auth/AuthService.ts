import 'reflect-metadata';
import crypto from 'crypto';
import { injectable, inject } from 'tsyringe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IAuthService, SignUpData, IEmailService } from '$lib/interfaces';
import type { ICustomerRepository } from '$lib/interfaces/repositories';
import { Customer, ApiResponse } from '$lib/types';
import { signUpSchema } from '$lib/utils/validation';
import bcrypt from 'bcryptjs';
import { TOKENS } from '$lib/config/di-container';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TOKENS.ICustomerRepository) private readonly customerRepository: ICustomerRepository,
    @inject(TOKENS.IEmailService) private readonly emailService: IEmailService,
    @inject(TOKENS.SupabaseClient) private readonly supabase: SupabaseClient
  ) {}

  async signIn(email: string, password: string): Promise<ApiResponse<{ user: Customer; token: string }>> {
    // Sign-in is handled by Auth.js credentials provider, not invoked through this service.
    const customerResult = await this.customerRepository.findByEmail(email);
    if (!customerResult.success || !customerResult.data) {
      return { success: false, error: 'Invalid credentials' };
    }
    return { success: true, data: { user: customerResult.data, token: '' } };
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

      // Check if customer already exists. Check .data explicitly — a DB error
      // also returns success: false, and we must not treat that as "not found".
      const existingCustomer = await this.customerRepository.findByEmail(validatedData.email);
      if (existingCustomer.data) {
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
    // Sign-out is handled by Auth.js; call signOut() from @auth/sveltekit/client on the client side.
    return { success: true };
  }

  async getCurrentUser(): Promise<ApiResponse<Customer>> {
    // Current user is read from the Auth.js session via event.locals.auth() in server routes.
    return { success: false, error: 'Use Auth.js session instead' };
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      // Check if customer exists
      const customerResult = await this.customerRepository.findByEmail(email);

      // Generate token and send email only if customer exists
      // But always return success to prevent email enumeration attacks
      if (customerResult.success && customerResult.data) {
        const customer = customerResult.data;

        // Generate secure random token (32 bytes = 64 hex characters)
        const token = crypto.randomBytes(32).toString('hex');

        // Set expiration to 1 hour from now
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour = 3600000ms

        // Store token in password_reset_tokens table
        const { error: insertError } = await this.supabase
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
          console.error('Failed to send password reset email:', emailResult.error);
          // Don't reveal the error to the user
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
      // Query password_reset_tokens table for the token
      const { data, error } = await this.supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Invalid or expired reset token',
        };
      }

      // Check if token has been used
      if (data.used_at) {
        return {
          success: false,
          error: 'Reset token has already been used',
        };
      }

      // Check if token is expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();

      if (now > expiresAt) {
        return {
          success: false,
          error: 'Reset token has expired',
        };
      }

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
      // Validate new password meets minimum requirements (mirrors signUpSchema)
      if (!newPassword || newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }

      // Verify token is valid
      const tokenVerification = await this.verifyResetToken(token);

      if (!tokenVerification.success || !tokenVerification.data) {
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

      // Update customer password in database
      const { error: updateError } = await this.supabase
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
      const { error: tokenError } = await this.supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      if (tokenError) {
        console.error(`Failed to mark token as used: ${tokenError.message}`);
        // Don't fail the operation if we can't mark the token as used
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Password reset completion error:', error);
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