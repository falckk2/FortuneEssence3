// Initialize Dependency Injection Container
// This file should be imported once at the application entry point

import 'reflect-metadata';
import { configureDependencyInjection } from './di-container';

// Initialize the DI container
let isConfigured = false;

export function initializeDI() {
  if (!isConfigured) {
    configureDependencyInjection();
    isConfigured = true;
  }
}

// Auto-initialize for server-side code
if (typeof window === 'undefined') {
  initializeDI();
}
