import { listPublishedProducts } from '@/lib/services/products';
import { productFilterSchema } from '@/lib/validation/catalogue';
import { toColorways } from '@/lib/shop/colorways';
import { CollectionTile } from '@/components/shop/CollectionTile';
import { FilterBar } from '@/components/shop/FilterBar';

export const metadata = { title: 'Shop' };

export default async function ShopPage(props: PageProps<'/shop/[[...category]]'>) {
  const [{ category }, rawSearch] = await Promise.all([props.params, props.searchParams]);

  const categorySlug = category?.[0];
  const filter = productFilterSchema.parse(rawSearch);
  const products = await listPublishedProducts(filter, categorySlug);

  const sizes = [...new Set(products.flatMap((product) => product.sizes))];
  const colors = [...new Set(products.flatMap((product) => product.colors))];
  const basePath = categorySlug ? `/shop/${categorySlug}` : '/shop';

  // The catalogue is one tee in three colours, so the grid shows colourways —
  // that is the choice the customer is actually making.
  const tiles = products.flatMap((product) =>
    toColorways(product).map((colorway) => ({ product, colorway })),
  );

  return (
    <div className="band band--tight shoppage">
      <div className="wrap">
        <header className="shoppage__head">
          <p className="eyebrow">Catalogue</p>
          <h1 className="head">{categorySlug ?? 'Shop all'}</h1>
        </header>

        <FilterBar
          filter={filter}
          sizes={sizes}
          colors={colors}
          basePath={basePath}
          focusSearch={rawSearch?.focus === 'search'}
        />

        <p className="meta shoppage__count tnum">
          {tiles.length} {tiles.length === 1 ? 'style' : 'styles'}
        </p>

        {tiles.length === 0 ? (
          <p className="lede shoppage__empty">
            Nothing matches that. Clear a filter and try again.
          </p>
        ) : (
          <ul className="collection__grid">
            {tiles.map(({ product, colorway }) => (
              <li key={`${product.id}-${colorway.color}`}>
                <CollectionTile
                  slug={product.slug}
                  title={product.title}
                  color={colorway.color}
                  priceCents={colorway.priceCents}
                  image={colorway.image}
                  variants={colorway.variants}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
