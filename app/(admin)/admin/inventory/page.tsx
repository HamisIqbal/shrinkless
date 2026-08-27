import Link from 'next/link';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ListControls, Pagination } from '@/components/admin/ListControls';
import { StockCell } from '@/components/admin/StockCell';
import { requireAdminPage } from '@/lib/auth/guards';
import { parseListParams } from '@/lib/admin/query';
import { INVENTORY_FILTERS, INVENTORY_SORTS, listInventory } from '@/lib/services/inventory';
import type { InventoryRowDTO } from '@/types/dto';

const STATE_LABEL: Record<InventoryRowDTO['state'], string> = {
  in_stock: 'In stock',
  low: 'Low',
  out: 'Out',
};

const columns: Column<InventoryRowDTO>[] = [
  {
    key: 'sku',
    header: 'SKU',
    cell: (row) => <Link href={`/admin/inventory/${row.variantId}`}>{row.sku}</Link>,
  },
  {
    key: 'product',
    header: 'Product',
    cell: (row) => (
      <>
        <Link href={`/admin/products/${row.productId}`}>{row.productTitle}</Link>
        {' — '}
        {row.size} / {row.color}
      </>
    ),
  },
  { key: 'state', header: 'State', cell: (row) => STATE_LABEL[row.state] },
  { key: 'threshold', header: 'Low at', cell: (row) => row.threshold },
  {
    key: 'stock',
    header: 'Stock',
    cell: (row) => <StockCell variantId={row.variantId} stock={row.stock} sku={row.sku} />,
  },
];

export default async function AdminInventoryPage(props: PageProps<'/admin/inventory'>) {
  await requireAdminPage('inventory:read');

  const params = parseListParams(await props.searchParams, {
    sorts: INVENTORY_SORTS,
    filters: INVENTORY_FILTERS,
    defaultDirection: 'asc',
  });

  const page = await listInventory(params);

  return (
    <section>
      <h1>Inventory</h1>
      <p>
        Every movement is recorded against the variant. Click a SKU for its
        history.
      </p>

      <ListControls
        action="/admin/inventory"
        params={params}
        searchPlaceholder="SKU"
        filters={[
          {
            name: 'state',
            label: 'State',
            options: [
              { value: 'out', label: 'Out of stock' },
              { value: 'low', label: 'Low' },
              { value: 'in_stock', label: 'In stock' },
            ],
          },
        ]}
        sorts={[
          { value: 'stock', label: 'Stock' },
          { value: 'sku', label: 'SKU' },
          { value: 'updatedAt', label: 'Last changed' },
        ]}
      />

      <DataTable
        columns={columns}
        rows={page.rows}
        rowKey={(row) => row.variantId}
        empty="No variants match."
      />

      <Pagination action="/admin/inventory" page={page} />
    </section>
  );
}
