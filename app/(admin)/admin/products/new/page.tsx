import Link from 'next/link';
import { PageHead } from '@/components/admin/PageHead';
import { ProductEditor } from '@/components/admin/ProductEditor';
import { requireAdminPage } from '@/lib/auth/guards';

export default async function NewProductPage() {
  await requireAdminPage('products:write');

  return (
    <>
      <PageHead
        title="New product"
        sub="It stays a draft until you publish it, so there is no rush to finish in one sitting."
        actions={<Link href="/admin/products" className="abtn abtn--ghost">Cancel</Link>}
      />

      <ProductEditor product={null} />
    </>
  );
}
