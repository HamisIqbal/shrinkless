import type { CSSProperties } from 'react';

/**
 * How a photograph sits inside a frame it does not share a shape with.
 *
 * Two numbers, no re-encoding. `focus` is the `object-position` the frame
 * already understood; `zoom` scales the covered image about that same point.
 * Nothing is cut from the file, so the crop is reversible, survives a change
 * of layout, and works for the seeded `https://` photography exactly as it
 * does for a Cloudinary upload — which a baked `c_crop` transform could not.
 *
 * The geometry that makes the two agree: with `object-fit: cover` and
 * `object-position: p% q%`, the point at `p%, q%` **of the frame** is the point
 * at `p%, q%` **of the photograph**, in both axes. Pinning `transform-origin`
 * to the same pair therefore zooms around the chosen subject rather than
 * around the middle of the frame, and the admin's crop stage and the
 * storefront can render from one style.
 */
export type Crop = {
  /** `object-position`, e.g. `"42% 63%"`. Empty means the centre. */
  focus?: string;
  /** 1 is the frame as `cover` gives it. Never below 1 — that would letterbox. */
  zoom?: number;
};

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.01;

export const CENTRE = '50% 50%';

export function normaliseZoom(value: number | undefined): number {
  if (!Number.isFinite(value)) return ZOOM_MIN;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value as number));
}

export function normaliseFocus(value: string | undefined): string {
  return value && /^\d{1,3}% \d{1,3}%$/.test(value) ? value : CENTRE;
}

/** `"42% 63%"` → `[42, 63]`, as fractions of the frame. */
export function focusToPair(value: string | undefined): [number, number] {
  const [x, y] = normaliseFocus(value).split(' ');
  return [Number.parseInt(x, 10) / 100, Number.parseInt(y, 10) / 100];
}

/** The inverse, clamped and rounded — the stored form is integers, because
 *  that is what `lib/validation/media.ts` accepts into a style attribute. */
export function pairToFocus(x: number, y: number): string {
  const clamp = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 100);
  return `${clamp(x)}% ${clamp(y)}%`;
}

/**
 * The one style a cropped frame is rendered with, admin and storefront alike.
 *
 * The zoom leaves as a custom property rather than as `transform` so the
 * storefront keeps its hover scale: those rules multiply `--crop-zoom` instead
 * of being overridden by an inline transform.
 */
export function cropStyle(crop: Crop | undefined): CSSProperties {
  const zoom = normaliseZoom(crop?.zoom);

  // An uncropped frame gets no inline style at all, so the composed defaults
  // in the stylesheet still stand — the hero, for one, sits its frames at
  // `50% 35%` because the type occupies the bottom half, and writing an inline
  // `50% 50%` over every frame nobody has touched would quietly undo that.
  if (!crop?.focus) {
    return zoom > ZOOM_MIN
      ? { transformOrigin: CENTRE, ['--crop-zoom' as string]: String(zoom) }
      : {};
  }

  const focus = normaliseFocus(crop.focus);

  return {
    objectPosition: focus,
    transformOrigin: focus,
    ['--crop-zoom' as string]: String(zoom),
  };
}

/* --------------------------------------------------------------------------
   Frame shapes

   A crop is only meaningful against the shape it will be seen in, so every
   editable image declares the two it actually renders at. These are the
   `aspect-ratio` values in `app/storefront.css`, kept here in the one form the
   admin can hold a photograph up against.
   -------------------------------------------------------------------------- */

export type Ratio = { w: number; h: number };

export type ViewRatios = {
  /** The shape at a desk. This is the crop stage's own shape. */
  desktop: Ratio;
  /** The shape on a phone, where the same photograph is usually taller. */
  mobile: Ratio;
};

export function ratioValue(ratio: Ratio): string {
  return `${ratio.w} / ${ratio.h}`;
}

/** Product photography: the gallery frame on the product page, and the card
 *  reel in the grid, which is taller. */
export const PRODUCT_RATIOS: ViewRatios = {
  desktop: { w: 4, h: 5 },
  mobile: { w: 2, h: 3 },
};
