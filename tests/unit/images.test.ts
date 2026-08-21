import { describe, expect, it } from 'vitest';
import { imageUrl, isRemoteImage } from '@/lib/images';
import { BRAND_IMAGES, PRODUCT_IMAGES, LIFESTYLE_SLOTS } from '@/lib/brand/images';

describe('imageUrl', () => {
  it('passes an absolute URL through untouched', () => {
    const url = 'https://images.unsplash.com/photo-123?w=800&sat=-100';

    expect(imageUrl(url)).toBe(url);
    expect(imageUrl(url, 'c_fill,w_400')).toBe(url);
  });

  it('sends a Cloudinary public ID to Cloudinary', () => {
    const result = imageUrl('shrinkless/tee-black', 'c_fill,w_800');

    expect(result).toContain('res.cloudinary.com');
    expect(result).toContain('c_fill,w_800');
    expect(result).toContain('shrinkless/tee-black');
  });

  it('recognises which is which', () => {
    expect(isRemoteImage('https://example.com/a.jpg')).toBe(true);
    expect(isRemoteImage('http://example.com/a.jpg')).toBe(true);
    expect(isRemoteImage('shrinkless/tee-black')).toBe(false);
  });
});

describe('brand image manifest', () => {
  const every = [...Object.entries(BRAND_IMAGES), ...Object.entries(PRODUCT_IMAGES)];

  it.each(every)('%s has a usable URL', (_slot, image) => {
    expect(image.url).toMatch(/^https:\/\//);
  });

  // An empty alt on editorial photography is a real accessibility defect, and
  // it is the kind that survives review because nothing looks wrong.
  it.each(every)('%s has real alt text', (_slot, image) => {
    expect(image.alt.trim().length).toBeGreaterThan(10);
  });

  it('renders every frame in black and white', () => {
    for (const [, image] of every) expect(image.url).toContain('sat=-100');
  });

  it('has nine lifestyle slots, all present in the manifest', () => {
    expect(LIFESTYLE_SLOTS).toHaveLength(9);
    for (const slot of LIFESTYLE_SLOTS) expect(BRAND_IMAGES[slot]).toBeDefined();
  });

  it('covers all three colourways', () => {
    expect(Object.keys(PRODUCT_IMAGES).sort()).toEqual(['black', 'charcoal', 'white']);
  });
});
