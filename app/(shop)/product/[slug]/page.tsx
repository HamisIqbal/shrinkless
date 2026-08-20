import { notFound } from 'next/navigation';
import { getPublishedProductBySlug } from '@/lib/services/products';
import { VariantPicker } from '@/components/shop/VariantPicker';
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
    <article>
      <h1>{product.title}</h1>
      <p>From {formatCents(product.minPriceCents)}</p>
      <p>{product.description}</p>

      <VariantPicker
        sizes={product.sizes}
        colors={product.colors}
        variants={product.variants}
      />
    </article>
  );
}
