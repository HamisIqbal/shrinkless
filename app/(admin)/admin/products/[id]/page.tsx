import { notFound } from 'next/navigation';
import { ProductEditor } from '@/components/admin/ProductEditor';
import { requireAdminPage } from '@/lib/auth/guards';
import { getProductForAdmin } from '@/lib/services/products';

export default async function EditProductPage({ params }: PageProps<'/admin/products/[id]'>) {
  await requireAdminPage('products:write');

  const { id } = await params;
  const product = await getProductForAdmin(id);
  if (!product) notFound();

  return (
    <section>
      <h1>{product.title}</h1>
      <ProductEditor product={product} />
    </section>
  );
}
