'use server';

import { z } from 'zod';
import { subscribe } from '@/lib/services/subscribers';

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
