import { describe, expect, it } from 'vitest';
import { withTestDatabase } from '@/tests/setup/db';
import { MediaSlot } from '@/lib/db/models/media-slot';
import { BRAND_IMAGES, CATEGORY_IMAGES, HERO_SLIDES } from '@/lib/brand/images';
import {
  EDITORIAL_SLOTS,
  HERO_SLOT,
  HOME_SECTIONS,
  categoryImage,
  categorySlotId,
  editorialSlotId,
  getMediaLayer,
  getSectionHeights,
  getSiteMedia,
  isKnownSection,
  isKnownSlot,
  listMediaPages,
  listMediaSlots,
  resetMediaSlot,
  saveHeroFrames,
  saveMediaSlot,
  saveSectionHeights,
  sectionHeightCss,
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

  /* The regression that took the editorial band off the site, and this test
     asserted it: an id was echoed back exactly as stored. But "as readily as a
     URL" has to mean it renders, and every component hands `url` straight to
     next/image — which read a bare id as a path relative to this site and
     404ed. Uploading is the only way to get an id in here, so pasting a link
     worked and it looked like an upload problem. */
  it('accepts a Cloudinary public id as readily as a URL', async () => {
    await saveMediaSlot(editorialSlotId('craft'), frame('shrinkless/site/abc123'));

    const url = (await getSiteMedia()).editorial.craft.url;

    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(url).toMatch(/shrinkless\/site\/abc123$/);
  });

  it('leaves an address that is already one exactly as it is', async () => {
    await saveMediaSlot(editorialSlotId('hanging'), frame('https://example.com/kept.jpg'));

    expect((await getSiteMedia()).editorial.hanging.url).toBe('https://example.com/kept.jpg');
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

  /* The panel used to list ten cards called "Home (Section)", three of which
     were the same photograph under two slots. Both halves of that are what
     these two guard. */
  it('gives every slot a title of its own', async () => {
    const library = await listMediaSlots();
    const labels = [library.hero, ...library.categories, ...library.editorial].map(
      (slot) => slot.label,
    );

    expect(new Set(labels).size).toBe(labels.length);
  });

  it('never lists the same photograph under two slots', async () => {
    const library = await listMediaSlots();
    const urls = [...library.categories, ...library.editorial].map(
      (slot) => slot.frames[0].url,
    );

    expect(new Set(urls).size).toBe(urls.length);
  });

  it('falls back to the manifest categories when the catalogue has none', async () => {
    const library = await listMediaSlots();

    expect(library.categories.map((slot) => slot.slotId).sort()).toEqual([
      categorySlotId('men'),
      categorySlotId('women'),
    ]);
  });
});

describe('listMediaPages', () => {
  it('offers the four pages the editor edits, and no others', async () => {
    const pages = await listMediaPages();

    expect(pages.map((page) => page.id)).toEqual([
      'home',
      'our-story',
      'why-shrinkless',
      'faq',
    ]);

    for (const page of pages) {
      expect(page.label).toBeTruthy();
      expect(page.path.startsWith('/')).toBe(true);
    }
  });

  /* The category tiles are edited on Home, where they are composed, rather
     than on a page of their own — so they still have to be reachable. The
     "places every slot on a page" test below is what actually guards that;
     this one says where they are. */
  it('keeps the category doors on Home', async () => {
    const pages = await listMediaPages();
    const home = pages.find((page) => page.id === 'home');

    const doors = home?.slots
      .map((slot) => slot.slotId)
      .filter((slotId) => slotId.startsWith('category:'));

    expect(doors?.sort()).toEqual([categorySlotId('men'), categorySlotId('women')]);
  });

  /* The point of the tab: a frame is edited where it stands, so every slot the
     library holds has to be reachable from some page. A slot nobody can get to
     is a photograph nobody can change. */
  it('places every slot on a page', async () => {
    const [pages, library] = await Promise.all([listMediaPages(), listMediaSlots()]);

    const placed = new Set(pages.flatMap((page) => page.slots.map((slot) => slot.slotId)));

    for (const slot of [library.hero, ...library.categories, ...library.editorial]) {
      expect(placed.has(slot.slotId)).toBe(true);
    }
  });

  it('carries the saved frame, not a second copy of it', async () => {
    await saveMediaSlot(editorialSlotId('promise'), frame('https://example.com/band.jpg'));

    const pages = await listMediaPages();
    const home = pages.find((page) => page.id === 'home');

    const appearances = home?.slots.filter(
      (slot) => slot.slotId === editorialSlotId('promise'),
    );

    expect(appearances?.length).toBe(1);
    expect(appearances?.[0].frames[0].url).toBe('https://example.com/band.jpg');
    expect(appearances?.[0].overridden).toBe(true);
  });

  /* Section height is a home-page control, and the editor draws its panel from
     this list — so a section offered anywhere else would be a control that
     could not be published. */
  it('offers the home page’s sections, and only there', async () => {
    const pages = await listMediaPages();

    for (const page of pages) {
      if (page.id === 'home') {
        expect(page.sections.map((section) => section.id)).toContain('hero');
        expect(page.sections.map((section) => section.id)).toContain('footer');
      } else {
        expect(page.sections).toEqual([]);
      }
    }
  });
});

describe('section heights', () => {
  it('stores nothing until a section has actually been given one', async () => {
    expect(await getSectionHeights()).toEqual({});
    expect(sectionHeightCss({})).toBe('');
  });

  it('keeps one height per section, not one per device', async () => {
    await saveSectionHeights([{ sectionId: 'hero', height: 600 }]);

    expect(await getSectionHeights()).toEqual({ hero: 600 });

    const css = sectionHeightCss(await getSectionHeights());

    expect(css).toContain('height: 600px');
    expect(css).not.toContain('@media');
  });

  /* A band whose own height is the design takes the number outright, so it can
     be brought down as well as up; a grid of product cards takes it as a floor,
     because a fixed height there would have the page run out from under
     itself. */
  it('sets a fixed band outright and an open one as a floor', async () => {
    await saveSectionHeights([
      { sectionId: 'hero', height: 700 },
      { sectionId: 'new', height: 700 },
    ]);

    const css = sectionHeightCss(await getSectionHeights());

    expect(css).toContain('.hero { height: 700px; min-height: 700px; }');
    expect(css).toContain('section[aria-labelledby="new-heading"] { min-height: 700px; }');
  });

  it('updates rather than duplicates', async () => {
    await saveSectionHeights([{ sectionId: 'footer', height: 400 }]);
    await saveSectionHeights([{ sectionId: 'footer', height: 520 }]);

    expect(await getSectionHeights()).toEqual({ footer: 520 });
  });

  /* Zero is "put it back", and putting it back is forgetting the row rather
     than storing a zero that would have to be read around everywhere. */
  it('forgets the row when a section is cleared', async () => {
    await saveSectionHeights([{ sectionId: 'promise', height: 500 }]);
    await saveSectionHeights([{ sectionId: 'promise', height: 0 }]);

    expect(await getSectionHeights()).toEqual({});
  });

  it('refuses a section the page does not have', async () => {
    expect(isKnownSection('hero')).toBe(true);
    expect(isKnownSection('nonsense')).toBe(false);

    await expect(
      saveSectionHeights([{ sectionId: 'nonsense', height: 300 }]),
    ).rejects.toBeInstanceOf(AdminOperationError);
  });
});

describe('getMediaLayer', () => {
  it('names every photograph on the page by the address it renders from', async () => {
    const layer = await getMediaLayer('home');

    expect(layer.page).toBe('home');
    expect(layer.frames.length).toBeGreaterThan(0);

    for (const frame of layer.frames) {
      expect(frame.url, frame.key).toBeTruthy();
      expect(frame.label, frame.key).toBeTruthy();
    }

    // The carousel is the one slot holding several, so its frames are the ones
    // that need telling apart.
    expect(layer.frames.some((entry) => entry.key.startsWith(`${HERO_SLOT}#`))).toBe(true);
  });

  it('carries a saved frame rather than the one the site shipped with', async () => {
    await saveMediaSlot(editorialSlotId('promise'), frame('https://example.com/new-band.jpg'));

    const layer = await getMediaLayer('home');
    const band = layer.frames.find((entry) => entry.slotId === editorialSlotId('promise'));

    expect(band?.url).toBe('https://example.com/new-band.jpg');
  });

  it('offers the home page’s sections and no other page’s', async () => {
    const home = await getMediaLayer('home');
    const faq = await getMediaLayer('faq');

    expect(home.sections.map((section) => section.id)).toEqual(
      HOME_SECTIONS.map((section) => section.id),
    );
    expect(faq.sections).toEqual([]);
    expect(faq.css).toBe('');
  });

  it('serves the saved heights as the page’s own stylesheet', async () => {
    await saveSectionHeights([{ sectionId: 'lookbook', height: 480 }]);

    const layer = await getMediaLayer('home');

    expect(layer.css).toContain('.lookbook { min-height: 480px; }');
  });
});
