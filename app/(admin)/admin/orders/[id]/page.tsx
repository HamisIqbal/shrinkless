import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FulfillmentPanel } from '@/components/admin/FulfillmentPanel';
import { NotesPanel } from '@/components/admin/NotesPanel';
import { RefundPanel } from '@/components/admin/RefundPanel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { getOrderById } from '@/lib/services/orders';
import { addOrderNoteAction } from '@/app/actions/admin/orders';

export default async function AdminOrderPage({ params }: PageProps<'/admin/orders/[id]'>) {
  await requireAdminPage('orders:read');

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const refundable = order.totalCents - order.refundedCents;

  return (
    <section>
      <h1>{order.orderNumber}</h1>
      <StatusBadge status={order.status} />
      <p>
        {order.userId ? (
          <Link href={`/admin/customers/${order.userId}`}>{order.email}</Link>
        ) : (
          <>{order.email} (guest)</>
        )}
      </p>

      <h2>Items</h2>
      <ul>
        {order.items.map((item) => (
          <li key={item.sku}>
            {item.title} — {item.size} / {item.color} × {item.quantity} ={' '}
            {formatCents(item.unitPriceCents * item.quantity)}
            <br />
            <small>{item.sku}</small>
          </li>
        ))}
      </ul>

      <h2>Totals</h2>
      <dl>
        <dt>Subtotal</dt><dd>{formatCents(order.subtotalCents)}</dd>

        {order.discountCents > 0 ? (
          <>
            <dt>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</dt>
            <dd>−{formatCents(order.discountCents)}</dd>
          </>
        ) : null}

        <dt>Shipping{order.shippingMethodName ? ` (${order.shippingMethodName})` : ''}</dt>
        <dd>{formatCents(order.shippingCents)}</dd>

        <dt>Tax</dt><dd>{formatCents(order.taxCents)}</dd>
        <dt>Total</dt><dd>{formatCents(order.totalCents)}</dd>

        {order.refundedCents > 0 ? (
          <>
            <dt>Refunded</dt><dd>−{formatCents(order.refundedCents)}</dd>
          </>
        ) : null}
      </dl>

      <h2>Payments</h2>
      {order.payments.length ? (
        <ul>
          {order.payments.map((payment) => (
            <li key={payment.id}>
              {payment.provider} — {payment.status} — {formatCents(payment.amountCents)}
              {payment.brand ? ` — ${payment.brand} ••••${payment.last4}` : ''}
              <br />
              <small>
                {payment.providerPaymentId} — {new Date(payment.at).toLocaleString('en-US')}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          No payment recorded. Payment rows are written by the provider&rsquo;s
          webhook; none is wired up on this store yet.
        </p>
      )}

      <h2>Ship to</h2>
      <address>
        {order.shippingAddress.name}<br />
        {order.shippingAddress.line1}<br />
        {order.shippingAddress.line2 ? <>{order.shippingAddress.line2}<br /></> : null}
        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
        {order.shippingAddress.country}
      </address>

      <FulfillmentPanel
        orderId={order.id}
        status={order.status}
        trackingNumber={order.trackingNumber}
        allowed={order.allowedTransitions}
      />

      <RefundPanel orderId={order.id} refundableCents={refundable} status={order.status} />

      <NotesPanel id={order.id} notes={order.notes} action={addOrderNoteAction} />

      <h2>History</h2>
      <ol>
        {order.statusHistory.map((event, index) => (
          <li key={`${event.status}-${index}`}>
            {event.status} — {event.actor} — {new Date(event.at).toLocaleString('en-US')}
            {event.note ? <> — {event.note}</> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
