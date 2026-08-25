import { z } from 'zod';

const optionValue = z.string().trim().toLowerCase().min(1);
const cents = z.number().int().min(0);

const imageSchema = z.object({
  publicId: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().default(''),
});

const variantInputSchema = z.object({
  variantId: z.string().min(1).nullable().default(null),
  size: optionValue,
  color: optionValue,
  sku: z.string().trim().toUpperCase().min(1),
  priceCents: cents,
  stock: z.number().int().min(0),
  enabled: z.boolean().default(true),
});

export const productInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  slug: z.string().trim().toLowerCase().min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug may contain lowercase letters, numbers and dashes only'),
  description: z.string().trim().default(''),
  category: z.string().trim().toLowerCase().min(1, 'Category is required'),
  status: z.enum(['draft', 'published']),
  featured: z.boolean().default(false),
  badge: z.enum(['none', 'new']).default('none'),
  rating: z.number().min(0).max(5).default(0),
  images: z.array(imageSchema).default([]),
  sizes: z.array(optionValue).default([]),
  colors: z.array(optionValue).default([]),
  variants: z.array(variantInputSchema).default([]),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;
