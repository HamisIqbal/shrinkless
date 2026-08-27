import Link from 'next/link';
import type { ListParams, Paged } from '@/lib/admin/query';

/**
 * Search, filter and sort, as a plain GET form.
 *
 * No client component and no state: the query string *is* the state, which
 * means every admin list is linkable, bookmarkable, back-button-safe, and
 * works with JavaScript off. The server reads the same parameters it wrote.
 *
 * Deliberately unstyled beyond the existing admin classes — the visual pass
 * comes later; this is the functional skeleton it will dress.
 */
export type FilterOption = { value: string; label: string };

export type FilterSpec = {
  name: string;
  label: string;
  options: FilterOption[];
};

type Props = {
  action: string;
  params: ListParams;
  searchPlaceholder?: string;
  filters?: FilterSpec[];
  sorts?: { value: string; label: string }[];
};

export function ListControls({
  action,
  params,
  searchPlaceholder = 'Search',
  filters = [],
  sorts = [],
}: Props) {
  return (
    <form method="get" action={action} className="adminbar">
      <label className="adminbar__field">
        <span className="visually-hidden">Search</span>
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder={searchPlaceholder}
        />
      </label>

      {filters.map((filter) => (
        <label key={filter.name} className="adminbar__field">
          {filter.label}
          <select name={filter.name} defaultValue={params.filters[filter.name] ?? ''}>
            <option value="">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {sorts.length ? (
        <label className="adminbar__field">
          Sort
          <select name="sort" defaultValue={params.sort}>
            {sorts.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="adminbar__field">
        Order
        <select name="direction" defaultValue={params.direction}>
          <option value="desc">Newest / highest first</option>
          <option value="asc">Oldest / lowest first</option>
        </select>
      </label>

      {/* Any change of criteria returns to page one. Staying on page 9 of a
          list that now has two pages is how an admin concludes the search is
          broken. */}
      <input type="hidden" name="page" value="1" />

      <button type="submit">Apply</button>
      <Link href={action}>Reset</Link>
    </form>
  );
}

/** Builds a query string that keeps the current criteria and changes the page. */
function hrefFor(action: string, params: ListParams, page: number): string {
  const query = new URLSearchParams();

  if (params.q) query.set('q', params.q);
  for (const [key, value] of Object.entries(params.filters)) query.set(key, value);
  query.set('sort', params.sort);
  query.set('direction', params.direction);
  if (params.perPage) query.set('perPage', String(params.perPage));
  query.set('page', String(page));

  return `${action}?${query.toString()}`;
}

export function Pagination<T>({ action, page }: { action: string; page: Paged<T> }) {
  if (page.pageCount <= 1) {
    return (
      <p className="adminpage__count">
        {page.total} {page.total === 1 ? 'result' : 'results'}
      </p>
    );
  }

  const previous = Math.max(1, page.page - 1);
  const next = Math.min(page.pageCount, page.page + 1);

  return (
    <nav className="adminpager" aria-label="Pagination">
      <p className="adminpage__count">
        {page.total} results · page {page.page} of {page.pageCount}
      </p>

      {page.page > 1 ? (
        <Link href={hrefFor(action, page.params, previous)} rel="prev">
          Previous
        </Link>
      ) : (
        <span aria-disabled="true">Previous</span>
      )}

      {page.page < page.pageCount ? (
        <Link href={hrefFor(action, page.params, next)} rel="next">
          Next
        </Link>
      ) : (
        <span aria-disabled="true">Next</span>
      )}
    </nav>
  );
}
