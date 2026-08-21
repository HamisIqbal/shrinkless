'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { NotAuthorizedError, requireAdminActor } from '@/lib/auth/guards';
import { InvalidTransitionError, transitionOrder } from '@/lib/services/orders';

const schema = z.object({
  id: z.string().min(1),
  to: z.enum(['paid', 'shipped', 'delivered', 'cancelled', 'payment_failed']),
  trackingNumber: z.string().trim().default(''),
  note: z.string().trim().default(''),
});

export type TransitionResult = { ok: true } | { ok: false; error: string };

export async function transitionOrderAction(input: unknown): Promise<TransitionResult> {
  let actor;
  try {
    actor = await requireAdminActor();
  } catch (error) {
    if (error instanceof NotAuthorizedError) return { ok: false, error: 'Not authorised.' };
    throw error;
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid fulfillment request.' };

  try {
    await transitionOrder({
      id: parsed.data.id,
      to: parsed.data.to,
      actor: actor.email,
      note: parsed.data.note,
      trackingNumber: parsed.data.trackingNumber || undefined,
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return { ok: false, error: error.message };
    return { ok: false, error: 'Could not update the order.' };
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${parsed.data.id}`);
  revalidatePath('/admin');

  return { ok: true };
}
