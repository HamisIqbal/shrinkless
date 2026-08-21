import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { getAdminStats } from '@/lib/services/stats';

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const stats = await getAdminStats();

  return (
    <section>
      <h1>Dashboard</h1>

      <dl>
        <dt>Orders today</dt><dd>{stats.ordersToday}</dd>
        <dt>Revenue, last 7 days</dt><dd>{formatCents(stats.revenueWeekCents)}</dd>
      </dl>

      <h2>Low stock</h2>
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

      <Link href="/admin/orders">All orders</Link>
    </section>
  );
}
