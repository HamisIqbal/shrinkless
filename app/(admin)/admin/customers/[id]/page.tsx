import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { getCustomerDetail } from '@/lib/services/users';

export default async function AdminCustomerPage({ params }: PageProps<'/admin/customers/[id]'>) {
  await requireAdminPage();

  const { id } = await params;
  const detail = await getCustomerDetail(id);
  if (!detail) notFound();

  return (
    <section>
      <h1>{detail.customer.email}</h1>
      <dl>
        <dt>Name</dt><dd>{detail.customer.name || '—'}</dd>
        <dt>Role</dt><dd>{detail.customer.role}</dd>
        <dt>Lifetime value</dt><dd>{formatCents(detail.customer.lifetimeCents)}</dd>
      </dl>

      <h2>Orders</h2>
      {detail.orders.length ? (
        <ul>
          {detail.orders.map((order) => (
            <li key={order.id}>
              <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>{' '}
              — {order.status} — {formatCents(order.totalCents)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No orders yet.</p>
      )}
    </section>
  );
}
