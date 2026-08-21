/**
 * Editorial photography slots.
 *
 * These are PLACEHOLDERS. Real Shrinkless photography has not been supplied;
 * every frame here is licensed Unsplash stock and shows someone else's
 * garment. Replace the `url` values before launch — nothing else needs to
 * change, because components only ever read this manifest.
 *
 * `sat=-100` renders every frame black and white. That is deliberate: it is
 * the brand direction, and it is also what makes a set of unrelated stock
 * photographs read as one coherent editorial system.
 */

export type BrandImage = {
  /** Absolute URL, or a Cloudinary public ID once real assets land. */
  url: string;
  /** Never empty. Screen readers get a real description of the frame. */
  alt: string;
  aspect: '3:2' | '4:5' | '1:1';
};

const UNSPLASH = 'https://images.unsplash.com';

/** Shared transform: black and white, cropped, sensibly sized. */
function frame(id: string, width: number): string {
  return `${UNSPLASH}/${id}?auto=format&fit=crop&w=${width}&q=80&sat=-100`;
}

export const BRAND_IMAGES = {
  hero: {
    url: frame('photo-1605949478009-cf3e01396dd2', 2000),
    alt: 'A man in a plain black tee sitting on a concrete wall in daylight.',
    aspect: '3:2',
  },

  dyeStory: {
    url: frame('photo-1588354241597-a9880039f0ce', 1400),
    alt: 'Hands holding a length of woven cotton cloth.',
    aspect: '4:5',
  },

  madeInUsa: {
    url: frame('photo-1660980041852-230420b8f99f', 2000),
    alt: 'A factory floor lined with garment machinery.',
    aspect: '3:2',
  },

  why01: {
    url: frame('photo-1560796952-f1c9b838544c', 1400),
    alt: 'A sewing machine needle close up, mid-stitch.',
    aspect: '4:5',
  },

  why02: {
    url: frame('photo-1564584217132-2271feaeb3c5', 1400),
    alt: 'A grey tee hanging against a plain wall.',
    aspect: '4:5',
  },

  lifestyle01: {
    url: frame('photo-1612089668652-b9ada517be60', 1200),
    alt: 'A man walking a city sidewalk in the early afternoon.',
    aspect: '4:5',
  },
  lifestyle02: {
    url: frame('photo-1596517447156-4408f27791ae', 1200),
    alt: 'Two people sitting on a bench outside a shopfront.',
    aspect: '1:1',
  },
  lifestyle03: {
    url: frame('photo-1543233604-3baca4d35513', 1200),
    alt: 'A coffee cup resting on a book beside a window.',
    aspect: '1:1',
  },
  lifestyle04: {
    url: frame('photo-1591879468972-68d53647238c', 1200),
    alt: 'A man seated on a concrete bench, photographed from across the street.',
    aspect: '4:5',
  },
  lifestyle05: {
    url: frame('photo-1746045234010-fceb2bb57479', 1400),
    alt: 'A café interior looking out over the city.',
    aspect: '1:1',
  },
  lifestyle06: {
    url: frame('photo-1704300553191-d530728380a8', 1200),
    alt: 'A man sitting on top of a brick wall.',
    aspect: '4:5',
  },
  lifestyle07: {
    url: frame('photo-1521834100799-d805ca040e94', 1200),
    alt: 'Lettering on the side of a plain building.',
    aspect: '1:1',
  },
  lifestyle08: {
    url: frame('photo-1725218617496-5ccb972f9cab', 1200),
    alt: 'A man standing with a bicycle inside a concrete building.',
    aspect: '4:5',
  },
  lifestyle09: {
    url: frame('photo-1763462740475-3f084fc2399c', 1400),
    alt: 'A figure on a staircase behind construction scaffolding.',
    aspect: '1:1',
  },
} as const satisfies Record<string, BrandImage>;

export type BrandImageSlot = keyof typeof BRAND_IMAGES;

/** Product photography, keyed by colourway. Seeded into the catalogue. */
export const PRODUCT_IMAGES: Record<string, BrandImage> = {
  black: {
    url: frame('photo-1571455786673-9d9d6c194f90', 1400),
    alt: 'The organic tee in black, worn.',
    aspect: '4:5',
  },
  white: {
    url: frame('photo-1581655353564-df123a1eb820', 1400),
    alt: 'The organic tee in white, laid flat.',
    aspect: '4:5',
  },
  charcoal: {
    url: frame('photo-1693443687750-611ad77f3aba', 1400),
    alt: 'The organic tee in charcoal, folded beside a second tee.',
    aspect: '4:5',
  },
};

export const LIFESTYLE_SLOTS = [
  'lifestyle01', 'lifestyle02', 'lifestyle03',
  'lifestyle04', 'lifestyle05', 'lifestyle06',
  'lifestyle07', 'lifestyle08', 'lifestyle09',
] as const satisfies readonly BrandImageSlot[];
