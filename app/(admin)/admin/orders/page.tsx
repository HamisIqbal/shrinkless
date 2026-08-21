import Link from 'next/link';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { listOrders } from '@/lib/services/orders';
import type { OrderRowDTO } from '@/types/dto';

const columns: Column<OrderRowDTO>[] = [
  { key: 'number', header: 'Order', cell: (row) => <Link href={`/admin/orders/${row.id}`}>{row.orderNumber}</Link> },
  { key: 'email', header: 'Customer', cell: (row) => row.email },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  { key: 'items', header: 'Items', cell: (row) => row.itemCount },
  { key: 'total', header: 'Total', cell: (row) => formatCents(row.totalCents) },
  { key: 'placed', header: 'Placed', cell: (row) => new Date(row.createdAt).toLocaleDateString('en-US') },
];

export default async function AdminOrdersPage() {
  await requireAdminPage();
  const rows = await listOrders();

  return (
    <section>
      <h1>Orders</h1>
      <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} empty="No orders yet." />
    </section>
  );
}
