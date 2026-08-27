import { notFound } from 'next/navigation';
import { listPublishedProducts } from '@/lib/services/products';
import { productFilterSchema } from '@/lib/validation/catalogue';
import { shoppableCategories } from '@/lib/shop/menu.server';
import { ShopBrowser } from '@/components/shop/ShopBrowser';

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
  // out" rather than "that page does not exist". The set of real categories is
  // now a database question, so a new one is navigable the moment it is
  // created rather than the next time this file is edited.
  if (categorySlug) {
    const categories = await shoppableCategories();
    if (!categories.some((entry) => entry.slug === categorySlug)) notFound();
  }

  const filter = productFilterSchema.parse(rawSearch);
  const products = await listPublishedProducts(filter, categorySlug);

  // The filter options describe the category, not the current result set —
  // otherwise filtering to XXL removes every other size from the list and the
  // shopper cannot get back without editing the URL.
  const all = await listPublishedProducts(
    { sizes: [], colors: [], sort: 'newest', q: '', minPrice: null, maxPrice: null },
    categorySlug,
  );

  const sizes = [...new Set(all.flatMap((product) => product.sizes))];
  const colors = [...new Set(all.flatMap((product) => product.colors))];
  const prices = all.map((product) => product.minPriceCents / 100);
  const priceFloor = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const priceCeiling = prices.length ? Math.ceil(Math.max(...prices)) : 0;

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

        <ShopBrowser
          products={products}
          filter={filter}
          sizes={sizes}
          colors={colors}
          priceFloor={priceFloor}
          priceCeiling={priceCeiling}
          basePath={basePath}
          focusSearch={rawSearch?.focus === 'search'}
        />
      </div>
    </div>
  );
}
