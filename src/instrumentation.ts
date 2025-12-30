import 'reflect-metadata';

export async function register() {
  // This file ensures reflect-metadata is loaded before any other code
  // Required for tsyringe dependency injection
  // DI container initialization happens on-demand in API routes
}
