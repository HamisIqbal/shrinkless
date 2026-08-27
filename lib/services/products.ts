import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connection';
import { Product, type ProductDoc } from '@/lib/db/models/product';
import { Variant, type VariantDoc } from '@/lib/db/models/variant';
import type { ProductFilter } from '@/lib/validation/catalogue';
import type { ProductInput, VariantInput } from '@/lib/validation/product';
import { pageWindow, searchRegex, sortStage, toPaged, type ListParams, type Paged } from '@/lib/admin/query';
import type { AdminProductRowDTO, ProductDTO, VariantDTO } from '@/types/dto';

type WithId<T> = T & { _id: Types.ObjectId };

function toVariantDTO(variant: WithId<VariantDoc>): VariantDTO {
  return {
    id: String(variant._id),
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    priceCents: variant.priceCents,
    stock: variant.stock,
    inStock: variant.stock > 0,
    enabled: variant.enabled,
    lowStockThreshold: variant.lowStockThreshold ?? null,
    imagePublicId: variant.imagePublicId ?? '',
  };
}

function toProductDTO(product: WithId<ProductDoc>, variants: WithId<VariantDoc>[]): ProductDTO {
  const variantDTOs = variants.map(toVariantDTO);
  const sellable = variantDTOs.filter((v) => v.enabled);

  return {
    id: String(product._id),
    title: product.title,
    slug: product.slug,
    description: product.description,
    category: product.category,
    status: product.status as 'draft' | 'published',
    featured: Boolean(product.featured),
    badge: (product.badge as 'none' | 'new') ?? 'none',
    rating: product.rating ?? 0,
    images: product.images.map((image) => ({
      publicId: image.publicId,
      width: image.width,
      height: image.height,
      alt: image.alt,
    })),
    sizes: product.optionSets?.sizes ?? [],
    colors: product.optionSets?.colors ?? [],
    variants: variantDTOs,
    minPriceCents: sellable.length ? Math.min(...sellable.map((v) => v.priceCents)) : 0,
    tags: product.tags ?? [],
    baseSku: product.baseSku ?? '',
    seo: {
      title: product.seo?.title ?? '',
      description: product.seo?.description ?? '',
      keywords: product.seo?.keywords ?? [],
    },
    quantityRule: {
      min: product.quantityRule?.min ?? 1,
      step: product.quantityRule?.step ?? 1,
      max: product.quantityRule?.max ?? null,
    },
    archived: Boolean(product.archivedAt),
  };
}

async function loadVariantsByProduct(productIds: Types.ObjectId[]) {
  const variants = (await Variant.find({ productId: { $in: productIds } }).lean()) as WithId<VariantDoc>[];
  const grouped = new Map<string, WithId<VariantDoc>[]>();

  for (const variant of variants) {
    const key = String(variant.productId);
    grouped.set(key, [...(grouped.get(key) ?? []), variant]);
  }

  return grouped;
}

export async function listPublishedProducts(
  filter: ProductFilter,
  category?: string,
): Promise<ProductDTO[]> {
  await connectToDatabase();

  // Archived products leave the storefront entirely. They keep their
  // documents so old orders and carts still resolve, but nothing lists them.
  const query: Record<string, unknown> = { status: 'published', archivedAt: null };
  if (category) query.category = category;

  const products = (await Product.find(query).lean()) as WithId<ProductDoc>[];
  const grouped = await loadVariantsByProduct(products.map((p) => p._id));

  const dtos = products.map((product) =>
    toProductDTO(product, grouped.get(String(product._id)) ?? []),
  );

  // A size or colour filter means "show me what I can actually buy in this",
  // so a variant only counts if it is enabled AND in stock. Matching on
  // existence alone would send shoppers to products that are sold out in the
  // very size they filtered for.
  const needle = filter.q.toLowerCase();

  const matching = dtos.filter((product) => {
    const buyable = product.variants.filter((v) => v.enabled && v.inStock);

    const sizeOk = !filter.sizes.length || buyable.some((v) => filter.sizes.includes(v.size));
    const colorOk = !filter.colors.length || buyable.some((v) => filter.colors.includes(v.color));

    // Search covers what a shopper can see on the tile: the name, the copy,
    // and the colourways — someone searching "charcoal" means a colour.
    const textOk =
      !needle ||
      product.title.toLowerCase().includes(needle) ||
      product.description.toLowerCase().includes(needle) ||
      product.colors.some((color) => color.toLowerCase().includes(needle));

    // Price is compared against what the shopper actually sees on the tile:
    // the cheapest buyable variant, not every variant's price.
    const priceOk =
      (filter.minPrice === null || product.minPriceCents >= filter.minPrice * 100) &&
      (filter.maxPrice === null || product.minPriceCents <= filter.maxPrice * 100);

    return sizeOk && colorOk && textOk && priceOk;
  });

  if (filter.sort === 'price-asc') {
    return matching.sort((a, b) => a.minPriceCents - b.minPriceCents);
  }
  if (filter.sort === 'price-desc') {
    return matching.sort((a, b) => b.minPriceCents - a.minPriceCents);
  }

  // "Newest" has to mean newest. Mongo's natural order is not insertion order
  // and reversing it only looked right while the catalogue was one product.
  const createdAt = new Map(products.map((p) => [String(p._id), timeOf(p)]));
  return matching.sort((a, b) => (createdAt.get(b.id) ?? 0) - (createdAt.get(a.id) ?? 0));
}

/** `timestamps: true` is on the schema but absent from the inferred type. */
function timeOf(doc: unknown, field: 'createdAt' | 'updatedAt' = 'createdAt'): number {
  const value = (doc as Record<string, Date | string | undefined>)[field];
  return value ? new Date(value).getTime() : 0;
}

/**
 * The homepage's "New Arrivals" rail. Real recency, straight off `createdAt` —
 * nothing here is curated.
 */
export async function listNewArrivals(limit = 4): Promise<ProductDTO[]> {
  const all = await listPublishedProducts({ sizes: [], colors: [], sort: 'newest', q: '', minPrice: null, maxPrice: null });
  return all.slice(0, limit);
}

/**
 * The homepage's featured rail.
 *
 * Deliberately NOT "best sellers": the store has no sales history to rank by,
 * so this reads the `featured` flag an admin sets in the product editor. If
 * nothing is flagged it falls back to the newest products rather than
 * rendering an empty band.
 */
export async function listFeaturedProducts(limit = 3): Promise<ProductDTO[]> {
  const all = await listPublishedProducts({ sizes: [], colors: [], sort: 'newest', q: '', minPrice: null, maxPrice: null });
  const chosen = all.filter((product) => product.featured);

  return (chosen.length ? chosen : all).slice(0, limit);
}

/** Everything published in one category, newest first. Powers the gateways. */
export async function listProductsInCategory(
  category: string,
  limit?: number,
): Promise<ProductDTO[]> {
  const all = await listPublishedProducts(
    { sizes: [], colors: [], sort: 'newest', q: '', minPrice: null, maxPrice: null },
    category,
  );
  return typeof limit === 'number' ? all.slice(0, limit) : all;
}

export async function getPublishedProductBySlug(slug: string): Promise<ProductDTO | null> {
  await connectToDatabase();

  const product = (await Product.findOne({
    slug,
    status: 'published',
    archivedAt: null,
  }).lean()) as WithId<ProductDoc> | null;
  if (!product) return null;

  const variants = (await Variant.find({ productId: product._id }).lean()) as WithId<VariantDoc>[];
  return toProductDTO(product, variants);
}

/** Sort keys the admin product list understands. First one is the default. */
export const PRODUCT_SORTS = ['updatedAt', 'createdAt', 'title', 'status'] as const;
export const PRODUCT_FILTERS = ['status', 'category', 'featured', 'archived'] as const;

/**
 * One page of products, filtered and sorted by the database.
 *
 * The variant roll-up (count, total stock, cheapest price) is a second query
 * scoped to the ids on *this page* — not the whole catalogue — so the cost of
 * the list does not grow with the size of the store.
 */
export async function listProductsForAdmin(
  params: ListParams,
): Promise<Paged<AdminProductRowDTO>> {
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  // Archived is opt-in: an admin looking at "products" means the live ones.
  query.archivedAt = params.filters.archived === 'true' ? { $ne: null } : null;

  if (params.filters.status === 'draft' || params.filters.status === 'published') {
    query.status = params.filters.status;
  }
  if (params.filters.category) query.category = params.filters.category;
  if (params.filters.featured === 'true') query.featured = true;

  const needle = searchRegex(params.q);
  if (needle) {
    query.$or = [{ title: needle }, { slug: needle }, { baseSku: needle }, { tags: needle }];
  }

  const { skip, limit } = pageWindow(params);

  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .sort(sortStage(params.sort, params.direction))
      .skip(skip)
      .limit(limit)
      .lean() as Promise<WithId<ProductDoc>[]>,
  ]);

  const grouped = await loadVariantsByProduct(products.map((p) => p._id));

  const rows = products.map((product) => {
    const variants = grouped.get(String(product._id)) ?? [];
    const sellable = variants.filter((variant) => variant.enabled);

    return {
      id: String(product._id),
      title: product.title,
      slug: product.slug,
      category: product.category,
      status: product.status as 'draft' | 'published',
      featured: Boolean(product.featured),
      archived: Boolean(product.archivedAt),
      imagePublicId: product.images[0]?.publicId ?? '',
      variantCount: variants.length,
      totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
      minPriceCents: sellable.length ? Math.min(...sellable.map((v) => v.priceCents)) : 0,
      updatedAt: new Date(timeOf(product, 'updatedAt') || timeOf(product) || Date.now()).toISOString(),
    };
  });

  return toPaged(rows, total, params);
}

export async function getProductForAdmin(id: string): Promise<ProductDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();

  const product = (await Product.findById(id).lean()) as WithId<ProductDoc> | null;
  if (!product) return null;

  const variants = (await Variant.find({ productId: product._id }).lean()) as WithId<VariantDoc>[];
  return toProductDTO(product, variants);
}

export class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`Another product already uses the slug "${slug}"`);
    this.name = 'SlugTakenError';
  }
}

export class SkuTakenError extends Error {
  constructor(sku: string) {
    super(`The SKU "${sku}" is already used by another variant`);
    this.name = 'SkuTakenError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(id: string) {
    super(`No product with id ${id}`);
    this.name = 'ProductNotFoundError';
  }
}

export type SaveActor = { id: string; email: string };

/** Every SKU in the payload has to be unique among themselves and free of any
 *  variant belonging to another product. The unique index is the real guard;
 *  this turns a driver-level duplicate-key crash into a message that names the
 *  offending SKU. */
async function assertSkusAreFree(
  skus: string[],
  productId: Types.ObjectId | null,
): Promise<void> {
  const seen = new Set<string>();
  for (const sku of skus) {
    if (seen.has(sku)) throw new SkuTakenError(sku);
    seen.add(sku);
  }

  if (!skus.length) return;

  const clashes = await Variant.find({
    sku: { $in: skus },
    ...(productId ? { productId: { $ne: productId } } : {}),
  })
    .select('sku')
    .lean();

  if (clashes.length) throw new SkuTakenError(clashes[0].sku);
}

/**
 * Creates or updates a product and reconciles its variants.
 *
 * Two rules that look like details and are not:
 *
 * Variants are upserted by (productId, size, color) and never deleted. Carts
 * hold variant ids and past orders were priced from them, so removing a row
 * would rewrite history; a combination that leaves the option sets is disabled
 * instead.
 *
 * Stock is *not* written here. A quantity typed into the product form is a
 * stock correction like any other, so it goes through the inventory service,
 * which takes the lock, refuses to go negative, and records who did it. The
 * editor is not a back door around the ledger.
 */
export async function saveProduct(
  input: Omit<
    ProductInput,
    | 'featured'
    | 'badge'
    | 'rating'
    | 'tags'
    | 'baseSku'
    | 'seo'
    | 'quantityRule'
    | 'variants'
  > & {
    variants: (Omit<VariantInput, 'lowStockThreshold' | 'imagePublicId'> & {
      lowStockThreshold?: number | null;
      imagePublicId?: string;
    })[];
    featured?: boolean;
    badge?: 'none' | 'new';
    rating?: number;
    tags?: string[];
    baseSku?: string;
    seo?: { title: string; description: string; keywords: string[] };
    quantityRule?: { min: number; step: number; max: number | null };
    id?: string;
  },
  actor: SaveActor = { id: '', email: 'system' },
): Promise<string> {
  await connectToDatabase();

  if (input.id && !Types.ObjectId.isValid(input.id)) throw new ProductNotFoundError(input.id);

  const clash = await Product.findOne({ slug: input.slug }).select('_id').lean();
  if (clash && (!input.id || String(clash._id) !== input.id)) {
    throw new SlugTakenError(input.slug);
  }

  await assertSkusAreFree(
    input.variants.map((variant) => variant.sku),
    input.id ? new Types.ObjectId(input.id) : null,
  );

  const fields = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    category: input.category,
    status: input.status,
    featured: input.featured ?? false,
    badge: input.badge ?? 'none',
    rating: input.rating ?? 0,
    tags: input.tags ?? [],
    baseSku: input.baseSku ?? '',
    seo: input.seo ?? { title: '', description: '', keywords: [] },
    quantityRule: input.quantityRule ?? { min: 1, step: 1, max: null },
    images: input.images,
    optionSets: { sizes: input.sizes, colors: input.colors },
  };

  const product = input.id
    ? await Product.findByIdAndUpdate(input.id, { $set: fields }, { returnDocument: 'after' })
    : await Product.create(fields);

  if (!product) throw new ProductNotFoundError(input.id ?? '');

  const { setVariantStock } = await import('@/lib/services/inventory');

  for (const variant of input.variants) {
    const saved = await Variant.findOneAndUpdate(
      { productId: product._id, size: variant.size, color: variant.color },
      {
        $set: {
          sku: variant.sku,
          priceCents: variant.priceCents,
          enabled: variant.enabled,
          lowStockThreshold: variant.lowStockThreshold ?? null,
          imagePublicId: variant.imagePublicId ?? '',
        },
        // Only ever an initial value. Existing rows keep the ledger's number.
        $setOnInsert: { stock: 0 },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    if (saved && saved.stock !== variant.stock) {
      await setVariantStock({
        variantId: String(saved._id),
        stock: variant.stock,
        reason: 'correction',
        note: 'Set from the product editor',
        actor,
      });
    }
  }

  return String(product._id);
}

/**
 * Takes a product off the storefront without destroying it.
 *
 * A hard delete is never offered: variant ids live in carts and every past
 * order was priced from a variant that belongs to a product. Archiving keeps
 * those references resolvable while removing the product from every list a
 * shopper or an admin sees by default.
 */
export async function archiveProduct(id: string, archived: boolean): Promise<void> {
  if (!Types.ObjectId.isValid(id)) throw new ProductNotFoundError(id);

  await connectToDatabase();

  const update = archived
    ? { $set: { archivedAt: new Date(), status: 'draft' as const } }
    : { $set: { archivedAt: null } };

  const product = await Product.findByIdAndUpdate(id, update);
  if (!product) throw new ProductNotFoundError(id);
}

/** Publish or unpublish. Archived products cannot be published — they would
 *  reappear on the storefront with no obvious cause. */
export async function setProductStatus(
  id: string,
  status: 'draft' | 'published',
): Promise<void> {
  if (!Types.ObjectId.isValid(id)) throw new ProductNotFoundError(id);

  await connectToDatabase();

  const product = await Product.findById(id).select('archivedAt').lean();
  if (!product) throw new ProductNotFoundError(id);

  if (product.archivedAt && status === 'published') {
    throw new Error('Restore this product before publishing it.');
  }

  await Product.updateOne({ _id: id }, { $set: { status } });
}

/** Every distinct category slug in use, for the admin filter. */
export async function listUsedCategorySlugs(): Promise<string[]> {
  await connectToDatabase();
  const slugs = await Product.distinct('category', { archivedAt: null });
  return (slugs as string[]).filter(Boolean).sort();
}

/** How many live products sit in a category. The category service asks before
 *  allowing an archive. */
export async function countProductsInCategory(slug: string): Promise<number> {
  await connectToDatabase();
  return Product.countDocuments({ category: slug, archivedAt: null });
}

/** Moves every product from one category slug to another. Used when a category
 *  is renamed, so no product is left pointing at a slug that no longer
 *  resolves. */
export async function reassignCategory(from: string, to: string): Promise<number> {
  await connectToDatabase();
  const result = await Product.updateMany({ category: from }, { $set: { category: to } });
  return result.modifiedCount ?? 0;
}
