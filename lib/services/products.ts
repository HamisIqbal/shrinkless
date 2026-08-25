import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connection';
import { Product, type ProductDoc } from '@/lib/db/models/product';
import { Variant, type VariantDoc } from '@/lib/db/models/variant';
import type { ProductFilter } from '@/lib/validation/catalogue';
import type { ProductInput } from '@/lib/validation/product';
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

  const query: Record<string, unknown> = { status: 'published' };
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
function timeOf(doc: unknown): number {
  const value = (doc as { createdAt?: Date | string }).createdAt;
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

  const product = (await Product.findOne({ slug, status: 'published' }).lean()) as WithId<ProductDoc> | null;
  if (!product) return null;

  const variants = (await Variant.find({ productId: product._id }).lean()) as WithId<VariantDoc>[];
  return toProductDTO(product, variants);
}

export async function listProductsForAdmin(): Promise<AdminProductRowDTO[]> {
  await connectToDatabase();

  const products = (await Product.find({}).sort({ createdAt: -1 }).lean()) as WithId<ProductDoc>[];
  const grouped = await loadVariantsByProduct(products.map((p) => p._id));

  return products.map((product) => {
    const variants = grouped.get(String(product._id)) ?? [];

    return {
      id: String(product._id),
      title: product.title,
      slug: product.slug,
      status: product.status as 'draft' | 'published',
      featured: Boolean(product.featured),
      imagePublicId: product.images[0]?.publicId ?? '',
      variantCount: variants.length,
      totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
    };
  });
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

export async function saveProduct(
  input: Omit<ProductInput, 'featured' | 'badge' | 'rating'> & {
    featured?: boolean;
    badge?: 'none' | 'new';
    rating?: number;
    id?: string;
  },
): Promise<string> {
  await connectToDatabase();

  const clash = await Product.findOne({ slug: input.slug }).select('_id').lean();
  if (clash && (!input.id || String(clash._id) !== input.id)) {
    throw new SlugTakenError(input.slug);
  }

  const fields = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    category: input.category,
    status: input.status,
    featured: input.featured ?? false,
    badge: input.badge ?? 'none',
    rating: input.rating ?? 0,
    images: input.images,
    optionSets: { sizes: input.sizes, colors: input.colors },
  };

  const product = input.id
    ? await Product.findByIdAndUpdate(input.id, { $set: fields }, { returnDocument: 'after' })
    : await Product.create(fields);

  if (!product) throw new Error(`No product with id ${input.id}`);

  // Upsert by (productId, size, color) — the pair the unique index covers — so a
  // re-save never duplicates a row, and never deletes one either: carts hold
  // variant ids and past orders were priced from them.
  for (const variant of input.variants) {
    await Variant.findOneAndUpdate(
      { productId: product._id, size: variant.size, color: variant.color },
      {
        $set: {
          sku: variant.sku,
          priceCents: variant.priceCents,
          stock: variant.stock,
          enabled: variant.enabled,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }

  return String(product._id);
}
