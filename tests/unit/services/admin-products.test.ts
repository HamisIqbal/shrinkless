import { describe, expect, it } from 'vitest';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';
import {
  PRODUCT_FILTERS,
  PRODUCT_SORTS,
  getProductForAdmin,
  listProductsForAdmin,
} from '@/lib/services/products';
import { parseListParams } from '@/lib/admin/query';
import { withTestDatabase } from '@/tests/setup/db';

withTestDatabase();

/** The list is paged now, so every call needs parameters. */
function params(raw: Record<string, string> = {}) {
  return parseListParams(raw, { sorts: PRODUCT_SORTS, filters: PRODUCT_FILTERS });
}

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

    const page = await listProductsForAdmin(params());

    expect(page.rows).toHaveLength(1);
    expect(page.rows[0].status).toBe('draft');
    expect(page.total).toBe(1);
  });

  it('summarises variant count and total stock', async () => {
    const product = await seedProduct();
    await Variant.create([
      { productId: product._id, size: 's', color: 'sand', sku: 'FT-S-SAND', priceCents: 4200, stock: 3 },
      { productId: product._id, size: 'm', color: 'sand', sku: 'FT-M-SAND', priceCents: 4200, stock: 4 },
    ]);

    const { rows: [row] } = await listProductsForAdmin(params());

    expect(row.variantCount).toBe(2);
    expect(row.totalStock).toBe(7);
    expect(row.imagePublicId).toBe('shrinkless/field-tee');
  });

  it('returns an empty page when nothing exists', async () => {
    const page = await listProductsForAdmin(params());

    expect(page.rows).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.pageCount).toBe(1);
  });

  it('hides archived products unless they are asked for', async () => {
    await seedProduct({ slug: 'live-tee' });
    await seedProduct({ slug: 'gone-tee', archivedAt: new Date() });

    const live = await listProductsForAdmin(params());
    const archived = await listProductsForAdmin(params({ archived: 'true' }));

    expect(live.rows.map((row) => row.slug)).toEqual(['live-tee']);
    expect(archived.rows.map((row) => row.slug)).toEqual(['gone-tee']);
  });

  it('searches title, slug and tags', async () => {
    await seedProduct({ slug: 'field-tee', title: 'Field Tee', tags: ['heavyweight'] });
    await seedProduct({ slug: 'beach-tee', title: 'Beach Tee', tags: ['light'] });

    const byTitle = await listProductsForAdmin(params({ q: 'beach' }));
    const byTag = await listProductsForAdmin(params({ q: 'heavyweight' }));

    expect(byTitle.rows.map((row) => row.slug)).toEqual(['beach-tee']);
    expect(byTag.rows.map((row) => row.slug)).toEqual(['field-tee']);
  });

  it('pages, and reports how many pages there are', async () => {
    for (let i = 0; i < 5; i += 1) await seedProduct({ slug: `tee-${i}` });

    const first = await listProductsForAdmin(params({ perPage: '2' }));
    const last = await listProductsForAdmin(params({ perPage: '2', page: '3' }));

    expect(first.rows).toHaveLength(2);
    expect(first.pageCount).toBe(3);
    expect(last.rows).toHaveLength(1);
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
