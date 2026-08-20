'use server';

import { revalidatePath } from 'next/cache';
import { NotAuthorizedError, requireAdminActor } from '@/lib/auth/guards';
import { SlugTakenError, saveProduct } from '@/lib/services/products';
import { productInputSchema } from '@/lib/validation/product';

export type SaveProductResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveProductAction(payload: unknown): Promise<SaveProductResult> {
  try {
    // The proxy is a convenience; this is the check that matters.
    await requireAdminActor();
  } catch (error) {
    if (error instanceof NotAuthorizedError) return { ok: false, error: 'Not authorised.' };
    throw error;
  }

  const parsed = productInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the product details.' };
  }

  const rawId = (payload as { id?: unknown }).id;
  const id = typeof rawId === 'string' && rawId ? rawId : undefined;

  try {
    const savedId = await saveProduct({ ...parsed.data, id });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath(`/product/${parsed.data.slug}`);

    return { ok: true, id: savedId };
  } catch (error) {
    if (error instanceof SlugTakenError) return { ok: false, error: error.message };
    return { ok: false, error: 'Could not save the product.' };
  }
}
