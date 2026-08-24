'use client';

import { useState } from 'react';
import { FilterPanel } from '@/components/shop/FilterPanel';
import { ProductGrid } from '@/components/shop/ProductGrid';
import type { ProductFilter } from '@/lib/validation/catalogue';
import type { ProductDTO } from '@/types/dto';

type Props = {
  products: ProductDTO[];
  filter: ProductFilter;
  sizes: string[];
  colors: string[];
  priceFloor: number;
  priceCeiling: number;
  basePath: string;
  focusSearch?: boolean;
};

/**
 * The collection view: filter column on the left, products on the right.
 *
 * This owns whether the column is open, and the toggle deliberately sits in
 * the product column rather than inside the panel. Keeping it inside meant the
 * collapsed panel still had to be wide enough to hold its own button, so
 * "hiding" the filters actually widened the sidebar and shrank the grid. Out
 * here the column can go to nothing.
 *
 * Open/closed is component state rather than a URL parameter: it is a view
 * preference, not part of what the shopper is looking at, and it should not
 * travel in a shared link.
 */
export function ShopBrowser({
  products,
  filter,
  sizes,
  colors,
  priceFloor,
  priceCeiling,
  basePath,
  focusSearch = false,
}: Props) {
  const [open, setOpen] = useState(true);

  const active =
    filter.sizes.length > 0 ||
    filter.colors.length > 0 ||
    filter.q !== '' ||
    filter.minPrice !== null ||
    filter.maxPrice !== null;

  return (
    <div className={`shoplayout${open ? '' : ' shoplayout--shut'}`}>
      <div className="shoplayout__aside" inert={!open}>
        <FilterPanel
          filter={filter}
          sizes={sizes}
          colors={colors}
          priceFloor={priceFloor}
          priceCeiling={priceCeiling}
          basePath={basePath}
          count={products.length}
          focusSearch={focusSearch}
        />
      </div>

      <div className="shoplayout__main">
        <div className="shoplayout__bar">
          <button
            type="button"
            className="filters__toggle"
            aria-expanded={open}
            aria-controls="shop-filters"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="filters__togglemark" aria-hidden="true" />
            {open ? 'Hide filters' : 'Filters'}
            {active && !open ? <span className="filters__dot" aria-hidden="true" /> : null}
          </button>

          <p className="meta tnum">
            {products.length} {products.length === 1 ? 'style' : 'styles'}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="lede shoppage__empty">
            Nothing matches that. Clear a filter and try again.
          </p>
        ) : (
          <ProductGrid products={products} columns={3} />
        )}
      </div>
    </div>
  );
}
