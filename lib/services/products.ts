import { Product, type ProductDoc } from '@/lib/db/models/product';
import { Variant, type VariantDoc } from '@/lib/db/models/variant';
import type { ProductFilter } from '@/lib/validation/catalogue';
import type { ProductDTO, VariantDTO } from '@/types/dto';

type WithId<T> = T & { _id: unknown };

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
    images: product.images.map((image) => ({
      publicId: image.publicId,
      width: image.width,
      height: image.height,
      alt: image.alt,
    })),
    sizes: product.optionSets.sizes,
    colors: product.optionSets.colors,
    variants: variantDTOs,
    minPriceCents: sellable.length ? Math.min(...sellable.map((v) => v.priceCents)) : 0,
  };
}

async function loadVariantsByProduct(productIds: unknown[]) {
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
  const query: Record<string, unknown> = { status: 'published' };
  if (category) query.category = category;

  const products = (await Product.find(query).lean()) as WithId<ProductDoc>[];
  const grouped = await loadVariantsByProduct(products.map((p) => p._id));

  const dtos = products.map((product) =>
    toProductDTO(product, grouped.get(String(product._id)) ?? []),
  );

  const matching = dtos.filter((product) => {
    const sizeOk =
      !filter.sizes.length || product.variants.some((v) => v.enabled && filter.sizes.includes(v.size));
    const colorOk =
      !filter.colors.length || product.variants.some((v) => v.enabled && filter.colors.includes(v.color));
    return sizeOk && colorOk;
  });

  if (filter.sort === 'price-asc') {
    return matching.sort((a, b) => a.minPriceCents - b.minPriceCents);
  }
  if (filter.sort === 'price-desc') {
    return matching.sort((a, b) => b.minPriceCents - a.minPriceCents);
  }
  return matching.reverse();
}

export async function getPublishedProductBySlug(slug: string): Promise<ProductDTO | null> {
  const product = (await Product.findOne({ slug, status: 'published' }).lean()) as WithId<ProductDoc> | null;
  if (!product) return null;

  const variants = (await Variant.find({ productId: product._id }).lean()) as WithId<VariantDoc>[];
  return toProductDTO(product, variants);
}
