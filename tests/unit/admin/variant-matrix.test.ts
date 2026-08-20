import { describe, expect, it } from 'vitest';
import { buildVariantMatrix, skuFor } from '@/lib/admin/variant-matrix';
import type { VariantDTO } from '@/types/dto';

function variant(overrides: Partial<VariantDTO>): VariantDTO {
  return {
    id: 'v1', size: 's', color: 'sand', sku: 'FIELD-TEE-S-SAND',
    priceCents: 4200, stock: 5, inStock: true, enabled: true,
    ...overrides,
  };
}

describe('skuFor', () => {
  it('derives an uppercase dash-joined sku', () => {
    expect(skuFor('field-tee', 's', 'sand')).toBe('FIELD-TEE-S-SAND');
  });

  it('normalises spaces and case in the option values', () => {
    expect(skuFor('Field Tee', 'XL', 'Off White')).toBe('FIELD-TEE-XL-OFF-WHITE');
  });
});

describe('buildVariantMatrix', () => {
  const base = { slug: 'field-tee', existing: [], defaultPriceCents: 4200 };

  it('generates the full cross product in option order', () => {
    const rows = buildVariantMatrix({ ...base, sizes: ['s', 'm'], colors: ['sand', 'black'] });

    expect(rows.map((row) => row.key)).toEqual(['s:sand', 's:black', 'm:sand', 'm:black']);
  });

  it('gives new rows the default price, zero stock, and enabled true', () => {
    const [row] = buildVariantMatrix({ ...base, sizes: ['s'], colors: ['sand'] });

    expect(row).toMatchObject({
      sku: 'FIELD-TEE-S-SAND', priceCents: 4200, stock: 0,
      enabled: true, variantId: null, orphan: false,
    });
  });

  it('preserves stock, price, sku and enabled on an existing combination', () => {
    const rows = buildVariantMatrix({
      ...base,
      sizes: ['s', 'm'],
      colors: ['sand'],
      existing: [variant({ id: 'abc', sku: 'LEGACY-1', priceCents: 3900, stock: 12, enabled: false })],
    });

    expect(rows[0]).toMatchObject({
      key: 's:sand', variantId: 'abc', sku: 'LEGACY-1',
      priceCents: 3900, stock: 12, enabled: false,
    });
    expect(rows[1]).toMatchObject({ key: 'm:sand', variantId: null, stock: 0 });
  });

  it('appends a colour without disturbing existing rows', () => {
    const rows = buildVariantMatrix({
      ...base,
      sizes: ['s'],
      colors: ['sand', 'black'],
      existing: [variant({ id: 'abc', stock: 12 })],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0].stock).toBe(12);
    expect(rows[1]).toMatchObject({ key: 's:black', stock: 0, variantId: null });
  });

  it('keeps a removed combination as a disabled orphan rather than deleting it', () => {
    const rows = buildVariantMatrix({
      ...base,
      sizes: ['m'],
      colors: ['sand'],
      existing: [variant({ id: 'abc', size: 's', color: 'sand', stock: 12 })],
    });

    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      key: 's:sand', variantId: 'abc', orphan: true, enabled: false, stock: 12,
    });
  });

  it('matches existing variants case-insensitively', () => {
    const rows = buildVariantMatrix({
      ...base,
      sizes: ['S'],
      colors: ['Sand'],
      existing: [variant({ id: 'abc', size: 's', color: 'sand' })],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].variantId).toBe('abc');
  });

  it('returns nothing when either option set is empty', () => {
    expect(buildVariantMatrix({ ...base, sizes: [], colors: ['sand'] })).toEqual([]);
    expect(buildVariantMatrix({ ...base, sizes: ['s'], colors: [] })).toEqual([]);
  });
});
