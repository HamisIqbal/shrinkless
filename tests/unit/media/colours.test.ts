import { describe, expect, it } from 'vitest';
import {
  SECTION_COLOURS,
  SECTION_COLOUR_IDS,
  isSectionColour,
  sectionColourHex,
  sectionRules,
} from '@/lib/media/colours';

describe('the palette', () => {
  it('offers the three grounds the site is built on', () => {
    expect(SECTION_COLOUR_IDS).toEqual(['paper', 'paper-deep', 'warm']);

    for (const id of SECTION_COLOUR_IDS) {
      expect(SECTION_COLOURS[id].label, id).toBeTruthy();
      expect(SECTION_COLOURS[id].hex, id).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('knows a name it has from anything else', () => {
    for (const id of SECTION_COLOUR_IDS) expect(isSectionColour(id)).toBe(true);

    // Everything here would otherwise reach a stylesheet.
    for (const value of [undefined, '', 'ink', '#d8d2c7', 'red; background: url(x)', 42, null]) {
      expect(isSectionColour(value), String(value)).toBe(false);
    }
  });

  it('resolves a name to a hex and everything else to nothing', () => {
    expect(sectionColourHex('warm')).toBe(SECTION_COLOURS.warm.hex);
    expect(sectionColourHex('')).toBe('');
    expect(sectionColourHex('hotpink')).toBe('');
  });
});

/* The rules the published stylesheet and the editor's live preview are both
   built from — so what is on screen while a swatch is being tried is what the
   page will serve after Publish. */
describe('sectionRules', () => {
  it('says nothing about a section that has been left alone', () => {
    expect(sectionRules('.gateway', {})).toBe('');
    expect(sectionRules('.gateway', { height: 0 })).toBe('');
  });

  /* A band whose own height is the design takes the number outright, so it can
     be brought down as well as up; a grid of product cards takes it as a floor,
     because a fixed height there would have the page run out from under
     itself. */
  it('sets a fixed band outright and an open one as a floor', () => {
    expect(sectionRules('.hero', { height: 700 }, true)).toBe(
      '.hero { height: 700px; min-height: 700px; }',
    );
    expect(sectionRules('.lookbook', { height: 700 })).toBe('.lookbook { min-height: 700px; }');
  });

  it('writes both halves into the one rule', () => {
    expect(sectionRules('.tiles', { height: 500, background: 'paper' })).toBe(
      `.tiles { min-height: 500px; background: ${SECTION_COLOURS.paper.hex}; }`,
    );
  });

  it('gives a ground alone its own rule', () => {
    expect(sectionRules('.quotes', { background: 'warm' })).toBe(
      `.quotes { background: ${SECTION_COLOURS.warm.hex}; }`,
    );
  });
});
