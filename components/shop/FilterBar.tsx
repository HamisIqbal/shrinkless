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

export function FilterBar({ filter, sizes, colors, basePath }: Props) {
  const router = useRouter();

  function apply(change: Parameters<typeof buildFilterQuery>[1]) {
    const query = buildFilterQuery(filter, change);
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <form aria-label="Filters" onSubmit={(event) => event.preventDefault()}>
      <fieldset>
        <legend>Size</legend>
        {sizes.map((size) => (
          <label key={size}>
            <input
              type="checkbox"
              checked={filter.sizes.includes(size)}
              onChange={() => apply({ sizes: toggleValue(filter.sizes, size) })}
            />
            {size.toUpperCase()}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Colour</legend>
        {colors.map((color) => (
          <label key={color}>
            <input
              type="checkbox"
              checked={filter.colors.includes(color)}
              onChange={() => apply({ colors: toggleValue(filter.colors, color) })}
            />
            {color}
          </label>
        ))}
      </fieldset>

      <label>
        Sort
        <select
          value={filter.sort}
          onChange={(event) => apply({ sort: event.target.value as ProductSort })}
        >
          {PRODUCT_SORTS.map((sort) => (
            <option key={sort} value={sort}>{sort}</option>
          ))}
        </select>
      </label>

      {(filter.sizes.length > 0 || filter.colors.length > 0) && (
        <button type="button" onClick={() => apply({ sizes: [], colors: [] })}>
          Clear filters
        </button>
      )}
    </form>
  );
}
