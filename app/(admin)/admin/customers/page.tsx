import Link from 'next/link';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ListControls, Pagination } from '@/components/admin/ListControls';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { parseListParams } from '@/lib/admin/query';
import { CUSTOMER_FILTERS, CUSTOMER_SORTS, listCustomersPaged } from '@/lib/services/users';
import type { CustomerRowDTO } from '@/types/dto';

const columns: Column<CustomerRowDTO>[] = [
  { key: 'email', header: 'Email', cell: (row) => <Link href={`/admin/customers/${row.id}`}>{row.email}</Link> },
  { key: 'name', header: 'Name', cell: (row) => row.name || '—' },
  { key: 'role', header: 'Role', cell: (row) => row.role },
  { key: 'orders', header: 'Orders', cell: (row) => row.orderCount },
  { key: 'lifetime', header: 'Lifetime', cell: (row) => formatCents(row.lifetimeCents) },
  {
    key: 'last',
    header: 'Last order',
    cell: (row) => (row.lastOrderAt ? new Date(row.lastOrderAt).toLocaleDateString('en-US') : '—'),
  },
];

export default async function AdminCustomersPage(props: PageProps<'/admin/customers'>) {
  await requireAdminPage('customers:read');

  const params = parseListParams(await props.searchParams, {
    sorts: CUSTOMER_SORTS,
    filters: CUSTOMER_FILTERS,
  });

  const page = await listCustomersPaged(params);

  return (
    <section>
      <h1>Customers</h1>

      <ListControls
        action="/admin/customers"
        params={params}
        searchPlaceholder="Email or name"
        filters={[
          {
            name: 'role',
            label: 'Role',
            options: [
              { value: 'customer', label: 'Customers' },
              { value: 'admin', label: 'Admins' },
            ],
          },
          {
            name: 'hasOrders',
            label: 'Ordered',
            options: [{ value: 'true', label: 'Has ordered' }],
          },
        ]}
        sorts={[
          { value: 'createdAt', label: 'Joined' },
          { value: 'email', label: 'Email' },
          { value: 'name', label: 'Name' },
        ]}
      />

      <DataTable
        columns={columns}
        rows={page.rows}
        rowKey={(row) => row.id}
        empty={params.q ? `No customers match “${params.q}”.` : 'No customers yet.'}
      />

      <Pagination action="/admin/customers" page={page} />
    </section>
  );
}
