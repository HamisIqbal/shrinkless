'use server';

import { revalidatePath } from 'next/cache';
import { adminAction } from '@/lib/admin/action';
import { resetContentField, saveContentField } from '@/lib/services/site-content';
import { contentFieldInputSchema, contentKeySchema } from '@/lib/validation/content';

/**
 * Copy reaches the storefront through pages rather than through the layout,
 * and one field can be set on any of them — so every route is swept rather
 * than a list that would rot the next time a field moves.
 */
function revalidateStorefront(): void {
  revalidatePath('/admin/content');
  revalidatePath('/', 'layout');
}

export const saveContentFieldAction = adminAction(
  {
    permission: 'content:write',
    schema: contentFieldInputSchema,
    genericError: 'Could not save that wording.',
  },
  async ({ key, value }) => {
    await saveContentField(key, value);
    revalidateStorefront();

    return undefined;
  },
);

export const resetContentFieldAction = adminAction(
  {
    permission: 'content:write',
    schema: contentKeySchema,
    genericError: 'Could not restore that wording.',
  },
  async ({ key }) => {
    await resetContentField(key);
    revalidateStorefront();

    return undefined;
  },
);
