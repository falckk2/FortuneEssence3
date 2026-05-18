import 'reflect-metadata';

export async function register() {
  // Initialize the DI container at server startup so it is ready before the
  // first request arrives, rather than initialising lazily on first import.
  // This also makes boot-time failures visible in deployment logs immediately.
  // Only runs on the Node.js runtime (not Edge); skipped at build time because
  // SUPABASE_SECRET_KEY is absent during `next build`.
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SUPABASE_SECRET_KEY) {
    const { initializeDI } = await import('@/config/di-init');
    initializeDI();
  }
}
