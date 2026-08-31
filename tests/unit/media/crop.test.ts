import { describe, expect, it } from 'vitest';
import {
  CENTRE,
  ZOOM_MAX,
  ZOOM_MIN,
  cropStyle,
  focusToPair,
  normaliseFocus,
  normaliseZoom,
  pairToFocus,
  ratioValue,
  PRODUCT_RATIOS,
} from '@/lib/media/crop';

describe('normaliseFocus', () => {
  it('keeps a well-formed pair', () => {
    expect(normaliseFocus('42% 63%')).toBe('42% 63%');
  });

  it('falls back to the centre for anything else', () => {
    // Everything here would otherwise reach a style attribute.
    for (const value of [undefined, '', 'top', '50%', '50%50%', 'url(x)', '50px 20px']) {
      expect(normaliseFocus(value)).toBe(CENTRE);
    }
  });
});

describe('focus round trip', () => {
  it('survives a there-and-back', () => {
    expect(pairToFocus(...focusToPair('42% 63%'))).toBe('42% 63%');
  });

  it('clamps a drag that runs off the edge', () => {
    expect(pairToFocus(-0.4, 1.9)).toBe('0% 100%');
  });

  it('rounds to whole percentages, which is all the validator accepts', () => {
    expect(pairToFocus(0.4237, 0.6349)).toBe('42% 63%');
  });
});

describe('normaliseZoom', () => {
  it('bounds the range', () => {
    expect(normaliseZoom(0.2)).toBe(ZOOM_MIN);
    expect(normaliseZoom(9)).toBe(ZOOM_MAX);
    expect(normaliseZoom(1.75)).toBe(1.75);
  });

  it('treats nothing, and nonsense, as no zoom', () => {
    expect(normaliseZoom(undefined)).toBe(ZOOM_MIN);
    expect(normaliseZoom(Number.NaN)).toBe(ZOOM_MIN);
  });
});

describe('cropStyle', () => {
  it('writes nothing for a frame nobody has cropped', () => {
    // The hero sits its frames at 50% 35% in the stylesheet. An inline
    // 50% 50% over every untouched frame would quietly undo that.
    expect(cropStyle(undefined)).toEqual({});
    expect(cropStyle({ focus: '', zoom: 1 })).toEqual({});
  });

  it('pins the zoom to the chosen point, not to the middle of the frame', () => {
    expect(cropStyle({ focus: '30% 20%', zoom: 1.5 })).toEqual({
      objectPosition: '30% 20%',
      transformOrigin: '30% 20%',
      '--crop-zoom': '1.5',
    });
  });

  it('carries a zoom applied without a position, about the centre', () => {
    expect(cropStyle({ zoom: 2 })).toEqual({
      transformOrigin: CENTRE,
      '--crop-zoom': '2',
    });
  });

  it('refuses a zoom below 1, which would letterbox the frame', () => {
    expect(cropStyle({ focus: '50% 50%', zoom: 0.5 })).toMatchObject({
      '--crop-zoom': '1',
    });
  });
});

describe('ratioValue', () => {
  it('is the CSS aspect-ratio the crop stage and the previews are drawn at', () => {
    expect(ratioValue(PRODUCT_RATIOS.desktop)).toBe('4 / 5');
    expect(ratioValue(PRODUCT_RATIOS.mobile)).toBe('2 / 3');
  });
});
