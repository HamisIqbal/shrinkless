import { BRAND_IMAGES, PRODUCT_IMAGES, type BrandImage } from '@/lib/brand/images';

/**
 * The Instagram strip above the footer.
 *
 * The account is real: instagram.com/shrinkless — "Organic Tees That Don't
 * Shrink", 103 posts at the time of writing.
 *
 * The POSTS below are NOT. Instagram stopped serving a profile's media grid to
 * unauthenticated requests, and the public oEmbed endpoint has needed an app
 * token since 2020, so there is no way to read the real posts at build time
 * without credentials. Until those exist each tile carries brand photography
 * and links to the profile rather than to a specific post.
 *
 * To make these real, either:
 *
 *  1. Paste in real values. Each entry needs `permalink`
 *     (https://www.instagram.com/p/<shortcode>/) and an `image`. This is a data
 *     change — no component has to change.
 *
 *  2. Wire the Graph API. Create a Meta app, connect the Instagram
 *     professional account, and fetch
 *     `/{ig-user-id}/media?fields=id,media_url,permalink,caption`. Replace this
 *     module's export with that call and cache it; `InstagramStrip` only reads
 *     the shape below.
 *
 * Do not present these as real posts anywhere in the UI while `synthetic` is
 * true — the component uses that flag to caption the strip honestly.
 */

export const INSTAGRAM_HANDLE = 'shrinkless';
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

export type InstagramPost = {
  /** Where clicking the tile goes. A real post permalink once one exists. */
  permalink: string;
  image: BrandImage;
};

/** True while the tiles are brand photography rather than fetched posts. */
export const INSTAGRAM_IS_PLACEHOLDER = true;

export const INSTAGRAM_POSTS: InstagramPost[] = [
  { permalink: INSTAGRAM_URL, image: PRODUCT_IMAGES['mens-organic-tee'][0] },
  { permalink: INSTAGRAM_URL, image: BRAND_IMAGES.hanging },
  { permalink: INSTAGRAM_URL, image: PRODUCT_IMAGES['womens-boxy-tee'][0] },
  { permalink: INSTAGRAM_URL, image: BRAND_IMAGES.fabric },
  { permalink: INSTAGRAM_URL, image: PRODUCT_IMAGES['mens-heavyweight-tee'][0] },
  { permalink: INSTAGRAM_URL, image: BRAND_IMAGES.folded },
  { permalink: INSTAGRAM_URL, image: PRODUCT_IMAGES['womens-organic-tee'][0] },
  { permalink: INSTAGRAM_URL, image: BRAND_IMAGES.craft },
  { permalink: INSTAGRAM_URL, image: PRODUCT_IMAGES['mens-long-sleeve-tee'][0] },
  { permalink: INSTAGRAM_URL, image: BRAND_IMAGES.heather },
];
