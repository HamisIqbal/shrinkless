import { describe, expect, it } from 'vitest';
import { Order } from '@/lib/db/models/order';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';
import { getAdminStats } from '@/lib/services/stats';
import { withTestDatabase } from '@/tests/setup/db';
import type { OrderStatus } from '@/types/dto';

withTestDatabase();

const NOW = new Date('2026-08-21T12:00:00.000Z');

async function seedOrder(
  orderNumber: string,
  status: OrderStatus,
  totalCents: number,
  createdAt: Date,
) {
  const order = await Order.create({
    orderNumber, email: 'buyer@example.com',
    items: [{ title: 'Field Tee', size: 's', color: 'sand', sku: 'S1', unitPriceCents: totalCents, quantity: 1 }],
    shippingAddress: { name: 'A', line1: '1', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US' },
    subtotalCents: totalCents, shippingCents: 0, taxCents: 0, totalCents, status,
  });

  // timestamps:true stamps createdAt on insert, so backdate it afterwards.
  await Order.updateOne({ _id: order._id }, { $set: { createdAt } });
  return order;
}

describe('getAdminStats', () => {
  it('counts orders placed today', async () => {
    await seedOrder('SL-1', 'paid', 4200, new Date('2026-08-21T11:00:00.000Z'));
    await seedOrder('SL-2', 'paid', 4200, new Date('2026-08-19T01:00:00.000Z'));

    const stats = await getAdminStats(NOW);

    expect(stats.ordersToday).toBe(1);
  });

  it('sums the trailing week of revenue, excluding cancelled orders', async () => {
    await seedOrder('SL-1', 'paid', 4200, new Date('2026-08-20T01:00:00.000Z'));
    await seedOrder('SL-2', 'cancelled', 9900, new Date('2026-08-20T01:00:00.000Z'));
    await seedOrder('SL-3', 'delivered', 1000, new Date('2026-08-01T01:00:00.000Z'));

    const stats = await getAdminStats(NOW);

    expect(stats.revenueWeekCents).toBe(4200);
  });

  it('lists enabled low-stock variants, lowest first', async () => {
    const product = await Product.create({ title: 'Field Tee', slug: 'field-tee', category: 'tees' });
    await Variant.create([
      { productId: product._id, size: 's', color: 'sand', sku: 'A', priceCents: 4200, stock: 2 },
      { productId: product._id, size: 'm', color: 'sand', sku: 'B', priceCents: 4200, stock: 0 },
      { productId: product._id, size: 'l', color: 'sand', sku: 'C', priceCents: 4200, stock: 50 },
      { productId: product._id, size: 'xl', color: 'sand', sku: 'D', priceCents: 4200, stock: 1, enabled: false },
    ]);

    const stats = await getAdminStats(NOW);

    expect(stats.lowStock.map((row) => row.sku)).toEqual(['B', 'A']);
    expect(stats.lowStock[0].title).toBe('Field Tee');
  });

  it('returns zeroes on an empty store', async () => {
    expect(await getAdminStats(NOW)).toEqual({ ordersToday: 0, revenueWeekCents: 0, lowStock: [] });
  });
});
