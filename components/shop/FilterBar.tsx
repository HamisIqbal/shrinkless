'use client';

import { useRouter } from 'next/navigation';
import { buildFilterQuery, toggleValue } from '@/lib/shop/filters';
import { PRODUCT_SORTS, type ProductFilter, type ProductSort } from '@/lib/validation/catalogue';

type Props = {
  filter: ProductFilter;
  sizes: string[];
  colors: string[];
  basePath: string;
};

const SORT_LABELS: Record<ProductSort, string> = {
  newest: 'Newest',
  'price-asc': 'Price, low to high',
  'price-desc': 'Price, high to low',
};

export function FilterBar({ filter, sizes, colors, basePath }: Props) {
  const router = useRouter();

  function apply(change: Parameters<typeof buildFilterQuery>[1]) {
    const query = buildFilterQuery(filter, change);
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  const filtered = filter.sizes.length > 0 || filter.colors.length > 0;

  return (
    <form aria-label="Filters" className="filterbar" onSubmit={(event) => event.preventDefault()}>
      <fieldset className="filterbar__group">
        <legend className="meta filterbar__legend">Size</legend>
        <div className="chip-row">
          {sizes.map((size) => (
            <label key={size} className="chip">
              <input
                type="checkbox"
                checked={filter.sizes.includes(size)}
                onChange={() => apply({ sizes: toggleValue(filter.sizes, size) })}
              />
              {size.toUpperCase()}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="filterbar__group">
        <legend className="meta filterbar__legend">Colour</legend>
        <div className="chip-row">
          {colors.map((color) => (
            <label key={color} className="chip">
              <input
                type="checkbox"
                checked={filter.colors.includes(color)}
                onChange={() => apply({ colors: toggleValue(filter.colors, color) })}
              />
              {color}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field filterbar__sort">
        Sort
        <select
          value={filter.sort}
          onChange={(event) => apply({ sort: event.target.value as ProductSort })}
        >
          {PRODUCT_SORTS.map((sort) => (
            <option key={sort} value={sort}>{SORT_LABELS[sort] ?? sort}</option>
          ))}
        </select>
      </label>

      {filtered && (
        <button
          type="button"
          className="btn btn--quiet filterbar__clear"
          onClick={() => apply({ sizes: [], colors: [] })}
        >
          Clear filters
        </button>
      )}
    </form>
  );
}
