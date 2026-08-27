import Link from 'next/link';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ListControls, Pagination } from '@/components/admin/ListControls';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { parseListParams } from '@/lib/admin/query';
import { ORDER_FILTERS, ORDER_SORTS, listOrdersPaged } from '@/lib/services/orders';
import type { OrderRowDTO } from '@/types/dto';

const columns: Column<OrderRowDTO>[] = [
  { key: 'number', header: 'Order', cell: (row) => <Link href={`/admin/orders/${row.id}`}>{row.orderNumber}</Link> },
  { key: 'email', header: 'Customer', cell: (row) => row.email },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  { key: 'items', header: 'Items', cell: (row) => row.itemCount },
  { key: 'total', header: 'Total', cell: (row) => formatCents(row.totalCents) },
  { key: 'placed', header: 'Placed', cell: (row) => new Date(row.createdAt).toLocaleDateString('en-US') },
];

export default async function AdminOrdersPage(props: PageProps<'/admin/orders'>) {
  await requireAdminPage('orders:read');

  const params = parseListParams(await props.searchParams, {
    sorts: ORDER_SORTS,
    filters: ORDER_FILTERS,
  });

  const page = await listOrdersPaged(params);

  return (
    <section>
      <h1>Orders</h1>

      <ListControls
        action="/admin/orders"
        params={params}
        searchPlaceholder="Order number, email or SKU"
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'payment_failed', label: 'Payment failed' },
            ],
          },
        ]}
        sorts={[
          { value: 'createdAt', label: 'Placed' },
          { value: 'totalCents', label: 'Total' },
          { value: 'orderNumber', label: 'Order number' },
          { value: 'status', label: 'Status' },
        ]}
      />

      <DataTable
        columns={columns}
        rows={page.rows}
        rowKey={(row) => row.id}
        empty={params.q ? `No orders match “${params.q}”.` : 'No orders yet.'}
      />

      <Pagination action="/admin/orders" page={page} />
    </section>
  );
}
