import Link from 'next/link';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { listCustomers } from '@/lib/services/users';
import type { CustomerRowDTO } from '@/types/dto';

const columns: Column<CustomerRowDTO>[] = [
  { key: 'email', header: 'Email', cell: (row) => <Link href={`/admin/customers/${row.id}`}>{row.email}</Link> },
  { key: 'name', header: 'Name', cell: (row) => row.name || '—' },
  { key: 'role', header: 'Role', cell: (row) => row.role },
  { key: 'orders', header: 'Orders', cell: (row) => row.orderCount },
  { key: 'lifetime', header: 'Lifetime', cell: (row) => formatCents(row.lifetimeCents) },
];

export default async function AdminCustomersPage() {
  await requireAdminPage();
  const rows = await listCustomers();

  return (
    <section>
      <h1>Customers</h1>
      <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} empty="No customers yet." />
    </section>
  );
}
