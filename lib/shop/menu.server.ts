import { listProductsInCategory } from '@/lib/services/products';
import { listVisibleCategories } from '@/lib/services/categories';
import { CATEGORY_IMAGES, type BrandImage, type CategorySlug } from '@/lib/brand/images';
import { SHOPPABLE, type NavColumn, type NavFeature, type ShopMenu } from '@/lib/shop/navigation';

export type ShoppableCategory = { slug: string; label: string };

/**
 * The categories the storefront will offer, from the database.
 *
 * These used to be a hard-coded array, which meant adding a category was a
 * deploy. They now come from the `Category` collection — with the old array as
 * a fallback, because a store whose categories have not been imported yet must
 * still have a navigable shop rather than an empty menu.
 */
export async function shoppableCategories(): Promise<ShoppableCategory[]> {
  const categories = await listVisibleCategories();

  if (!categories.length) return SHOPPABLE.map(({ slug, label }) => ({ slug, label }));

  return categories.map((category) => ({ slug: category.slug, label: category.name }));
}

/** Categories have their own art where we have it, and the men's frame as a
 *  neutral stand-in where we do not — an empty tile reads as a broken page. */
function imageFor(slug: string): BrandImage {
  return CATEGORY_IMAGES[slug as CategorySlug] ?? CATEGORY_IMAGES.men;
}

/**
 * The desktop mega menu, assembled from the catalogue rather than hard-coded.
 *
 * A hand-written menu drifts the moment a product is added or unpublished, and
 * the drift is invisible until a customer hits a dead link. Reading the real
 * categories means the menu can only ever offer what the store actually sells.
 */
export async function buildShopMenu(): Promise<ShopMenu> {
  const categories = await shoppableCategories();

  const products = await Promise.all(
    categories.map((category) => listProductsInCategory(category.slug)),
  );

  const columns: NavColumn[] = [
    {
      title: 'Shop',
      href: '/shop',
      links: [
        { href: '/shop', label: 'All Products' },
        { href: '/shop?sort=newest', label: 'New Arrivals' },
        { href: '/shop?sort=price-asc', label: 'Price, Low to High' },
      ],
    },
    ...categories.map((category, index) => ({
      title: category.label,
      href: `/shop/${category.slug}`,
      links: [
        { href: `/shop/${category.slug}`, label: `All ${category.label}’s` },
        ...products[index].map((product) => ({
          href: `/product/${product.slug}`,
          label: product.title,
        })),
      ],
    })),
  ];

  const features: NavFeature[] = categories.map((category, index) => ({
    href: `/shop/${category.slug}`,
    label: category.label,
    caption: `${products[index].length} ${products[index].length === 1 ? 'style' : 'styles'}`,
    image: imageFor(category.slug),
  }));

  return { columns, features };
}
