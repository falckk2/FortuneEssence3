// Initialize Dependency Injection Container
// This file should be imported once at the application entry point

import 'reflect-metadata';
import { configureDependencyInjection } from './di-container';

// Initialize the DI container
let isConfigured = false;

export function initializeDI() {
  // Only initialize on server-side in API routes or server components.
  // A single branch covers all NODE_ENV values (development, production, test, etc.)
  // so the container is never accidentally skipped in test or custom environments.
  if (typeof window === 'undefined' && !isConfigured) {
    try {
      configureDependencyInjection();
      isConfigured = true;
      console.log('[di-init] DI container initialized successfully', { nodeEnv: process.env.NODE_ENV });
    } catch (error) {
      console.error('[di-init] DI container initialization FAILED:', error);
      throw error;
    }
  }
}

// Auto-initialize only when server env vars are present (skips build time)
if (process.env.SUPABASE_SECRET_KEY) {
  initializeDI();
}
