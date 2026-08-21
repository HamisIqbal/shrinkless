'use server';

import { revalidatePath } from 'next/cache';
import { NotAuthorizedError, requireAdminActor } from '@/lib/auth/guards';
import { updateStoreSettings } from '@/lib/services/settings';
import { settingsInputSchema } from '@/lib/validation/settings';

export type SaveSettingsResult = { ok: true } | { ok: false; error: string };

export async function saveSettingsAction(input: unknown): Promise<SaveSettingsResult> {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof NotAuthorizedError) return { ok: false, error: 'Not authorised.' };
    throw error;
  }

  const parsed = settingsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the settings.' };
  }

  await updateStoreSettings(parsed.data);

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');

  return { ok: true };
}
