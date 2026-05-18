// Initialize Dependency Injection Container
// This file should be imported once at the application entry point

import 'reflect-metadata';
import { configureDependencyInjection } from './di-container';

// Initialize the DI container
let isConfigured = false;

export function initializeDI() {
  // Only initialize on server-side in API routes or server components
  // Skip initialization during build time or instrumentation
  if (typeof window === 'undefined' && !isConfigured && process.env.NODE_ENV !== 'production') {
    try {
      configureDependencyInjection();
      isConfigured = true;
    } catch (error) {
      console.error('Failed to configure DI container:', error);
    }
  } else if (typeof window === 'undefined' && !isConfigured && process.env.NODE_ENV === 'production') {
    try {
      configureDependencyInjection();
      isConfigured = true;
      console.log('DI container initialized successfully');
    } catch (error) {
      console.error('DI container initialization FAILED:', error);
      throw error;
    }
  }
}

// Auto-initialize only when server env vars are present (skips build time)
if (process.env.SUPABASE_SECRET_KEY) {
  initializeDI();
}
