import { PageHead } from '@/components/admin/PageHead';
import { MediaManager } from '@/components/admin/MediaManager';
import { requireAdminPage } from '@/lib/auth/guards';
import { listMediaSlots } from '@/lib/services/site-media';

/**
 * The storefront's photography.
 *
 * Every slot here is a position in a layout that was composed by hand, so the
 * set is fixed and what changes is the picture inside it. A slot showing
 * "Original" has never been touched and is reading the manifest the site
 * shipped with; saving one writes a row, and resetting deletes it.
 */
export default async function AdminMediaPage() {
  await requireAdminPage('media:read');

  const library = await listMediaSlots();

  return (
    <>
      <PageHead
        title="Media"
        sub="The photography the storefront is built from — the campaign carousel, the category tiles, and the editorial frames. Product photography lives on each product."
      />

      <MediaManager library={library} />
    </>
  );
}
