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
      <h1>{categorySlug ? `Shop: ${categorySlug}` : 'Shop all'}</h1>

      <FilterBar
        filter={filter}
        sizes={allSizes}
        colors={allColors}
        basePath={categorySlug ? `/shop/${categorySlug}` : '/shop'}
      />

      <p aria-live="polite">
        {products.length} {products.length === 1 ? 'product' : 'products'}
      </p>

      {products.length === 0 ? (
        <p>Nothing matches those filters.</p>
      ) : (
        <ul>
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
