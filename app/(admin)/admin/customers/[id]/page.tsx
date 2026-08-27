import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NotesPanel } from '@/components/admin/NotesPanel';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { getCustomerDetail } from '@/lib/services/users';
import { addCustomerNoteAction } from '@/app/actions/admin/customers';

export default async function AdminCustomerPage({ params }: PageProps<'/admin/customers/[id]'>) {
  await requireAdminPage('customers:read');

  const { id } = await params;
  const detail = await getCustomerDetail(id);
  if (!detail) notFound();

  const { customer, orders } = detail;

  return (
    <section>
      <h1>{customer.email}</h1>

      <dl>
        <dt>Name</dt><dd>{customer.name || '—'}</dd>
        <dt>Role</dt><dd>{customer.role}</dd>
        <dt>Joined</dt>
        <dd>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US') : '—'}</dd>
        <dt>Orders</dt><dd>{customer.orderCount}</dd>
        <dt>Lifetime value</dt><dd>{formatCents(customer.lifetimeCents)}</dd>
        <dt>Average order</dt><dd>{formatCents(customer.averageOrderCents)}</dd>
        <dt>Last order</dt>
        <dd>
          {customer.lastOrderAt
            ? new Date(customer.lastOrderAt).toLocaleDateString('en-US')
            : '—'}
        </dd>
      </dl>

      {customer.addresses.length ? (
        <>
          <h2>Addresses</h2>
          {customer.addresses.map((address, index) => (
            <address key={index}>
              {address.name}<br />
              {address.line1}<br />
              {address.line2 ? <>{address.line2}<br /></> : null}
              {address.city}, {address.state} {address.postalCode}<br />
              {address.country}
            </address>
          ))}
        </>
      ) : null}

      <h2>Orders</h2>
      {orders.length ? (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>{' '}
              — {order.status} — {formatCents(order.totalCents)} —{' '}
              {new Date(order.createdAt).toLocaleDateString('en-US')}
            </li>
          ))}
        </ul>
      ) : (
        <p>No orders yet.</p>
      )}

      {/* Internal only. Nothing here is ever rendered on a customer-facing
          surface — the customer's own account page reads a different service. */}
      <NotesPanel
        id={customer.id}
        notes={customer.notes}
        action={addCustomerNoteAction}
        heading="Internal notes"
      />
    </section>
  );
}
