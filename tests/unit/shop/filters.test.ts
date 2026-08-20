import { describe, expect, it } from 'vitest';
import { buildFilterQuery, toggleValue } from '@/lib/shop/filters';

const empty = { sizes: [], colors: [], sort: 'newest' as const };

describe('toggleValue', () => {
  it('adds a value that is absent', () => {
    expect(toggleValue([], 'm')).toEqual(['m']);
  });

  it('removes a value that is present', () => {
    expect(toggleValue(['s', 'm'], 'm')).toEqual(['s']);
  });
});

describe('buildFilterQuery', () => {
  it('returns an empty string when nothing is selected', () => {
    expect(buildFilterQuery(empty, {})).toBe('');
  });

  it('serialises sizes as a comma-separated list', () => {
    expect(buildFilterQuery({ ...empty, sizes: ['s', 'm'] }, {})).toBe('size=s%2Cm');
  });

  it('omits the default sort', () => {
    expect(buildFilterQuery({ ...empty, sort: 'newest' }, {})).toBe('');
  });

  it('includes a non-default sort', () => {
    expect(buildFilterQuery({ ...empty, sort: 'price-asc' }, {})).toBe('sort=price-asc');
  });

  it('applies a change over the current state', () => {
    expect(buildFilterQuery(empty, { sizes: ['l'] })).toBe('size=l');
  });

  it('combines every dimension', () => {
    const q = buildFilterQuery({ sizes: ['m'], colors: ['sand'], sort: 'price-desc' }, {});
    expect(q).toBe('size=m&color=sand&sort=price-desc');
  });
});
