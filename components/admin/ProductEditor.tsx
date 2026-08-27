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
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [badge, setBadge] = useState<'none' | 'new'>(product?.badge ?? 'none');
  const [rating, setRating] = useState(String(product?.rating ?? 0));
  const [sizesText, setSizesText] = useState((product?.sizes ?? []).join(', '));
  const [colorsText, setColorsText] = useState((product?.colors ?? []).join(', '));
  const [edited, setEdited] = useState<Record<string, MatrixRow>>({});
  const [prunedFor, setPrunedFor] = useState<MatrixRow[] | null>(null);
  const [images, setImages] = useState<ImageDTO[]>(product?.images ?? []);
  const [tagsText, setTagsText] = useState((product?.tags ?? []).join(', '));
  const [baseSku, setBaseSku] = useState(product?.baseSku ?? '');
  const [seoTitle, setSeoTitle] = useState(product?.seo?.title ?? '');
  const [seoDescription, setSeoDescription] = useState(product?.seo?.description ?? '');
  const [seoKeywords, setSeoKeywords] = useState((product?.seo?.keywords ?? []).join(', '));
  const [qtyMin, setQtyMin] = useState(String(product?.quantityRule?.min ?? 1));
  const [qtyStep, setQtyStep] = useState(String(product?.quantityRule?.step ?? 1));
  const [qtyMax, setQtyMax] = useState(
    product?.quantityRule?.max === null || product?.quantityRule?.max === undefined
      ? ''
      : String(product.quantityRule.max),
  );

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
        title, slug, description, category, status, featured, badge,
        rating: Number(rating) || 0,
        tags: toList(tagsText),
        baseSku,
        seo: {
          title: seoTitle,
          description: seoDescription,
          keywords: toList(seoKeywords),
        },
        quantityRule: {
          min: Number(qtyMin) || 1,
          step: Number(qtyStep) || 1,
          max: qtyMax.trim() === '' ? null : Number(qtyMax),
        },
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
          lowStockThreshold: null,
          imagePublicId: '',
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
        <textarea
          rows={14}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <small>
          Blank lines separate blocks; a line starting with a dash is a bullet.
          The storefront reads a lead paragraph, five to seven bullets and a
          closing line.
        </small>
      </label>

      <label>Status
        <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <label className="checkfield">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
        />
        <span>
          Featured
          <small>Shows in the Featured band on the homepage.</small>
        </span>
      </label>

      <label>Badge
        <select value={badge} onChange={(e) => setBadge(e.target.value as 'none' | 'new')}>
          <option value="none">None</option>
          <option value="new">New arrival</option>
        </select>
        <small>Drawn on the product card. Sold out is worked out from stock.</small>
      </label>

      <label>Rating
        <input
          type="number"
          min={0}
          max={5}
          step={0.1}
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
        <small>Out of 5, drawn on the card. Leave at 0 for no rating.</small>
      </label>

      <label>Tags (comma separated)
        <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
        <small>Merchandising labels. Searchable in the admin product list.</small>
      </label>

      <label>Base SKU
        <input value={baseSku} onChange={(e) => setBaseSku(e.target.value.toUpperCase())} />
        <small>The family code. Each variant still carries its own SKU below.</small>
      </label>

      <fieldset>
        <legend>How it is sold</legend>

        <label>Minimum quantity
          <input type="number" min={1} value={qtyMin} onChange={(e) => setQtyMin(e.target.value)} />
        </label>

        <label>Sold in multiples of
          <input type="number" min={1} value={qtyStep} onChange={(e) => setQtyStep(e.target.value)} />
        </label>

        <label>Maximum per order (blank for none)
          <input type="number" min={1} value={qtyMax} onChange={(e) => setQtyMax(e.target.value)} />
        </label>

        <small>
          Minimum 12 with a step of 12 sells in 12, 24, 36. The product page
          offers only these quantities and the server refuses anything else.
        </small>
      </fieldset>

      <fieldset>
        <legend>SEO</legend>

        <label>Title
          <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} />
        </label>

        <label>Description
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            maxLength={160}
            rows={2}
          />
        </label>

        <label>Keywords (comma separated)
          <input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} />
        </label>
      </fieldset>

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
