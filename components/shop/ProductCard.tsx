import Link from 'next/link';
import { formatCents } from '@/lib/money';
import type { ProductDTO } from '@/types/dto';

export function ProductCard({ product }: { product: ProductDTO }) {
  const soldOut = product.variants.every((variant) => !variant.inStock);

  return (
    <article>
      <h3>
        <Link href={`/product/${product.slug}`}>{product.title}</Link>
      </h3>
      <p>{formatCents(product.minPriceCents)}</p>
      {soldOut ? <p>Sold out</p> : null}
    </article>
  );
}
