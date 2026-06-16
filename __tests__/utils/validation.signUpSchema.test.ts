import { signUpSchema } from '@/utils/validation';

describe('signUpSchema (ISSUE-017)', () => {
  const base = {
    password: 'Password1',
    firstName: 'Anna',
    lastName: 'Svensson',
    consentGiven: true as const,
  };

  it('trims and lowercases email before validation', () => {
    const result = signUpSchema.safeParse({
      ...base,
      email: '  User@Example.COM  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects email longer than 254 characters', () => {
    const longLocal = 'a'.repeat(250);
    const result = signUpSchema.safeParse({
      ...base,
      email: `${longLocal}@example.com`,
    });

    expect(result.success).toBe(false);
  });

  it('trims firstName and lastName', () => {
    const result = signUpSchema.safeParse({
      ...base,
      email: 'user@example.com',
      firstName: '  Anna  ',
      lastName: '  Svensson  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('Anna');
      expect(result.data.lastName).toBe('Svensson');
    }
  });

  it('trims phone and rejects values longer than 20 characters', () => {
    const valid = signUpSchema.safeParse({
      ...base,
      email: 'user@example.com',
      phone: '  0701234567  ',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.phone).toBe('0701234567');
    }

    const invalid = signUpSchema.safeParse({
      ...base,
      email: 'user@example.com',
      phone: '1'.repeat(21),
    });
    expect(invalid.success).toBe(false);
  });
});