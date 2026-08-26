'use server';

import { z } from 'zod';
import { notifyWhenBackInStock, subscribe } from '@/lib/services/subscribers';

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
});

export type NewsletterState =
  | { status: 'idle' }
  | { status: 'ok'; message: string }
  | { status: 'error'; message: string };

export async function subscribeAction(
  _previous: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = schema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Enter a valid email address' };
  }

  try {
    await subscribe(parsed.data.email);
    return { status: 'ok', message: "You're on the list." };
  } catch {
    return { status: 'error', message: 'Could not sign you up just now. Try again shortly.' };
  }
}

const restockSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  slug: z.string().trim().min(1),
  color: z.string().trim().min(1),
});

/**
 * The sold-out form. Same shape as the newsletter action so the two forms can
 * share a component pattern, but it records which tee and which colourway was
 * asked about rather than dropping the address into one undifferentiated list.
 */
export async function notifyRestockAction(
  _previous: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = restockSchema.safeParse({
    email: formData.get('email'),
    slug: formData.get('slug'),
    color: formData.get('color'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Enter a valid email address',
    };
  }

  try {
    await notifyWhenBackInStock(parsed.data.email, parsed.data.slug, parsed.data.color);
    return { status: 'ok', message: "We'll email you the moment it's back." };
  } catch {
    return { status: 'error', message: 'Could not save that just now. Try again shortly.' };
  }
}
