import { describe, expect, it } from 'vitest';
import { productFilterSchema } from '@/lib/validation/catalogue';

describe('productFilterSchema', () => {
  it('applies defaults to an empty query', () => {
    const parsed = productFilterSchema.parse({});
    expect(parsed).toEqual({ sizes: [], colors: [], sort: 'newest' });
  });

  it('splits a comma-separated size list and lowercases it', () => {
    expect(productFilterSchema.parse({ size: 'M,L' }).sizes).toEqual(['m', 'l']);
  });

  it('accepts a single colour', () => {
    expect(productFilterSchema.parse({ color: 'Sand' }).colors).toEqual(['sand']);
  });

  it('falls back to the default sort when given an unknown value', () => {
    expect(productFilterSchema.parse({ sort: 'sideways' }).sort).toBe('newest');
  });

  it('accepts a known sort', () => {
    expect(productFilterSchema.parse({ sort: 'price-asc' }).sort).toBe('price-asc');
  });
});
