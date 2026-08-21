import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedProductBySlug } from '@/lib/services/products';
import { VariantPicker } from '@/components/shop/VariantPicker';
import { cloudinaryUrl } from '@/lib/cloudinary/url';
import { formatCents } from '@/lib/money';

export async function generateMetadata(props: PageProps<'/product/[slug]'>) {
  const { slug } = await props.params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) return { title: 'Not found' };
  return { title: product.title, description: product.description };
}

export default async function ProductPage(props: PageProps<'/product/[slug]'>) {
  const { slug } = await props.params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) notFound();

  return (
    <article className="pdp">
      <div className="pdp__gallery">
        {product.images.length ? (
          product.images.map((image) => (
            <Image
              key={image.publicId}
              src={cloudinaryUrl(image.publicId, 'c_fill,w_1200,h_1500,q_auto,f_auto')}
              alt={image.alt || product.title}
              width={1200}
              height={1500}
              className="pdp__image"
              priority
            />
          ))
        ) : (
          <div className="pdp__plate" aria-hidden="true">
            <span>{product.colors.join(' · ') || product.title}</span>
          </div>
        )}
      </div>

      <div className="pdp__detail">
        <p className="eyebrow">
          <Link href="/shop">Catalogue</Link> — {product.category}
        </p>

        <h1 className="title pdp__title">{product.title}</h1>

        <p className="price price--lg tnum pdp__from">
          From {formatCents(product.minPriceCents)}
        </p>

        <hr className="rule" />

        <p className="pdp__copy">{product.description}</p>

        <VariantPicker
          sizes={product.sizes}
          colors={product.colors}
          variants={product.variants}
        />
      </div>
    </article>
  );
}
