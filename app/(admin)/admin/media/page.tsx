import { PageHead } from '@/components/admin/PageHead';
import { MediaManager } from '@/components/admin/MediaManager';
import { requireAdminPage } from '@/lib/auth/guards';
import { listMediaPages } from '@/lib/services/site-media';

/**
 * The storefront's photography, edited where it appears.
 *
 * Every slot here is a position in a layout that was composed by hand, so the
 * set is fixed and what changes is the picture inside it. A slot showing
 * "Original" has never been touched and is reading the manifest the site
 * shipped with; saving one writes a row, and restoring deletes it.
 *
 * The pages, their sections and the slots in them all come from
 * `lib/services/site-media.ts` — the same registry the storefront renders
 * from — so a page here cannot show a frame the site does not have.
 */
export default async function AdminMediaPage() {
  await requireAdminPage('media:read');

  const pages = await listMediaPages();

  return (
    <>
      <PageHead
        title="Media"
        sub="The photography the storefront is built from. Choose a page, then click a photograph on it to replace or re-crop it. Product photography lives on each product."
      />

      <MediaManager pages={pages} />
    </>
  );
}
