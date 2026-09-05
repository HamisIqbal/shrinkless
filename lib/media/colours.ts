/**
 * The grounds a home-page section can be set to.
 *
 * Pure on purpose, and free of any database import: the same three colours are
 * read in three places — the service that writes them, the stylesheet the
 * storefront serves, and the editor drawing its swatches and its live preview
 * in the browser — and one shared copy is the only way those three can agree
 * on what `warm` means. The same arrangement `lib/content/style.ts` uses for
 * type, for the same reason.
 *
 * A bounded choice rather than a colour picker. The storefront is monochrome
 * by design and every band on it stands on one of these three; a free hex here
 * would let a section be set to something the ink type on it cannot be read
 * against, which is a page nobody can fix from the admin panel.
 */

/**
 * What is stored is the name, never the hex.
 *
 * So the server can refuse anything outside the palette, and so re-tinting the
 * brand moves every section that was set to `paper` without a migration —
 * these values are the tokens in `app/globals.css`, written out because a
 * `var()` would resolve against whatever the section it lands in inherits.
 */
export const SECTION_COLOURS = {
  paper: { label: 'Paper', hex: '#f5f4f0' },
  'paper-deep': { label: 'Deep paper', hex: '#edece7' },
  warm: { label: 'Warm sand', hex: '#d8d2c7' },
} as const;

export type SectionColour = keyof typeof SECTION_COLOURS;

/** The order the editor lists them in — lightest first, which is the order
 *  they read as on the page. */
export const SECTION_COLOUR_IDS = Object.keys(SECTION_COLOURS) as SectionColour[];

/** Whether a value names a colour the palette actually has. Everything that
 *  reaches the database or a stylesheet passes through here first. */
export function isSectionColour(value: unknown): value is SectionColour {
  return typeof value === 'string' && value in SECTION_COLOURS;
}

/** The hex a stored name resolves to, or empty for anything else — including
 *  the empty string, which is how "the ground the page already gives it" is
 *  stored. */
export function sectionColourHex(value: string | undefined): string {
  return isSectionColour(value) ? SECTION_COLOURS[value].hex : '';
}

/**
 * What one section is set to.
 *
 * Both halves optional and both meaning the same thing when absent: leave the
 * design's own. A section is only in the database at all once one of them has
 * been set.
 */
export type SectionSetting = {
  /** Pixels. 0 — like absent — is the height the page gives it. */
  height?: number;
  background?: SectionColour;
};

/**
 * One section's rules, or nothing at all.
 *
 * Shared by the published stylesheet and the editor's preview so the two
 * cannot drift: what is on screen while a swatch is being tried is built by
 * the same function that will serve the page after Publish.
 *
 * `fixed` is for the sections whose height *is* the design — a viewport-tall
 * hero, a full-bleed band. Those take the number as a height so it can be
 * brought down as well as up; everything else takes it as a floor, because a
 * fixed height on a grid of product cards would have the page run out from
 * under itself.
 */
export function sectionRules(
  selector: string,
  setting: SectionSetting,
  fixed?: boolean,
): string {
  const declarations: string[] = [];

  const height = setting.height ?? 0;
  if (height > 0) {
    declarations.push(
      fixed ? `height: ${height}px; min-height: ${height}px` : `min-height: ${height}px`,
    );
  }

  const hex = sectionColourHex(setting.background);
  if (hex) declarations.push(`background: ${hex}`);

  return declarations.length ? `${selector} { ${declarations.join('; ')}; }` : '';
}
