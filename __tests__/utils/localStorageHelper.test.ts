/**
 * LocalStorageHelper delegates to global localStorage. In Node we stub it
 * directly without requiring jest-environment-jsdom.
 */
import { LocalStorageHelper } from '@/utils/helpers';

describe('LocalStorageHelper (ISSUE-013)', () => {
  const storage: Record<string, string> = {};
  let getItemImpl: (key: string) => string | null;
  let setItemImpl: (key: string, value: string) => void;

  beforeEach(() => {
    Object.keys(storage).forEach((key) => delete storage[key]);

    getItemImpl = (key: string) => (key in storage ? storage[key] : null);
    setItemImpl = (key: string, value: string) => {
      storage[key] = value;
    };

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: jest.fn((key: string) => getItemImpl(key)),
        setItem: jest.fn((key: string, value: string) => setItemImpl(key, value)),
        removeItem: jest.fn((key: string) => {
          delete storage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(storage).forEach((key) => delete storage[key]);
        }),
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('returns parsed values from localStorage', () => {
    storage['cookie-consent'] = JSON.stringify({ marketing: true, analytics: false });

    const result = LocalStorageHelper.getItem<{ marketing: boolean; analytics: boolean }>(
      'cookie-consent'
    );

    expect(result).toEqual({ marketing: true, analytics: false });
  });

  it('returns null when localStorage.getItem throws SecurityError', () => {
    getItemImpl = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };

    const result = LocalStorageHelper.getItem('cookie-consent');
    expect(result).toBeNull();
  });

  it('returns null when stored JSON is corrupt', () => {
    storage['cookie-consent'] = '{bad-json';

    const result = LocalStorageHelper.getItem('cookie-consent');
    expect(result).toBeNull();
  });

  it('swallows SecurityError on setItem', () => {
    setItemImpl = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };

    expect(() =>
      LocalStorageHelper.setItem('cookie-consent', { marketing: false })
    ).not.toThrow();
  });
});