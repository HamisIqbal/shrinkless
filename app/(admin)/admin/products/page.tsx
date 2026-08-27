import Link from 'next/link';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ListControls, Pagination } from '@/components/admin/ListControls';
import { ProductRowActions } from '@/components/admin/ProductRowActions';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireAdminPage } from '@/lib/auth/guards';
import { formatCents } from '@/lib/money';
import { parseListParams } from '@/lib/admin/query';
import {
  PRODUCT_FILTERS,
  PRODUCT_SORTS,
  listProductsForAdmin,
  listUsedCategorySlugs,
} from '@/lib/services/products';
import type { AdminProductRowDTO } from '@/types/dto';

const columns: Column<AdminProductRowDTO>[] = [
  {
    key: 'title',
    header: 'Title',
    cell: (row) => <Link href={`/admin/products/${row.id}`}>{row.title}</Link>,
  },
  { key: 'category', header: 'Category', cell: (row) => row.category },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  { key: 'price', header: 'From', cell: (row) => formatCents(row.minPriceCents) },
  { key: 'variants', header: 'Variants', cell: (row) => row.variantCount },
  { key: 'stock', header: 'Total stock', cell: (row) => row.totalStock },
  {
    key: 'actions',
    header: 'Actions',
    cell: (row) => (
      <ProductRowActions
        id={row.id}
        status={row.status}
        archived={row.archived}
        title={row.title}
      />
    ),
  },
];

export default async function AdminProductsPage(props: PageProps<'/admin/products'>) {
  await requireAdminPage('products:read');

  const params = parseListParams(await props.searchParams, {
    sorts: PRODUCT_SORTS,
    filters: PRODUCT_FILTERS,
  });

  const [page, categories] = await Promise.all([
    listProductsForAdmin(params),
    listUsedCategorySlugs(),
  ]);

  return (
    <section>
      <h1>Products</h1>
      <Link href="/admin/products/new">New product</Link>

      <ListControls
        action="/admin/products"
        params={params}
        searchPlaceholder="Title, slug, SKU or tag"
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ],
          },
          {
            name: 'category',
            label: 'Category',
            options: categories.map((slug) => ({ value: slug, label: slug })),
          },
          {
            name: 'featured',
            label: 'Featured',
            options: [{ value: 'true', label: 'Featured only' }],
          },
          {
            name: 'archived',
            label: 'Archive',
            options: [{ value: 'true', label: 'Archived only' }],
          },
        ]}
        sorts={[
          { value: 'updatedAt', label: 'Last edited' },
          { value: 'createdAt', label: 'Created' },
          { value: 'title', label: 'Title' },
          { value: 'status', label: 'Status' },
        ]}
      />

      <DataTable
        columns={columns}
        rows={page.rows}
        rowKey={(row) => row.id}
        empty={params.q ? `Nothing matches “${params.q}”.` : 'No products yet.'}
      />

      <Pagination action="/admin/products" page={page} />
    </section>
  );
}
