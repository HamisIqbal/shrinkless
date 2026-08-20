import type { ProductFilter, ProductSort } from '@/lib/validation/catalogue';

export type FilterChange = {
  sizes: string[];
  colors: string[];
  sort: ProductSort;
};

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function buildFilterQuery(
  current: ProductFilter,
  change: Partial<FilterChange>,
): string {
  const next = { ...current, ...change };
  const params = new URLSearchParams();

  if (next.sizes.length) params.set('size', next.sizes.join(','));
  if (next.colors.length) params.set('color', next.colors.join(','));
  if (next.sort !== 'newest') params.set('sort', next.sort);

  return params.toString();
}
