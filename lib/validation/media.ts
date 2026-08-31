import { z } from 'zod';

import { ZOOM_MAX, ZOOM_MIN } from '@/lib/media/crop';

/** How many frames the campaign carousel will accept. Two is the fewest that
 *  is still a carousel; six is more than any visitor will ever sit through. */
export const HERO_MIN = 2;
export const HERO_MAX = 6;

/**
 * A Cloudinary public id: folder segments and a file stem. Deliberately
 * narrow — this value is interpolated into a URL, so anything that could carry
 * a scheme, a host or a traversal has no business passing.
 */
const PUBLIC_ID = /^[\w][\w./-]*$/;

const url = z
  .string()
  .trim()
  .min(1, 'An image is required')
  .max(500, 'That address is too long')
  .refine(
    (value) => /^https:\/\/[^\s]+$/i.test(value) || PUBLIC_ID.test(value),
    'Upload an image, or paste an https:// address',
  );

/**
 * `50% 30%` — the pair `object-position` takes. Kept to percentages because
 * the property accepts keywords and lengths this layout has no use for, and a
 * free-text field here would end up in a style attribute.
 */
const focus = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d{1,3}% \d{1,3}%$/.test(value),
    'Focus looks like "50% 30%"',
  )
  .refine(
    (value) =>
      value === '' ||
      value
        .split(' ')
        .every((part) => Number.parseInt(part, 10) >= 0 && Number.parseInt(part, 10) <= 100),
    'Focus percentages run from 0 to 100',
  )
  .default('');

/**
 * How far the photograph is scaled up inside its frame, about `focus`.
 *
 * Coerced because it arrives from a range input, and bounded because a value
 * below 1 would letterbox the frame the crop was meant to fill.
 */
const zoom = z.coerce
  .number()
  .min(ZOOM_MIN, 'Zoom starts at 1 — the frame filled')
  .max(ZOOM_MAX, `Zoom stops at ${ZOOM_MAX}`)
  .default(ZOOM_MIN);

export const mediaFrameSchema = z.object({
  url,
  alt: z
    .string()
    .trim()
    .min(1, 'Alt text is required — describe what is in the picture')
    .max(200, 'Keep alt text under 200 characters'),
  focus,
  zoom,
});

/** One single-image slot. The slot id is checked against the registry by the
 *  service, not here: the set of slots is the design's to decide. */
export const mediaSlotInputSchema = z.object({
  slotId: z.string().trim().min(1),
  frame: mediaFrameSchema,
});

export const heroFramesInputSchema = z.object({
  frames: z
    .array(mediaFrameSchema)
    .min(HERO_MIN, `The carousel needs at least ${HERO_MIN} frames`)
    .max(HERO_MAX, `The carousel takes at most ${HERO_MAX} frames`),
});

export const mediaSlotIdSchema = z.object({
  slotId: z.string().trim().min(1),
});

export type MediaFrameInput = z.infer<typeof mediaFrameSchema>;
export type MediaSlotInput = z.infer<typeof mediaSlotInputSchema>;
export type HeroFramesInput = z.infer<typeof heroFramesInputSchema>;
