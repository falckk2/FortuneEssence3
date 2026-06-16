/**
 * ISSUE-003: Build-time resolve wrapper must not swallow runtime DI failures.
 */

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/lib/supabase-server', () => ({ getSupabaseServer: jest.fn() }));
jest.mock('@/config', () => ({
  config: {
    database: { supabaseUrl: 'http://test', supabaseSecretKey: 'secret' },
    stripe: { secretKey: 'sk_test' },
    email: { resendApiKey: 're_test' },
    auth: { nextAuthSecret: 'auth-secret' },
  },
}));

const mockResolve = jest.fn();
const mockRegister = jest.fn();

jest.mock('tsyringe', () => ({
  container: {
    resolve: (...args: unknown[]) => mockResolve(...args),
    register: (...args: unknown[]) => mockRegister(...args),
  },
  injectable: () => () => {},
  inject: () => () => {},
}));

describe('di-container resolve wrapper (ISSUE-003)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv, SUPABASE_SECRET_KEY: 'test-secret' };
    delete process.env.NEXT_PHASE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rethrows resolution errors at runtime with logging', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const resolveError = new Error('token not registered');
    mockResolve.mockImplementation(() => {
      throw resolveError;
    });

    const { container } = await import('@/config/di-container');

    expect(() => container.resolve(Symbol.for('MissingToken'))).toThrow(resolveError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[di] resolve failed at runtime for token',
      expect.any(String),
      resolveError
    );

    consoleErrorSpy.mockRestore();
  });

  it('returns null during build-time when env vars are absent', async () => {
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.NEXT_PHASE = 'phase-production-build';
    mockResolve.mockImplementation(() => {
      throw new Error('build-time expected failure');
    });

    const { container } = await import('@/config/di-container');

    expect(container.resolve(Symbol.for('BuildToken'))).toBeNull();
  });
});