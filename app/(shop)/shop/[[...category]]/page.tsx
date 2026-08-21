import { listPublishedProducts } from '@/lib/services/products';
import { productFilterSchema } from '@/lib/validation/catalogue';
import { ProductCard } from '@/components/shop/ProductCard';
import { FilterBar } from '@/components/shop/FilterBar';

export default async function ShopPage(props: PageProps<'/shop/[[...category]]'>) {
  const [{ category }, rawSearch] = await Promise.all([props.params, props.searchParams]);

  const filter = productFilterSchema.parse(rawSearch);
  const categorySlug = category?.[0];
  const products = await listPublishedProducts(filter, categorySlug);

  const allSizes = [...new Set(products.flatMap((p) => p.sizes))].sort();
  const allColors = [...new Set(products.flatMap((p) => p.colors))].sort();

  return (
    <div>
      <header className="pagehead reveal">
        <p className="eyebrow">Catalogue</p>
        <h1 className="display">{categorySlug ?? 'Shop all'}</h1>
      </header>

      <FilterBar
        filter={filter}
        sizes={allSizes}
        colors={allColors}
        basePath={categorySlug ? `/shop/${categorySlug}` : '/shop'}
      />

      <p aria-live="polite" className="meta tnum resultcount">
        {products.length} {products.length === 1 ? 'product' : 'products'}
      </p>

      {products.length === 0 ? (
        <p className="lede emptystate">
          Nothing matches those filters. Clear one and try again.
        </p>
      ) : (
        <ul className="grid12 reveal-list catalogue">
          {products.map((product) => (
            <li key={product.id} className="cardslot">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
