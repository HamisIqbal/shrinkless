import { describe, expect, it } from 'vitest';
import {
  HERO_MAX,
  HERO_MIN,
  heroFramesInputSchema,
  mediaFrameSchema,
} from '@/lib/validation/media';

const frame = (over: Partial<{ url: string; alt: string; focus: string }> = {}) => ({
  url: 'https://example.com/a.jpg',
  alt: 'A tee on a concrete wall',
  focus: '',
  ...over,
});

describe('mediaFrameSchema', () => {
  it('accepts an https URL', () => {
    expect(mediaFrameSchema.safeParse(frame()).success).toBe(true);
  });

  it('accepts a Cloudinary public id', () => {
    expect(mediaFrameSchema.safeParse(frame({ url: 'shrinkless/site/hero_ab12' })).success).toBe(
      true,
    );
  });

  it('refuses a plain http address', () => {
    expect(mediaFrameSchema.safeParse(frame({ url: 'http://example.com/a.jpg' })).success).toBe(
      false,
    );
  });

  it('refuses anything that could smuggle a scheme into a public id', () => {
    for (const url of ['../../etc/passwd', 'javascript:alert(1)', 'a b', '//evil.example']) {
      expect(mediaFrameSchema.safeParse(frame({ url })).success).toBe(false);
    }
  });

  it('requires alt text', () => {
    expect(mediaFrameSchema.safeParse(frame({ alt: '' })).success).toBe(false);
    expect(mediaFrameSchema.safeParse(frame({ alt: '   ' })).success).toBe(false);
  });

  it('accepts a well-formed focus point, and no focus at all', () => {
    expect(mediaFrameSchema.safeParse(frame({ focus: '50% 30%' })).success).toBe(true);
    expect(mediaFrameSchema.safeParse(frame({ focus: '' })).success).toBe(true);
  });

  it('refuses a focus point that is not two percentages', () => {
    for (const focus of ['centre', '50%', '50 30', 'top left', '50%30%']) {
      expect(mediaFrameSchema.safeParse(frame({ focus })).success).toBe(false);
    }
  });

  it('refuses percentages outside 0-100', () => {
    expect(mediaFrameSchema.safeParse(frame({ focus: '150% 30%' })).success).toBe(false);
  });

  it('trims what it stores', () => {
    const parsed = mediaFrameSchema.parse(frame({ alt: '  A tee  ' }));
    expect(parsed.alt).toBe('A tee');
  });
});

describe('heroFramesInputSchema', () => {
  const frames = (count: number) => ({ frames: Array.from({ length: count }, () => frame()) });

  it(`accepts between ${HERO_MIN} and ${HERO_MAX} frames`, () => {
    expect(heroFramesInputSchema.safeParse(frames(HERO_MIN)).success).toBe(true);
    expect(heroFramesInputSchema.safeParse(frames(HERO_MAX)).success).toBe(true);
  });

  it('refuses a carousel of one', () => {
    expect(heroFramesInputSchema.safeParse(frames(1)).success).toBe(false);
  });

  it('refuses more than the maximum', () => {
    expect(heroFramesInputSchema.safeParse(frames(HERO_MAX + 1)).success).toBe(false);
  });

  it('refuses a set where one frame is missing its alt text', () => {
    const input = { frames: [frame(), frame({ alt: '' })] };
    expect(heroFramesInputSchema.safeParse(input).success).toBe(false);
  });
});
