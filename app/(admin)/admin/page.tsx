import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { getAdminStats } from '@/lib/services/stats';

/**
 * The dashboard's data layer is the point of this page, not its layout.
 *
 * Every figure below comes from an aggregation or an indexed count — nothing
 * loads a collection to reduce it in JavaScript, and nothing is calculated in
 * the browser. The visual pass comes next; the numbers are already true.
 */
export default async function AdminDashboardPage() {
  await requireAdminPage('dashboard:read');

  const stats = await getAdminStats();

  return (
    <section>
      <h1>Dashboard</h1>

      <h2>Revenue</h2>
      <dl>
        <dt>Today</dt><dd>{formatCents(stats.revenueTodayCents)}</dd>
        <dt>Last 7 days</dt><dd>{formatCents(stats.revenueWeekCents)}</dd>
        <dt>This month</dt><dd>{formatCents(stats.revenueMonthCents)}</dd>
        <dt>All time</dt><dd>{formatCents(stats.revenueTotalCents)}</dd>
        <dt>Average order</dt><dd>{formatCents(stats.averageOrderCents)}</dd>
      </dl>

      <h2>Orders</h2>
      <dl>
        <dt>Today</dt><dd>{stats.ordersToday}</dd>
        <dt>Pending</dt><dd>{stats.ordersPending}</dd>
        <dt>Delivered</dt><dd>{stats.ordersCompleted}</dd>
        <dt>Cancelled or failed</dt><dd>{stats.ordersCancelled}</dd>
        <dt>All time</dt><dd>{stats.ordersTotal}</dd>
      </dl>

      <h2>Customers</h2>
      <dl>
        <dt>Total</dt><dd>{stats.customersTotal}</dd>
        <dt>New this month</dt><dd>{stats.customersNewThisMonth}</dd>
      </dl>

      <h2>Stock</h2>
      <dl>
        <dt>Low</dt><dd>{stats.lowStockCount}</dd>
        <dt>Out</dt><dd>{stats.outOfStockCount}</dd>
      </dl>

      {stats.lowStock.length ? (
        <ul>
          {stats.lowStock.map((row) => (
            <li key={row.sku}>
              {row.title} — {row.size} / {row.color} — {row.stock} left
            </li>
          ))}
        </ul>
      ) : (
        <p>Nothing is running low.</p>
      )}

      <h2>Best sellers</h2>
      {stats.bestSellers.length ? (
        <ul>
          {stats.bestSellers.map((row) => (
            <li key={row.title}>
              {row.title} — {row.unitsSold} sold — {formatCents(row.revenueCents)}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nothing has sold yet.</p>
      )}

      <h2>Recent orders</h2>
      {stats.recentOrders.length ? (
        <ul>
          {stats.recentOrders.map((order) => (
            <li key={order.id}>
              <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>{' '}
              — {order.status} — {formatCents(order.totalCents)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No orders yet.</p>
      )}

      <p>
        <Link href="/admin/orders">All orders</Link>{' · '}
        <Link href="/admin/inventory">Inventory</Link>
      </p>
    </section>
  );
}
