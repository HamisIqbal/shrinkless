'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildFilterQuery, toggleValue } from '@/lib/shop/filters';
import { PRODUCT_SORTS, type ProductFilter, type ProductSort } from '@/lib/validation/catalogue';

type Props = {
  filter: ProductFilter;
  sizes: string[];
  colors: string[];
  basePath: string;
  /** The header's Search link lands here and expects the field ready to type in. */
  focusSearch?: boolean;
};

const SORT_LABELS: Record<ProductSort, string> = {
  newest: 'Newest',
  'price-asc': 'Price, low to high',
  'price-desc': 'Price, high to low',
};

export function FilterBar({ filter, sizes, colors, basePath, focusSearch = false }: Props) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState(filter.q);

  useEffect(() => {
    if (focusSearch) searchRef.current?.focus();
  }, [focusSearch]);

  function apply(change: Parameters<typeof buildFilterQuery>[1]) {
    const query = buildFilterQuery(filter, change);
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  const filtered = filter.sizes.length > 0 || filter.colors.length > 0 || filter.q !== '';

  return (
    <form
      aria-label="Filter and search"
      className="filterbar"
      onSubmit={(event) => {
        event.preventDefault();
        apply({ q: term.trim() });
      }}
    >
      <div className="filterbar__search">
        <label htmlFor="shop-search" className="visually-hidden">Search the catalogue</label>
        <input
          id="shop-search"
          ref={searchRef}
          type="search"
          value={term}
          placeholder="Search"
          className="filterbar__input"
          onChange={(event) => setTerm(event.target.value)}
        />
        <button type="submit" className="ulink filterbar__go">Search</button>
      </div>

      <fieldset className="filterbar__group">
        <legend className="meta filterbar__legend">Size</legend>
        <div className="chiprow">
          {sizes.map((size) => (
            <label key={size} className={`chip${filter.sizes.includes(size) ? ' chip--on' : ''}`}>
              <input
                type="checkbox"
                className="visually-hidden"
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
        <div className="chiprow">
          {colors.map((color) => (
            <label key={color} className={`chip${filter.colors.includes(color) ? ' chip--on' : ''}`}>
              <input
                type="checkbox"
                className="visually-hidden"
                checked={filter.colors.includes(color)}
                onChange={() => apply({ colors: toggleValue(filter.colors, color) })}
              />
              {color}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="filterbar__sort">
        <span className="meta filterbar__legend">Sort</span>
        <select
          className="filterbar__select"
          value={filter.sort}
          onChange={(event) => apply({ sort: event.target.value as ProductSort })}
        >
          {PRODUCT_SORTS.map((sort) => (
            <option key={sort} value={sort}>{SORT_LABELS[sort] ?? sort}</option>
          ))}
        </select>
      </label>

      {filtered ? (
        <button
          type="button"
          className="ulink filterbar__clear"
          onClick={() => {
            setTerm('');
            apply({ sizes: [], colors: [], q: '' });
          }}
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}
