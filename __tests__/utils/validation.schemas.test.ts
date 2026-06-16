import {
  productUpdateSchema,
  bundleCreateSchema,
  bundleUpdateSchema,
} from '@/utils/validation';

describe('productUpdateSchema (ISSUE-031)', () => {
  it('accepts partial valid product fields', () => {
    const result = productUpdateSchema.safeParse({ price: 99.5, stock: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ price: 99.5, stock: 10 });
    }
  });

  it('rejects unknown fields via strict object shape', () => {
    const result = productUpdateSchema.safeParse({
      price: 10,
      maliciousField: 'injected',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('maliciousField');
    }
  });

  it('rejects invalid category values', () => {
    const result = productUpdateSchema.safeParse({ category: 'not-a-category' });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = productUpdateSchema.safeParse({ price: -1 });
    expect(result.success).toBe(false);
  });
});

describe('bundleCreateSchema (ISSUE-033)', () => {
  const validBundle = {
    bundleProductId: 'bundle-prod-1',
    requiredQuantity: 3,
    allowedCategory: 'essential-oils',
    discountPercentage: 15,
  };

  it('accepts valid bundle create payload', () => {
    const result = bundleCreateSchema.safeParse(validBundle);
    expect(result.success).toBe(true);
  });

  it('rejects missing bundleProductId', () => {
    const { bundleProductId: _, ...rest } = validBundle;
    const result = bundleCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects requiredQuantity above 20', () => {
    const result = bundleCreateSchema.safeParse({
      ...validBundle,
      requiredQuantity: 21,
    });
    expect(result.success).toBe(false);
  });

  it('rejects discountPercentage above 100', () => {
    const result = bundleCreateSchema.safeParse({
      ...validBundle,
      discountPercentage: 101,
    });
    expect(result.success).toBe(false);
  });
});

describe('bundleUpdateSchema (ISSUE-034)', () => {
  it('accepts partial bundle updates', () => {
    const result = bundleUpdateSchema.safeParse({ discountPercentage: 25 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid partial values', () => {
    const result = bundleUpdateSchema.safeParse({ requiredQuantity: 0 });
    expect(result.success).toBe(false);
  });
});