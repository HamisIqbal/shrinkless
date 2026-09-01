/**
 * The wholesale line sheet: which styles trade sells, and which retail style
 * each one is built from.
 *
 * Nothing here holds copy, photography, colourways or a price. Every wholesale
 * product BORROWS those from its `source` — a retail style that already exists
 * in the catalogue — and the seed reads them off the live product rather than
 * restating them. A second copy of the Organic Tee's description would drift
 * from the first the day someone edited one of them, and the `copy:refresh`
 * script only knows about the retail one.
 *
 * `category` is a placeholder split, five and five, so the two shoppable
 * genders each have a full line to look at. It is expected to be corrected in
 * the admin product editor; nothing here depends on a particular assignment.
 */
import type { ProductSlug } from '@/lib/brand/images';

/**
 * The tag that keeps these off the retail storefront.
 *
 * A wholesale style is a real, published product — it has to be, or it could
 * not be edited in the admin — so "published" alone cannot mean "on the shop
 * grid". `lib/services/products.ts` excludes anything carrying this tag from
 * every customer-facing query, which is the one place that decision is made.
 */
export const WHOLESALE_TAG = 'wholesale';

export type WholesaleSeed = {
  slug: string;
  title: string;
  category: 'men' | 'women';
  /** The retail style this borrows its copy, frames, options and price from. */
  source: ProductSlug;
};

/**
 * Ten styles. The `source` rotation is deliberate rather than arbitrary: the
 * three men's styles are the only long-form copy the store has written, and
 * cycling them spreads the three descriptions evenly instead of giving one of
 * them to four products and another to three.
 */
export const WHOLESALE_CATALOGUE: WholesaleSeed[] = [
  {
    slug: 'wholesale-razor-tank',
    title: 'Razor Tank',
    category: 'men',
    source: 'mens-organic-tee',
  },
  {
    slug: 'wholesale-notch-tank',
    title: 'Notch Tank',
    category: 'women',
    source: 'mens-heavyweight-tee',
  },
  {
    slug: 'wholesale-sg-muscle',
    title: 'SG Muscle',
    category: 'men',
    source: 'mens-long-sleeve-tee',
  },
  {
    slug: 'wholesale-crop-tee',
    title: 'Crop Tee',
    category: 'women',
    source: 'mens-organic-tee',
  },
  {
    slug: 'wholesale-basic-tee',
    title: 'Basic Tee',
    category: 'men',
    source: 'mens-heavyweight-tee',
  },
  {
    slug: 'wholesale-boy-tee',
    title: 'Boy Tee',
    category: 'women',
    source: 'mens-long-sleeve-tee',
  },
  {
    slug: 'wholesale-boy-tee-extended',
    title: 'Boy Tee Extended',
    category: 'men',
    source: 'mens-organic-tee',
  },
  {
    slug: 'wholesale-long-dress',
    title: 'Long Dress',
    category: 'women',
    source: 'mens-heavyweight-tee',
  },
  {
    slug: 'wholesale-sporty-muscle',
    title: 'Sporty Muscle',
    category: 'men',
    source: 'mens-long-sleeve-tee',
  },
  {
    slug: 'wholesale-v-neck-tee',
    title: 'V Neck Tee',
    category: 'women',
    source: 'mens-organic-tee',
  },
];
