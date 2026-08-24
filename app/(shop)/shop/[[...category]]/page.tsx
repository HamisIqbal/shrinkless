import { notFound } from 'next/navigation';
import { listPublishedProducts } from '@/lib/services/products';
import { productFilterSchema } from '@/lib/validation/catalogue';
import { SHOPPABLE } from '@/lib/shop/navigation';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { FilterBar } from '@/components/shop/FilterBar';

export const metadata = { title: 'Shop' };

const INTRO: Record<string, { title: string; copy: string }> = {
  men: {
    title: "Men's",
    copy: 'Cut straight through the body with a true crew neck. Garment dyed organic cotton, made in USA.',
  },
  women: {
    title: "Women's",
    copy: 'The same cotton and the same dye process, cut shorter through the body and narrower at the shoulder.',
  },
};

const FALLBACK = {
  title: 'All Products',
  copy: 'Every Shrinkless style, in every colour we currently make it.',
};

export default async function ShopPage(props: PageProps<'/shop/[[...category]]'>) {
  const [{ category }, rawSearch] = await Promise.all([props.params, props.searchParams]);

  const categorySlug = category?.[0];

  // An unknown category used to return an empty grid, which reads as "we sold
  // out" rather than "that page does not exist".
  if (categorySlug && !SHOPPABLE.some((entry) => entry.slug === categorySlug)) {
    notFound();
  }

  const filter = productFilterSchema.parse(rawSearch);
  const products = await listPublishedProducts(filter, categorySlug);

  const sizes = [...new Set(products.flatMap((product) => product.sizes))];
  const colors = [...new Set(products.flatMap((product) => product.colors))];
  const basePath = categorySlug ? `/shop/${categorySlug}` : '/shop';
  const intro = (categorySlug && INTRO[categorySlug]) || FALLBACK;

  return (
    <div className="band band--tight shoppage">
      <div className="wrap">
        <header className="shoppage__head">
          <p className="eyebrow">Collection</p>
          <h1 className="display shoppage__title">{intro.title}</h1>
          <p className="lede shoppage__intro">{intro.copy}</p>
        </header>

        <FilterBar
          filter={filter}
          sizes={sizes}
          colors={colors}
          basePath={basePath}
          focusSearch={rawSearch?.focus === 'search'}
        />

        <p className="meta shoppage__count tnum">
          {products.length} {products.length === 1 ? 'style' : 'styles'}
        </p>

        {products.length === 0 ? (
          <p className="lede shoppage__empty">
            Nothing matches that. Clear a filter and try again.
          </p>
        ) : (
          <ProductGrid products={products} columns={3} />
        )}
      </div>
    </div>
  );
}
