import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Types } from 'mongoose';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Pagination } from '@/components/admin/ListControls';
import { StockTakePanel } from '@/components/admin/StockTakePanel';
import { requireAdminPage } from '@/lib/auth/guards';
import { parseListParams } from '@/lib/admin/query';
import { connectToDatabase } from '@/lib/db/connection';
import { Variant } from '@/lib/db/models/variant';
import { Product } from '@/lib/db/models/product';
import { defaultLowStockThreshold, listAdjustments, stockStateFor } from '@/lib/services/inventory';
import type { InventoryAdjustmentDTO } from '@/types/dto';

const columns: Column<InventoryAdjustmentDTO>[] = [
  { key: 'at', header: 'When', cell: (row) => new Date(row.at).toLocaleString('en-US') },
  {
    key: 'delta',
    header: 'Change',
    cell: (row) => (row.delta > 0 ? `+${row.delta}` : String(row.delta)),
  },
  { key: 'result', header: 'Left', cell: (row) => row.resultingStock },
  { key: 'reason', header: 'Reason', cell: (row) => row.reason },
  { key: 'who', header: 'By', cell: (row) => row.actorEmail },
  {
    key: 'note',
    header: 'Note',
    cell: (row) =>
      row.orderId ? <Link href={`/admin/orders/${row.orderId}`}>{row.note || 'Order'}</Link> : row.note || '—',
  },
];

export default async function AdminVariantPage(props: PageProps<'/admin/inventory/[id]'>) {
  await requireAdminPage('inventory:read');

  const { id } = await props.params;
  if (!Types.ObjectId.isValid(id)) notFound();

  await connectToDatabase();

  const variant = await Variant.findById(id).lean();
  if (!variant) notFound();

  const [product, threshold, page] = await Promise.all([
    Product.findById(variant.productId).select('title').lean(),
    defaultLowStockThreshold(),
    listAdjustments(
      id,
      parseListParams(await props.searchParams, { sorts: ['createdAt'], filters: [] }),
    ),
  ]);

  const effective = variant.lowStockThreshold ?? threshold;

  return (
    <section>
      <h1>{variant.sku}</h1>
      <p>
        {product?.title ?? 'Unknown product'} — {variant.size} / {variant.color}
      </p>

      <dl>
        <dt>In stock</dt>
        <dd>{variant.stock}</dd>
        <dt>State</dt>
        <dd>{stockStateFor(variant.stock, effective)}</dd>
        <dt>Low at</dt>
        <dd>
          {effective}
          {variant.lowStockThreshold === null ? ' (store default)' : ' (override)'}
        </dd>
      </dl>

      <StockTakePanel
        variantId={String(variant._id)}
        stock={variant.stock}
        threshold={variant.lowStockThreshold ?? null}
      />

      <h2>History</h2>
      <DataTable
        columns={columns}
        rows={page.rows}
        rowKey={(row) => row.id}
        empty="No movements recorded yet."
      />
      <Pagination action={`/admin/inventory/${id}`} page={page} />
    </section>
  );
}
