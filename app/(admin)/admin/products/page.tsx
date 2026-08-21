import Link from 'next/link';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireAdminPage } from '@/lib/auth/guards';
import { listProductsForAdmin } from '@/lib/services/products';
import type { AdminProductRowDTO } from '@/types/dto';

const columns: Column<AdminProductRowDTO>[] = [
  { key: 'title', header: 'Title', cell: (row) => <Link href={`/admin/products/${row.id}`}>{row.title}</Link> },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  { key: 'variants', header: 'Variants', cell: (row) => row.variantCount },
  { key: 'stock', header: 'Total stock', cell: (row) => row.totalStock },
];

export default async function AdminProductsPage() {
  await requireAdminPage();
  const rows = await listProductsForAdmin();

  return (
    <section>
      <h1>Products</h1>
      <Link href="/admin/products/new">New product</Link>
      <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} empty="No products yet." />
    </section>
  );
}
