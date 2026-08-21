'use server';

import { revalidatePath } from 'next/cache';
import { NotAuthorizedError, requireAdminActor } from '@/lib/auth/guards';
import { SlugTakenError, saveProduct } from '@/lib/services/products';
import { productInputSchema } from '@/lib/validation/product';
import { UPLOAD_FOLDER } from '@/lib/cloudinary/config';
import { loadCloudinaryEnv, signParams } from '@/lib/cloudinary/signature';

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

export type UploadSignature = {
  ok: true;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export async function createUploadSignatureAction(): Promise<
  UploadSignature | { ok: false; error: string }
> {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof NotAuthorizedError) return { ok: false, error: 'Not authorised.' };
    throw error;
  }

  let env;
  try {
    env = loadCloudinaryEnv();
  } catch {
    return { ok: false, error: 'Cloudinary is not configured on this environment.' };
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // The secret is used here and never leaves the server; the browser receives
  // only the signature, so image bytes go straight to Cloudinary.
  return {
    ok: true,
    cloudName: env.cloudName,
    apiKey: env.apiKey,
    timestamp,
    folder: UPLOAD_FOLDER,
    signature: signParams({ folder: UPLOAD_FOLDER, timestamp }, env.apiSecret),
  };
}
