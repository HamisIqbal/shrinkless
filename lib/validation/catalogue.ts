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
  })
  .transform(({ size, color, sort }) => ({ sizes: size, colors: color, sort }));

export type ProductFilter = z.infer<typeof productFilterSchema>;
