/**
 * ISSUE-004: DI init must run in all NODE_ENV values, not only dev/production branches.
 */

const mockConfigure = jest.fn();

jest.mock('./di-container', () => ({
  configureDependencyInjection: (...args: unknown[]) => mockConfigure(...args),
}), { virtual: true });

jest.mock('@/config/di-container', () => ({
  configureDependencyInjection: (...args: unknown[]) => mockConfigure(...args),
}));

describe('di-init (ISSUE-004)', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Ensure server-side
    // @ts-expect-error test shim
    delete global.window;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.window = originalWindow;
  });

  it('initializes DI in NODE_ENV=test when called explicitly', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.SUPABASE_SECRET_KEY;
    mockConfigure.mockImplementation(() => undefined);

    const { initializeDI } = await import('@/config/di-init');
    initializeDI();

    expect(mockConfigure).toHaveBeenCalledTimes(1);
  });

  it('rethrows configuration errors instead of swallowing them', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SUPABASE_SECRET_KEY;
    const configError = new Error('registration failed');
    mockConfigure.mockImplementation(() => {
      throw configError;
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { initializeDI } = await import('@/config/di-init');

    expect(() => initializeDI()).toThrow(configError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[di-init] DI container initialization FAILED:',
      configError
    );

    consoleErrorSpy.mockRestore();
  });
});