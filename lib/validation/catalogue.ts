import { z } from 'zod';

const csvToArray = z
  .string()
  .optional()
  .transform((value) =>
    value
      ? value.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean)
      : [],
  );

export const PRODUCT_SORTS = ['newest', 'price-asc', 'price-desc'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const productFilterSchema = z
  .object({
    size: csvToArray,
    color: csvToArray,
    sort: z
      .string()
      .optional()
      .transform((value): ProductSort =>
        PRODUCT_SORTS.includes(value as ProductSort) ? (value as ProductSort) : 'newest',
      ),
    // Free-text search, from the header. Trimmed here so a query of spaces is
    // indistinguishable from no query at all.
    q: z
      .string()
      .optional()
      .transform((value) => (value ?? '').trim()),
  })
  .transform(({ size, color, sort, q }) => ({ sizes: size, colors: color, sort, q }));

export type ProductFilter = z.infer<typeof productFilterSchema>;
