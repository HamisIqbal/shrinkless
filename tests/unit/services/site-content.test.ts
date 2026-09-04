import { describe, expect, it } from 'vitest';
import { withTestDatabase } from '@/tests/setup/db';
import { ContentSlot } from '@/lib/db/models/content-slot';
import {
  CONTENT_KEYS,
  LONG_MAX,
  SHORT_MAX,
  defaultContent,
  getSiteContent,
  isKnownContentKey,
  listContentPages,
  resetContentField,
  saveContentField,
} from '@/lib/services/site-content';
import { AdminOperationError } from '@/lib/admin/action';

withTestDatabase();

describe('getSiteContent with nothing saved', () => {
  it('renders the wording the site ships with', async () => {
    const copy = await getSiteContent();

    expect(copy['home.hero.eyebrow']).toBe('Made in USA');
    expect(copy['story.title']).toBe('Our Story');
    expect(copy['faq.1.q']).toBe('Does it really not shrink?');
  });

  it('answers for every key the registry declares', async () => {
    const copy = await getSiteContent();

    for (const key of CONTENT_KEYS) {
      expect(copy[key], key).toBeTruthy();
      expect(copy[key], key).toBe(defaultContent(key));
    }
  });
});

describe('saveContentField', () => {
  it('overlays one field and leaves the rest alone', async () => {
    await saveContentField('home.hero.headline1', 'Tees that hold');

    const copy = await getSiteContent();

    expect(copy['home.hero.headline1']).toBe('Tees that hold');
    expect(copy['home.hero.headline2']).toBe(defaultContent('home.hero.headline2'));
  });

  it('writes one row per field, and updates rather than duplicates', async () => {
    await saveContentField('why.cta', 'Shop the range');
    await saveContentField('why.cta', 'Buy a tee');

    expect(await ContentSlot.countDocuments({ key: 'why.cta' })).toBe(1);
    expect((await getSiteContent())['why.cta']).toBe('Buy a tee');
  });

  it('trims what it is given', async () => {
    await saveContentField('faq.title', '  Questions  ');

    expect((await getSiteContent())['faq.title']).toBe('Questions');
  });

  it('refuses a key the site does not have', async () => {
    await expect(saveContentField('home.hero.nonsense', 'Anything')).rejects.toBeInstanceOf(
      AdminOperationError,
    );
  });

  it('refuses an empty field, because a blank heading is a hole in the page', async () => {
    await expect(saveContentField('why.title', '   ')).rejects.toBeInstanceOf(AdminOperationError);
  });

  it('holds a heading to the short limit and a paragraph to the long one', async () => {
    await expect(saveContentField('why.title', 'x'.repeat(SHORT_MAX + 1))).rejects.toBeInstanceOf(
      AdminOperationError,
    );

    await saveContentField('story.body', 'x'.repeat(SHORT_MAX + 1));
    expect((await getSiteContent())['story.body']).toHaveLength(SHORT_MAX + 1);

    await expect(saveContentField('story.body', 'x'.repeat(LONG_MAX + 1))).rejects.toBeInstanceOf(
      AdminOperationError,
    );
  });
});

describe('resetContentField', () => {
  it('forgets the override rather than writing the original back', async () => {
    await saveContentField('wholesale.title', 'Trade');
    await resetContentField('wholesale.title');

    expect(await ContentSlot.countDocuments({ key: 'wholesale.title' })).toBe(0);
    expect((await getSiteContent())['wholesale.title']).toBe('Wholesale');
  });

  it('refuses a key the site does not have', async () => {
    await expect(resetContentField('nope')).rejects.toBeInstanceOf(AdminOperationError);
  });
});

describe('a row for a field the registry no longer has', () => {
  it('is ignored rather than served', async () => {
    await ContentSlot.create({ key: 'home.hero.retired', value: 'Ghost' });

    const copy = await getSiteContent();

    expect(copy['home.hero.retired']).toBeUndefined();
    expect(isKnownContentKey('home.hero.retired')).toBe(false);
  });
});

describe('listContentPages', () => {
  it('offers the pages that actually carry hand-written copy', async () => {
    const pages = await listContentPages();

    expect(pages.map((page) => page.id)).toEqual([
      'home',
      'men',
      'women',
      'our-story',
      'why-shrinkless',
      'faq',
      'wholesale',
    ]);
  });

  it('gives every page at least one editable field', async () => {
    const pages = await listContentPages();

    for (const page of pages) {
      const fields = page.sections.flatMap((section) => section.fields);
      expect(fields.length, page.id).toBeGreaterThan(0);
    }
  });

  it('marks a saved field as changed and leaves the rest original', async () => {
    await saveContentField('faq.3.a', '7oz organic cotton.');

    const pages = await listContentPages();
    const fields = pages.flatMap((page) => page.sections.flatMap((section) => section.fields));
    const changed = fields.filter((field) => field.overridden);

    expect(changed).toHaveLength(1);
    expect(changed[0].key).toBe('faq.3.a');
    expect(changed[0].value).toBe('7oz organic cotton.');
  });

  it('names every field exactly once across every page', async () => {
    const pages = await listContentPages();
    const keys = pages.flatMap((page) =>
      page.sections.flatMap((section) => section.fields.map((field) => field.key)),
    );

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.sort()).toEqual([...CONTENT_KEYS].sort());
  });

  it('carries no media, so an image can never be edited from this tab', async () => {
    const pages = await listContentPages();
    const kinds = new Set(
      pages.flatMap((page) => page.sections.flatMap((section) => section.fields.map((f) => f.kind))),
    );

    expect(kinds.has('heading')).toBe(true);
    for (const kind of kinds) {
      expect(['eyebrow', 'heading', 'lede', 'body', 'button', 'question', 'answer', 'label']).toContain(
        kind,
      );
    }
  });
});
