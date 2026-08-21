import { describe, expect, it } from 'vitest';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';
import { getProductForAdmin, listProductsForAdmin } from '@/lib/services/products';
import { withTestDatabase } from '@/tests/setup/db';

withTestDatabase();

async function seedProduct(overrides: Record<string, unknown> = {}) {
  return Product.create({
    title: 'Field Tee',
    slug: 'field-tee',
    category: 'tees',
    status: 'draft',
    images: [{ publicId: 'shrinkless/field-tee', width: 1200, height: 1500, alt: 'Field tee' }],
    optionSets: { sizes: ['s', 'm'], colors: ['sand'] },
    ...overrides,
  });
}

describe('listProductsForAdmin', () => {
  it('includes drafts, which the storefront listing hides', async () => {
    await seedProduct();

    const rows = await listProductsForAdmin();

    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('draft');
  });

  it('summarises variant count and total stock', async () => {
    const product = await seedProduct();
    await Variant.create([
      { productId: product._id, size: 's', color: 'sand', sku: 'FT-S-SAND', priceCents: 4200, stock: 3 },
      { productId: product._id, size: 'm', color: 'sand', sku: 'FT-M-SAND', priceCents: 4200, stock: 4 },
    ]);

    const [row] = await listProductsForAdmin();

    expect(row.variantCount).toBe(2);
    expect(row.totalStock).toBe(7);
    expect(row.imagePublicId).toBe('shrinkless/field-tee');
  });

  it('returns an empty array when nothing exists', async () => {
    expect(await listProductsForAdmin()).toEqual([]);
  });
});

describe('getProductForAdmin', () => {
  it('returns a draft product with its variants', async () => {
    const product = await seedProduct();
    await Variant.create({
      productId: product._id, size: 's', color: 'sand', sku: 'FT-S-SAND', priceCents: 4200, stock: 1,
    });

    const dto = await getProductForAdmin(String(product._id));

    expect(dto?.slug).toBe('field-tee');
    expect(dto?.variants).toHaveLength(1);
  });

  it('returns null for an id that is not a valid ObjectId', async () => {
    expect(await getProductForAdmin('not-an-id')).toBeNull();
  });

  it('returns null for a well-formed id that matches nothing', async () => {
    expect(await getProductForAdmin('64b7f3c2a1b2c3d4e5f60718')).toBeNull();
  });
});
