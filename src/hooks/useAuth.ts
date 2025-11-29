import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useCallback } from 'react';
import { Customer, ApiResponse } from '@/types';
import { AuthService } from '@/services/auth/AuthService';
import { SignUpData } from '@/interfaces/services';

const authService = new AuthService();

export interface UseAuthResult {
  user: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<ApiResponse<void>>;
  signUp: (data: SignUpData) => Promise<ApiResponse<Customer>>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<ApiResponse<void>>;
}

export const useAuth = (): UseAuthResult => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = useCallback(async (email: string, password: string): Promise<ApiResponse<void>> => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setIsLoading(false);
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Sign in failed: ${error}`,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignUp = useCallback(async (data: SignUpData): Promise<ApiResponse<Customer>> => {
    setIsLoading(true);
    try {
      const result = await authService.signUp(data);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResetPassword = useCallback(async (email: string): Promise<ApiResponse<void>> => {
    setIsLoading(true);
    try {
      const result = await authService.resetPassword(email);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convert session user to Customer type (this is a simplified conversion)
  const user: Customer | null = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: (session.user as any).firstName || '',
    lastName: (session.user as any).lastName || '',
    phone: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Sweden',
    },
    consentGiven: true,
    marketingOptIn: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } : null;

  return {
    user,
    isLoading: status === 'loading' || isLoading,
    isAuthenticated: !!session,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
  };
};

export default useAuth;