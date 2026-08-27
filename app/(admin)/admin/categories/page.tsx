import { CategoryManager } from '@/components/admin/CategoryManager';
import { requireAdminPage } from '@/lib/auth/guards';
import { listCategories } from '@/lib/services/categories';
import { listUsedCategorySlugs } from '@/lib/services/products';

export default async function AdminCategoriesPage() {
  await requireAdminPage('categories:read');

  const [categories, usedSlugs] = await Promise.all([
    listCategories({ includeArchived: true }),
    listUsedCategorySlugs(),
  ]);

  // Slugs products already use that have no category document yet. Shown so
  // the gap is visible rather than silently mysterious.
  const known = new Set(categories.map((category) => category.slug));
  const orphans = usedSlugs.filter((slug) => !known.has(slug));

  return (
    <section>
      <h1>Categories</h1>
      <p>
        Products belong to a category by slug. Renaming a slug moves every
        product with it; archiving one is refused while it still holds products.
      </p>

      <CategoryManager categories={categories} orphanSlugs={orphans} />
    </section>
  );
}
