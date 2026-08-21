import { connectToDatabase } from '@/lib/db/connection';
import { Order } from '@/lib/db/models/order';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';
import type { AdminStatsDTO, OrderStatus } from '@/types/dto';

const REVENUE_STATUSES: OrderStatus[] = ['paid', 'shipped', 'delivered'];
const LOW_STOCK_THRESHOLD = 3;

export async function getAdminStats(now: Date = new Date()): Promise<AdminStatsDTO> {
  await connectToDatabase();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfToday } });

  const weekOrders = await Order.find({
    createdAt: { $gte: startOfWeek },
    status: { $in: REVENUE_STATUSES },
  }).select('totalCents').lean();

  const lowVariants = await Variant.find({ enabled: true, stock: { $lte: LOW_STOCK_THRESHOLD } })
    .sort({ stock: 1 })
    .limit(20)
    .lean();

  const products = await Product.find({ _id: { $in: lowVariants.map((variant) => variant.productId) } })
    .select('title')
    .lean();
  const titleById = new Map(products.map((product) => [String(product._id), product.title]));

  return {
    ordersToday,
    revenueWeekCents: weekOrders.reduce((sum, order) => sum + order.totalCents, 0),
    lowStock: lowVariants.map((variant) => ({
      sku: variant.sku,
      title: titleById.get(String(variant.productId)) ?? 'Unknown product',
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
    })),
  };
}
