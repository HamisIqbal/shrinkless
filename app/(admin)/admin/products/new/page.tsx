import { ProductEditor } from '@/components/admin/ProductEditor';
import { requireAdminPage } from '@/lib/auth/guards';

export default async function NewProductPage() {
  await requireAdminPage();

  return (
    <section>
      <h1>New product</h1>
      <ProductEditor product={null} />
    </section>
  );
}
