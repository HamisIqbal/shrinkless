import { listProductsInCategory } from '@/lib/services/products';
import { CATEGORY_IMAGES } from '@/lib/brand/images';
import { SHOPPABLE, type NavColumn, type NavFeature, type ShopMenu } from '@/lib/shop/navigation';

/**
 * The desktop mega menu, assembled from the catalogue rather than hard-coded.
 *
 * A hand-written menu drifts the moment a product is added or unpublished, and
 * the drift is invisible until a customer hits a dead link. Reading the real
 * categories means the menu can only ever offer what the store actually sells.
 */
export async function buildShopMenu(): Promise<ShopMenu> {
  const [men, women] = await Promise.all([
    listProductsInCategory('men'),
    listProductsInCategory('women'),
  ]);

  const byCategory = { men, women };

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
    ...SHOPPABLE.map(({ slug, label }) => ({
      title: label,
      href: `/shop/${slug}`,
      links: [
        { href: `/shop/${slug}`, label: `All ${label}’s` },
        ...byCategory[slug].map((product) => ({
          href: `/product/${product.slug}`,
          label: product.title,
        })),
      ],
    })),
  ];

  const features: NavFeature[] = SHOPPABLE.map(({ slug, label }) => ({
    href: `/shop/${slug}`,
    label,
    caption: `${byCategory[slug].length} ${byCategory[slug].length === 1 ? 'style' : 'styles'}`,
    image: CATEGORY_IMAGES[slug],
  }));

  return { columns, features };
}
