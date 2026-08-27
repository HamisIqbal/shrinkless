'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  archiveCategoryAction,
  backfillCategoriesAction,
  reorderCategoriesAction,
  saveCategoryAction,
} from '@/app/actions/admin/categories';
import type { CategoryDTO } from '@/types/dto';

const BLANK = {
  id: undefined as string | undefined,
  name: '',
  slug: '',
  description: '',
  visible: true,
  sortOrder: 0,
  seoTitle: '',
  seoDescription: '',
};

type Draft = typeof BLANK;

function draftFrom(category: CategoryDTO): Draft {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    visible: category.visible,
    sortOrder: category.sortOrder,
    seoTitle: category.seo.title,
    seoDescription: category.seo.description,
  };
}

/**
 * Create, edit, reorder, hide and archive — the whole category surface in one
 * screen, because there are rarely more than a handful and a separate detail
 * page for each would be more navigation than content.
 */
export function CategoryManager({
  categories,
  orphanSlugs,
}: {
  categories: CategoryDTO[];
  orphanSlugs: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function run(work: () => Promise<{ ok: boolean; error?: string }>, done?: string) {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await work();

      if (!result.ok) {
        setError(result.error ?? 'That did not work.');
        return;
      }

      if (done) setMessage(done);
      router.refresh();
    });
  }

  function save(event: React.FormEvent) {
    event.preventDefault();

    run(
      () =>
        saveCategoryAction({
          ...(draft.id ? { id: draft.id } : {}),
          name: draft.name,
          slug: draft.slug,
          description: draft.description,
          visible: draft.visible,
          sortOrder: Number(draft.sortOrder) || 0,
          seo: { title: draft.seoTitle, description: draft.seoDescription, keywords: [] },
        }),
      draft.id ? 'Category updated.' : 'Category created.',
    );

    if (!draft.id) setDraft(BLANK);
  }

  function move(index: number, by: number) {
    const next = [...categories];
    const target = index + by;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];

    run(() => reorderCategoriesAction({ orderedIds: next.map((category) => category.id) }));
  }

  return (
    <div className="catman">
      {orphanSlugs.length ? (
        <div className="notice">
          <p>
            {orphanSlugs.length} slug{orphanSlugs.length === 1 ? '' : 's'} in use by products
            have no category record: {orphanSlugs.join(', ')}.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => backfillCategoriesAction({}), 'Imported.')}
          >
            Import them
          </button>
        </div>
      ) : null}

      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Slug</th>
            <th scope="col">Products</th>
            <th scope="col">Visible</th>
            <th scope="col">Order</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category, index) => (
            <tr key={category.id}>
              <td>{category.name}{category.archived ? ' (archived)' : ''}</td>
              <td>{category.slug}</td>
              <td>{category.productCount}</td>
              <td>{category.visible ? 'Yes' : 'Hidden'}</td>
              <td>
                <button type="button" onClick={() => move(index, -1)} disabled={pending}>↑</button>
                <button type="button" onClick={() => move(index, 1)} disabled={pending}>↓</button>
              </td>
              <td>
                <button type="button" onClick={() => setDraft(draftFrom(category))}>Edit</button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        archiveCategoryAction({
                          id: category.id,
                          archived: !category.archived,
                        }),
                      category.archived ? 'Restored.' : 'Archived.',
                    )
                  }
                >
                  {category.archived ? 'Restore' : 'Archive'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={save}>
        <h2>{draft.id ? `Edit ${draft.slug}` : 'New category'}</h2>

        <label>
          Name
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            required
          />
        </label>

        <label>
          Slug
          <input
            value={draft.slug}
            onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            rows={2}
          />
        </label>

        <label>
          SEO title
          <input
            value={draft.seoTitle}
            onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })}
          />
        </label>

        <label>
          SEO description
          <textarea
            value={draft.seoDescription}
            onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })}
            rows={2}
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={draft.visible}
            onChange={(event) => setDraft({ ...draft, visible: event.target.checked })}
          />
          Visible in navigation
        </label>

        <button type="submit" disabled={pending}>
          {draft.id ? 'Save category' : 'Create category'}
        </button>

        {draft.id ? (
          <button type="button" onClick={() => setDraft(BLANK)} disabled={pending}>
            Cancel
          </button>
        ) : null}
      </form>

      {error ? <p role="alert">{error}</p> : null}
      {!error && message ? <p>{message}</p> : null}
    </div>
  );
}
