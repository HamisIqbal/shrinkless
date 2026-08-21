import Image from 'next/image';
import Link from 'next/link';
import { cloudinaryUrl } from '@/lib/cloudinary/url';
import { formatCents } from '@/lib/money';
import type { ProductDTO } from '@/types/dto';

export function ProductCard({ product }: { product: ProductDTO }) {
  const soldOut = product.variants.every((variant) => !variant.inStock);
  const image = product.images[0];

  return (
    <article className="card">
      <Link href={`/product/${product.slug}`} className="card__plate">
        {image ? (
          <Image
            src={cloudinaryUrl(image.publicId, 'c_fill,w_800,h_1000,q_auto,f_auto')}
            alt={image.alt || product.title}
            width={800}
            height={1000}
            className="card__image"
          />
        ) : (
          // No photography yet. Rather than a broken frame, the plate prints
          // the colourway list — the same information the photo would carry.
          <span className="card__unset" aria-hidden="true">
            {product.colors.length ? product.colors.join(' · ') : 'No image'}
          </span>
        )}
        {soldOut ? <span className="card__flag tag tag--sold">Sold out</span> : null}
      </Link>

      <div className="card__foot">
        <h3 className="card__title">
          <Link href={`/product/${product.slug}`}>{product.title}</Link>
        </h3>
        <p className="price tnum">{formatCents(product.minPriceCents)}</p>
      </div>

      <p className="meta card__run">
        {product.sizes.length ? product.sizes.map((size) => size.toUpperCase()).join(' ') : '—'}
      </p>
    </article>
  );
}
