/**
 * Client-side auth helpers.
 *
 * These functions wrap next-auth/react and must ONLY be called from
 * React components or client-side hooks — never from server-side API
 * routes or DI-injected services (they depend on browser APIs / the
 * SessionProvider context).
 *
 * Server-safe auth operations (signUp, resetPassword, etc.) live on
 * AuthService which is registered in the DI container.
 */

'use client';

import { signIn, signOut, getSession } from 'next-auth/react';

export type SignInResult = {
  success: boolean;
  error?: string;
};

/**
 * Sign in with credentials via next-auth. Call from React components only.
 */
export async function clientSignIn(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Sign in failed: ${error}` };
  }
}

/**
 * Sign out the current user. Call from React components only.
 */
export async function clientSignOut(
  options: { callbackUrl?: string; redirect?: boolean } = {}
): Promise<void> {
  await signOut({ redirect: options.redirect ?? false, callbackUrl: options.callbackUrl });
}

/**
 * Get the current client-side session. Call from React components only.
 * Prefer useSession() hook for reactive updates.
 */
export { getSession as getClientSession };
