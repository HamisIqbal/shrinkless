import { notFound } from 'next/navigation';
import { FulfillmentPanel } from '@/components/admin/FulfillmentPanel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { getOrderById } from '@/lib/services/orders';

export default async function AdminOrderPage({ params }: PageProps<'/admin/orders/[id]'>) {
  await requireAdminPage();

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <section>
      <h1>{order.orderNumber}</h1>
      <StatusBadge status={order.status} />
      <p>{order.email}</p>

      <h2>Items</h2>
      <ul>
        {order.items.map((item) => (
          <li key={item.sku}>
            {item.title} — {item.size} / {item.color} × {item.quantity} ={' '}
            {formatCents(item.unitPriceCents * item.quantity)}
          </li>
        ))}
      </ul>

      <h2>Totals</h2>
      <dl>
        <dt>Subtotal</dt><dd>{formatCents(order.subtotalCents)}</dd>
        <dt>Shipping</dt><dd>{formatCents(order.shippingCents)}</dd>
        <dt>Tax</dt><dd>{formatCents(order.taxCents)}</dd>
        <dt>Total</dt><dd>{formatCents(order.totalCents)}</dd>
      </dl>

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
      />

      <h2>History</h2>
      <ol>
        {order.statusHistory.map((event, index) => (
          <li key={`${event.status}-${index}`}>
            {event.status} — {event.actor} — {new Date(event.at).toLocaleString('en-US')}
          </li>
        ))}
      </ol>

      <h2>Refunds</h2>
      {/* Spec §7.4: refunds are handled in the provider dashboard, not in-app. */}
      <p>
        Issue refunds in the provider dashboard:{' '}
        <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noreferrer">Stripe</a>
        {' · '}
        <a href="https://www.paypal.com/activity" target="_blank" rel="noreferrer">PayPal</a>
      </p>
    </section>
  );
}
