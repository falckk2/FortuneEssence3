// Jest setup file for abandoned cart recovery tests
import 'reflect-metadata';

// Suppress console warnings during tests (optional)
// global.console = {
//   ...console,
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set default timeout for tests
jest.setTimeout(10000);

// Mock environment variables for tests
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 'test-api-key';
process.env.EMAIL_FROM = 'noreply@fortuneessence.se';
process.env.EMAIL_SUPPORT = 'support@fortuneessence.se';

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
