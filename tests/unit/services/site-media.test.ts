import { describe, expect, it } from 'vitest';
import { withTestDatabase } from '@/tests/setup/db';
import { MediaSlot } from '@/lib/db/models/media-slot';
import { BRAND_IMAGES, CATEGORY_IMAGES, HERO_SLIDES } from '@/lib/brand/images';
import {
  EDITORIAL_SLOTS,
  HERO_SLOT,
  categoryImage,
  categorySlotId,
  editorialSlotId,
  getSiteMedia,
  isKnownSlot,
  listMediaSlots,
  resetMediaSlot,
  saveHeroFrames,
  saveMediaSlot,
} from '@/lib/services/site-media';
import { AdminOperationError } from '@/lib/admin/action';

withTestDatabase();

const frame = (url: string) => ({ url, alt: 'A replacement frame', focus: '' });

describe('getSiteMedia with nothing saved', () => {
  it('renders the site exactly as it ships', async () => {
    const media = await getSiteMedia();

    expect(media.hero).toEqual([...HERO_SLIDES]);
    expect(media.editorial.fabric).toEqual(BRAND_IMAGES.fabric);
    expect(media.categories.men).toEqual(CATEGORY_IMAGES.men);
  });

  it('offers every editorial slot the design has', async () => {
    const media = await getSiteMedia();

    for (const slot of EDITORIAL_SLOTS) {
      expect(media.editorial[slot]?.url).toBeTruthy();
      expect(media.editorial[slot]?.alt).toBeTruthy();
    }
  });
});

describe('saveMediaSlot', () => {
  it('overlays one editorial slot and leaves the rest alone', async () => {
    await saveMediaSlot(editorialSlotId('fabric'), frame('https://example.com/new.jpg'));

    const media = await getSiteMedia();

    expect(media.editorial.fabric.url).toBe('https://example.com/new.jpg');
    expect(media.editorial.fabric.alt).toBe('A replacement frame');
    expect(media.editorial.craft).toEqual(BRAND_IMAGES.craft);
  });

  it('keeps the aspect from the slot, not from the saved row', async () => {
    // Aspect is a property of the layout: a differently-shaped photograph is
    // handled by `focus`, never by letting the band change height.
    await saveMediaSlot(editorialSlotId('folded'), frame('https://example.com/tall.jpg'));

    const media = await getSiteMedia();

    expect(media.editorial.folded.aspect).toBe(BRAND_IMAGES.folded.aspect);
  });

  it('carries a focus point through, and omits an empty one', async () => {
    await saveMediaSlot(editorialSlotId('torso'), {
      url: 'https://example.com/a.jpg',
      alt: 'A frame',
      focus: '50% 20%',
    });
    await saveMediaSlot(editorialSlotId('heather'), frame('https://example.com/b.jpg'));

    const media = await getSiteMedia();

    expect(media.editorial.torso.focus).toBe('50% 20%');
    expect(media.editorial.heather.focus).toBeUndefined();
  });

  it('accepts a Cloudinary public id as readily as a URL', async () => {
    await saveMediaSlot(editorialSlotId('craft'), frame('shrinkless/site/abc123'));

    expect((await getSiteMedia()).editorial.craft.url).toBe('shrinkless/site/abc123');
  });

  it('replaces rather than accumulating', async () => {
    const slot = editorialSlotId('fabric');

    await saveMediaSlot(slot, frame('https://example.com/one.jpg'));
    await saveMediaSlot(slot, frame('https://example.com/two.jpg'));

    expect(await MediaSlot.countDocuments({ slotId: slot })).toBe(1);
    expect((await getSiteMedia()).editorial.fabric.url).toBe('https://example.com/two.jpg');
  });

  it('refuses a slot the design does not have', async () => {
    await expect(
      saveMediaSlot('editorial:nonsense', frame('https://example.com/a.jpg')),
    ).rejects.toBeInstanceOf(AdminOperationError);

    expect(await MediaSlot.countDocuments({})).toBe(0);
  });

  it('refuses to save the carousel one frame at a time', async () => {
    await expect(
      saveMediaSlot(HERO_SLOT, frame('https://example.com/a.jpg')),
    ).rejects.toBeInstanceOf(AdminOperationError);
  });
});

describe('categories', () => {
  it('overlays a category tile', async () => {
    await saveMediaSlot(categorySlotId('men'), frame('https://example.com/men.jpg'));

    const media = await getSiteMedia();

    expect(categoryImage(media, 'men').url).toBe('https://example.com/men.jpg');
    expect(categoryImage(media, 'women')).toEqual(CATEGORY_IMAGES.women);
  });

  it('gives art to a category the manifest never knew about', async () => {
    await saveMediaSlot(categorySlotId('kids'), frame('https://example.com/kids.jpg'));

    expect(categoryImage(await getSiteMedia(), 'kids').url).toBe(
      'https://example.com/kids.jpg',
    );
  });

  it('stands in rather than rendering an empty tile', async () => {
    const media = await getSiteMedia();

    expect(categoryImage(media, 'never-seen-before')).toEqual(CATEGORY_IMAGES.men);
  });
});

describe('saveHeroFrames', () => {
  it('replaces the whole carousel', async () => {
    await saveHeroFrames([
      frame('https://example.com/1.jpg'),
      frame('https://example.com/2.jpg'),
      frame('https://example.com/3.jpg'),
    ]);

    const media = await getSiteMedia();

    expect(media.hero).toHaveLength(3);
    expect(media.hero.map((image) => image.url)).toEqual([
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
    ]);
  });

  it('gives a frame past the shipped four an aspect to fall back on', async () => {
    const frames = Array.from({ length: 6 }, (_, i) =>
      frame(`https://example.com/${i}.jpg`),
    );

    await saveHeroFrames(frames);

    for (const image of (await getSiteMedia()).hero) {
      expect(image.aspect).toBeTruthy();
    }
  });

  it('refuses fewer than two frames — that is not a carousel', async () => {
    await expect(
      saveHeroFrames([frame('https://example.com/1.jpg')]),
    ).rejects.toBeInstanceOf(AdminOperationError);
  });

  it('refuses more than six', async () => {
    const frames = Array.from({ length: 7 }, (_, i) =>
      frame(`https://example.com/${i}.jpg`),
    );

    await expect(saveHeroFrames(frames)).rejects.toBeInstanceOf(AdminOperationError);
  });
});

describe('resetMediaSlot', () => {
  it('puts a slot back to what the site shipped with', async () => {
    const slot = editorialSlotId('fabric');

    await saveMediaSlot(slot, frame('https://example.com/new.jpg'));
    await resetMediaSlot(slot);

    expect((await getSiteMedia()).editorial.fabric).toEqual(BRAND_IMAGES.fabric);
    expect(await MediaSlot.countDocuments({ slotId: slot })).toBe(0);
  });

  it('restores the carousel', async () => {
    await saveHeroFrames([frame('https://example.com/1.jpg'), frame('https://example.com/2.jpg')]);
    await resetMediaSlot(HERO_SLOT);

    expect((await getSiteMedia()).hero).toEqual([...HERO_SLIDES]);
  });

  it('is quiet about a slot that was never changed', async () => {
    await expect(resetMediaSlot(editorialSlotId('torso'))).resolves.toBeUndefined();
  });
});

describe('isKnownSlot', () => {
  it('accepts the slots the design has', () => {
    expect(isKnownSlot(HERO_SLOT)).toBe(true);
    expect(isKnownSlot(editorialSlotId('fabric'))).toBe(true);
    expect(isKnownSlot(categorySlotId('men'))).toBe(true);
    expect(isKnownSlot(categorySlotId('brand-new'))).toBe(true);
  });

  it('refuses everything else', () => {
    expect(isKnownSlot('editorial:nonsense')).toBe(false);
    expect(isKnownSlot('category:Not A Slug')).toBe(false);
    expect(isKnownSlot('products')).toBe(false);
    expect(isKnownSlot('')).toBe(false);
  });
});

describe('listMediaSlots', () => {
  it('lists every slot, changed or not, and says which is which', async () => {
    await saveMediaSlot(editorialSlotId('fabric'), frame('https://example.com/new.jpg'));

    const library = await listMediaSlots();

    expect(library.editorial).toHaveLength(EDITORIAL_SLOTS.length);
    expect(library.hero.overridden).toBe(false);

    const fabric = library.editorial.find((slot) => slot.slotId === editorialSlotId('fabric'));
    const craft = library.editorial.find((slot) => slot.slotId === editorialSlotId('craft'));

    expect(fabric?.overridden).toBe(true);
    expect(craft?.overridden).toBe(false);
  });

  it('describes where each slot appears, so the label is not a riddle', async () => {
    const library = await listMediaSlots();

    for (const slot of [library.hero, ...library.categories, ...library.editorial]) {
      expect(slot.label).toBeTruthy();
      expect(slot.where).toBeTruthy();
      expect(slot.frames.length).toBeGreaterThan(0);
    }
  });

  it('falls back to the manifest categories when the catalogue has none', async () => {
    const library = await listMediaSlots();

    expect(library.categories.map((slot) => slot.slotId).sort()).toEqual([
      categorySlotId('men'),
      categorySlotId('women'),
    ]);
  });
});
