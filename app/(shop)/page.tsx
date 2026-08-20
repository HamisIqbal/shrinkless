import Link from 'next/link';
import { listPublishedProducts } from '@/lib/services/products';
import { ProductCard } from '@/components/shop/ProductCard';

export default async function HomePage() {
  const products = await listPublishedProducts({ sizes: [], colors: [], sort: 'newest' });
  const featured = products.slice(0, 3);

  return (
    <div>
      <section aria-labelledby="hero-heading">
        <h1 id="hero-heading">Shirts, cut for everyday wear.</h1>
        <p>Heavyweight cotton. Made to be worn, washed, and worn again.</p>
        <Link href="/shop">Shop all</Link>
      </section>

      <section aria-labelledby="featured-heading">
        <h2 id="featured-heading">Featured</h2>
        {featured.length === 0 ? (
          <p>Nothing in stock yet.</p>
        ) : (
          <ul>
            {featured.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
