import { connectToDatabase } from '@/lib/db/connection';
import { MediaSlot } from '@/lib/db/models/media-slot';
import { listVisibleCategories } from '@/lib/services/categories';
import {
  BRAND_IMAGES,
  CATEGORY_IMAGES,
  HERO_SLIDES,
  PRODUCT_IMAGES,
  type BrandImage,
} from '@/lib/brand/images';
import { HERO_MAX, HERO_MIN, type MediaFrameInput } from '@/lib/validation/media';
import { normaliseZoom, type ViewRatios } from '@/lib/media/crop';
import { AdminOperationError } from '@/lib/admin/action';

/* --------------------------------------------------------------------------
   The registry

   The set of slots is a property of the design, not of the database. It lives
   here so the server decides what exists — a form cannot invent a slot, and a
   slot cannot quietly disappear because nobody ever saved it.
   -------------------------------------------------------------------------- */

export const HERO_SLOT = 'hero';

/** `category:men`, `category:women`, … — one per category in the catalogue. */
export function categorySlotId(slug: string): string {
  return `category:${slug}`;
}

export function editorialSlotId(name: EditorialSlot): string {
  return `editorial:${name}`;
}

type EditorialDefinition = {
  label: string;
  /** Where a person will see the change. Written for the admin page, because
   *  "torso" means nothing without it. */
  where: string;
  default: BrandImage;
  /** The two shapes this frame is actually seen in, so the admin crops
   *  against the layout rather than against a guess. Several of these frames
   *  appear in more than one place; the shape named is the largest use, which
   *  is the one a bad crop shows up in first. */
  ratios: ViewRatios;
};

/* The shapes `app/storefront.css` renders these slots at. Named once here so
   the crop stage and the two previews cannot drift from the layout. */
const WIDE: ViewRatios = { desktop: { w: 3, h: 2 }, mobile: { w: 4, h: 5 } };
const TILE: ViewRatios = { desktop: { w: 4, h: 5 }, mobile: { w: 4, h: 5 } };
const RAIL: ViewRatios = { desktop: { w: 3, h: 2 }, mobile: { w: 3, h: 2 } };
const BAND: ViewRatios = { desktop: { w: 3, h: 1 }, mobile: { w: 4, h: 5 } };

/** The carousel is the viewport itself — landscape at a desk, portrait in a
 *  hand. No other slot changes shape this hard, which is why it is the one
 *  worth previewing before it is saved. */
export const HERO_RATIOS: ViewRatios = {
  desktop: { w: 16, h: 9 },
  mobile: { w: 9, h: 16 },
};

/** `.gateway__frame` and `.tiles__frame` — 3:4 from 48rem up, 4:5 below. */
export const CATEGORY_RATIOS: ViewRatios = {
  desktop: { w: 3, h: 4 },
  mobile: { w: 4, h: 5 },
};

/**
 * The hand-composed frames.
 *
 * The last four exist because the home page and the lookbook rail reach into
 * `PRODUCT_IMAGES` for editorial purposes. Left alone they would be the only
 * storefront imagery the panel could not change — and editing a product's
 * photography would silently restyle the home page. Their own slots fix both.
 */
const EDITORIAL: Record<string, EditorialDefinition> = {
  fabric: {
    label: 'Fabric macro',
    where: 'Home, Why Shrinkless, and the lookbook rail',
    default: BRAND_IMAGES.fabric,
    ratios: WIDE,
  },
  craft: {
    label: 'Cut and sew',
    where: 'Home, Our Story, Why Shrinkless, the lookbook rail, and the footer backdrop',
    default: BRAND_IMAGES.craft,
    ratios: WIDE,
  },
  hanging: {
    label: 'On the hanger',
    where: 'Home, Our Story, Why Shrinkless, and the lookbook rail',
    default: BRAND_IMAGES.hanging,
    ratios: WIDE,
  },
  folded: {
    label: 'Flat lay',
    where: 'Home and Why Shrinkless',
    default: BRAND_IMAGES.folded,
    ratios: TILE,
  },
  heather: {
    label: 'Heather grey',
    where: 'Home, Why Shrinkless, and the lookbook rail',
    default: BRAND_IMAGES.heather,
    ratios: WIDE,
  },
  torso: {
    label: 'Studio torso',
    where: 'Home, Our Story, and the lookbook rail',
    default: BRAND_IMAGES.torso,
    ratios: WIDE,
  },
  promise: {
    label: 'The promise band',
    where: 'Home — the “Wash it. Dry it.” full-bleed band',
    default: PRODUCT_IMAGES['mens-heavyweight-tee'][0],
    ratios: BAND,
  },
  lookbookHeavyweight: {
    label: 'Lookbook — Heavyweight Tee',
    where: 'Home, the first tile on the lookbook rail',
    default: PRODUCT_IMAGES['mens-heavyweight-tee'][1],
    ratios: RAIL,
  },
  lookbookBoxy: {
    label: 'Lookbook — Boxy Tee',
    where: 'Home, the third tile on the lookbook rail',
    default: PRODUCT_IMAGES['womens-boxy-tee'][1],
    ratios: RAIL,
  },
  lookbookOrganic: {
    label: 'Lookbook — Organic Tee',
    where: 'Home, the fifth tile on the lookbook rail',
    default: PRODUCT_IMAGES['womens-organic-tee'][1],
    ratios: RAIL,
  },
};

export type EditorialSlot = keyof typeof EDITORIAL & string;

export const EDITORIAL_SLOTS = Object.keys(EDITORIAL) as EditorialSlot[];

/** The category frame used where a category has no art of its own. An empty
 *  tile reads as a broken page, which is worse than a stand-in. */
const CATEGORY_FALLBACK = CATEGORY_IMAGES.men;

/* --------------------------------------------------------------------------
   Reading
   -------------------------------------------------------------------------- */

export type SiteMedia = {
  hero: BrandImage[];
  categories: Record<string, BrandImage>;
  editorial: Record<EditorialSlot, BrandImage>;
};

type StoredFrame = { url: string; alt: string; focus?: string; zoom?: number };

/**
 * An override merged onto a default.
 *
 * `aspect` is taken from the default and never from the row: it is a property
 * of the layout slot, not of the photograph. A 2:3 frame dropped into a 3:2
 * band would letterbox or crop whatever the admin intended, so `focus` — which
 * *is* stored — is the control that makes a differently-shaped photograph sit
 * correctly.
 */
function merge(fallback: BrandImage, stored: StoredFrame | undefined): BrandImage {
  if (!stored) return fallback;

  return {
    url: stored.url,
    alt: stored.alt,
    aspect: fallback.aspect,
    ...(stored.focus ? { focus: stored.focus } : {}),
    ...(stored.zoom && stored.zoom > 1 ? { zoom: normaliseZoom(stored.zoom) } : {}),
  };
}

async function loadOverrides(): Promise<Map<string, StoredFrame[]>> {
  await connectToDatabase();

  const rows = await MediaSlot.find({}).select('slotId frames').lean();

  return new Map(
    rows.map((row) => [
      row.slotId,
      (row.frames ?? []).map((frame) => ({
        url: frame.url,
        alt: frame.alt,
        focus: frame.focus ?? '',
        zoom: normaliseZoom(frame.zoom ?? 1),
      })),
    ]),
  );
}

/**
 * Every storefront image, overrides merged over the shipped manifest.
 *
 * One query for the whole site. Callers are server components rendering a
 * page that already talks to the database, so this costs a round trip that was
 * happening anyway rather than a new one per image.
 */
export async function getSiteMedia(): Promise<SiteMedia> {
  const overrides = await loadOverrides();

  const heroFrames = overrides.get(HERO_SLOT);
  const hero =
    heroFrames?.length
      ? heroFrames.map((frame, index) =>
          merge(HERO_SLIDES[index] ?? HERO_SLIDES[0], frame),
        )
      : [...HERO_SLIDES];

  const categories: Record<string, BrandImage> = {};

  // Everything the manifest ships with, then anything the admin has added art
  // for — a category created after launch has a row but no manifest entry.
  for (const [slug, image] of Object.entries(CATEGORY_IMAGES)) {
    categories[slug] = merge(image, overrides.get(categorySlotId(slug))?.[0]);
  }

  for (const [slotId, frames] of overrides) {
    if (!slotId.startsWith('category:')) continue;

    const slug = slotId.slice('category:'.length);
    categories[slug] = merge(CATEGORY_FALLBACK, frames[0]);
  }

  const editorial = {} as Record<EditorialSlot, BrandImage>;

  for (const slot of EDITORIAL_SLOTS) {
    editorial[slot] = merge(
      EDITORIAL[slot].default,
      overrides.get(editorialSlotId(slot))?.[0],
    );
  }

  return { hero, categories, editorial };
}

/** The tile for a category, with the stand-in where there is no art. */
export function categoryImage(media: SiteMedia, slug: string): BrandImage {
  return media.categories[slug] ?? media.categories.men ?? CATEGORY_FALLBACK;
}

/* --------------------------------------------------------------------------
   The admin's view
   -------------------------------------------------------------------------- */

export type MediaSlotView = {
  slotId: string;
  label: string;
  where: string;
  frames: BrandImage[];
  /** The shapes this slot renders at — the crop stage and the desktop and
   *  mobile previews are all drawn from these. */
  ratios: ViewRatios;
  /** False when the slot is still showing what the site shipped with. */
  overridden: boolean;
};

export type MediaLibrary = {
  hero: MediaSlotView;
  categories: MediaSlotView[];
  editorial: MediaSlotView[];
};

/**
 * Every slot, whether or not it has ever been changed, with enough context for
 * a person to know what they are editing.
 *
 * Categories come from the catalogue rather than from a fixed pair, so a
 * category added last week gets a tile without a deploy.
 */
export async function listMediaSlots(): Promise<MediaLibrary> {
  const [overrides, media, categories] = await Promise.all([
    loadOverrides(),
    getSiteMedia(),
    listVisibleCategories().catch(() => []),
  ]);

  const slugs = categories.length
    ? categories.map((category) => ({ slug: category.slug, label: category.name }))
    : Object.keys(CATEGORY_IMAGES).map((slug) => ({
        slug,
        label: slug[0].toUpperCase() + slug.slice(1),
      }));

  return {
    hero: {
      slotId: HERO_SLOT,
      label: 'Campaign carousel',
      where: `Home — the frames behind the headline. ${HERO_MIN}–${HERO_MAX} of them.`,
      frames: media.hero,
      ratios: HERO_RATIOS,
      overridden: overrides.has(HERO_SLOT),
    },

    categories: slugs.map(({ slug, label }) => ({
      slotId: categorySlotId(slug),
      label: `${label} tile`,
      where: 'Home — the shopping doors, and the desktop menu',
      frames: [categoryImage(media, slug)],
      ratios: CATEGORY_RATIOS,
      overridden: overrides.has(categorySlotId(slug)),
    })),

    editorial: EDITORIAL_SLOTS.map((slot) => ({
      slotId: editorialSlotId(slot),
      label: EDITORIAL[slot].label,
      where: EDITORIAL[slot].where,
      frames: [media.editorial[slot]],
      ratios: EDITORIAL[slot].ratios,
      overridden: overrides.has(editorialSlotId(slot)),
    })),
  };
}

/* --------------------------------------------------------------------------
   Writing
   -------------------------------------------------------------------------- */

/**
 * Whether a slot id names something the design actually has.
 *
 * Category ids are the open case: the catalogue decides them, so any
 * well-formed slug is allowed rather than checked against a list that would go
 * stale the moment a category is added.
 */
export function isKnownSlot(slotId: string): boolean {
  if (slotId === HERO_SLOT) return true;

  if (slotId.startsWith('category:')) {
    return /^[a-z0-9][a-z0-9-]*$/.test(slotId.slice('category:'.length));
  }

  if (slotId.startsWith('editorial:')) {
    return EDITORIAL_SLOTS.includes(slotId.slice('editorial:'.length) as EditorialSlot);
  }

  return false;
}

function assertKnown(slotId: string): void {
  if (!isKnownSlot(slotId)) {
    throw new AdminOperationError('That is not a slot this site has.');
  }
}

/**
 * A frame as it arrives from a caller.
 *
 * The zoom is optional here, and only here: the validator defaults it and the
 * schema defaults it again, so a caller that never heard of a crop — a seed, a
 * test, an older client — writes an uncropped frame rather than a rejected
 * one.
 */
type MediaFrameWrite = Omit<MediaFrameInput, 'zoom'> & { zoom?: number };

/** Replaces the photograph in one single-image slot. */
export async function saveMediaSlot(
  slotId: string,
  frame: MediaFrameWrite,
): Promise<void> {
  assertKnown(slotId);

  if (slotId === HERO_SLOT) {
    throw new AdminOperationError('The carousel is saved as a set, not one frame at a time.');
  }

  await connectToDatabase();

  await MediaSlot.findOneAndUpdate(
    { slotId },
    { $set: { frames: [frame] } },
    { upsert: true },
  );
}

/** Replaces the whole carousel — reorder, add and remove are all this. */
export async function saveHeroFrames(frames: MediaFrameWrite[]): Promise<void> {
  if (frames.length < HERO_MIN || frames.length > HERO_MAX) {
    throw new AdminOperationError(
      `The carousel takes between ${HERO_MIN} and ${HERO_MAX} frames.`,
    );
  }

  await connectToDatabase();

  await MediaSlot.findOneAndUpdate(
    { slotId: HERO_SLOT },
    { $set: { frames } },
    { upsert: true },
  );
}

/** Puts a slot back to what the site shipped with, by forgetting the override
 *  rather than by writing a second copy of the original that could drift. */
export async function resetMediaSlot(slotId: string): Promise<void> {
  assertKnown(slotId);

  await connectToDatabase();
  await MediaSlot.deleteOne({ slotId });
}
