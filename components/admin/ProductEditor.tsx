'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveProductAction } from '@/app/actions/admin/products';
import {
  applyRowEdits,
  buildVariantMatrix,
  pruneEditedRows,
  type MatrixRow,
} from '@/lib/admin/variant-matrix';
import { VariantMatrix } from '@/components/admin/VariantMatrix';
import { ImageUploader } from '@/components/admin/ImageUploader';
import type { ImageDTO, ProductDTO } from '@/types/dto';

const DEFAULT_PRICE_CENTS = 4200;

function toList(value: string): string[] {
  return value.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean);
}

export function ProductEditor({ product }: { product: ProductDTO | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [title, setTitle] = useState(product?.title ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(product?.status ?? 'draft');
  const [sizesText, setSizesText] = useState((product?.sizes ?? []).join(', '));
  const [colorsText, setColorsText] = useState((product?.colors ?? []).join(', '));
  const [edited, setEdited] = useState<Record<string, MatrixRow>>({});
  const [prunedFor, setPrunedFor] = useState<MatrixRow[] | null>(null);
  const [images, setImages] = useState<ImageDTO[]>(product?.images ?? []);

  const sizes = useMemo(() => toList(sizesText), [sizesText]);
  const colors = useMemo(() => toList(colorsText), [colorsText]);

  // Regenerating from the option sets on every render is what makes "add a
  // colour" append rows; per-row edits are layered back on by key.
  const generated = useMemo(
    () =>
      buildVariantMatrix({
        slug: slug || 'product',
        sizes,
        colors,
        existing: product?.variants ?? [],
        defaultPriceCents: DEFAULT_PRICE_CENTS,
      }),
    [slug, sizes, colors, product],
  );

  // A combination that leaves the option sets (colour removed) has its edit
  // dropped here, so if it comes back later (colour re-added) it regenerates
  // a clean row instead of reviving stale sku/price/stock. Pruning happens
  // during render — React's sanctioned "adjust state while rendering"
  // pattern — rather than in an effect, so this render's rows are already
  // correct instead of lagging a commit behind.
  let effectiveEdited = edited;
  if (prunedFor !== generated) {
    effectiveEdited = pruneEditedRows(edited, generated);
    setPrunedFor(generated);
    if (effectiveEdited !== edited) setEdited(effectiveEdited);
  }

  const rows = useMemo(() => applyRowEdits(generated, effectiveEdited), [generated, effectiveEdited]);

  function handleRowChange(key: string, patch: Partial<MatrixRow>) {
    setEdited((current) => {
      const target = rows.find((row) => row.key === key);
      if (!target) return current;
      return { ...current, [key]: { ...target, ...patch } };
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    startTransition(async () => {
      const result = await saveProductAction({
        id: product?.id,
        title, slug, description, category, status,
        images,
        sizes, colors,
        variants: rows.map((row) => ({
          variantId: row.variantId,
          size: row.size,
          color: row.color,
          sku: row.sku,
          priceCents: row.priceCents,
          stock: row.stock,
          enabled: row.enabled,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push('/admin/products');
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label>Slug
        <input value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </label>

      <label>Category
        <input value={category} onChange={(e) => setCategory(e.target.value)} required />
      </label>

      <label>Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label>Status
        <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <label>Sizes (comma separated)
        <input value={sizesText} onChange={(e) => setSizesText(e.target.value)} />
      </label>

      <label>Colours (comma separated)
        <input value={colorsText} onChange={(e) => setColorsText(e.target.value)} />
      </label>

      <ImageUploader images={images} onChange={setImages} />

      <VariantMatrix rows={rows} onRowChange={handleRowChange} />

      <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save product'}</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
