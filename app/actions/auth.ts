'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { AuthError } from 'next-auth';
import { auth, signIn, signOut } from '@/auth';
import { EmailTakenError, createUser } from '@/lib/services/users';
import { loginSchema, registerSchema } from '@/lib/validation/auth';
import { mergeGuestCartIntoUserCart } from '@/lib/services/cart';
import { persistCartId, readCartId } from '@/lib/cart-session';

export type AuthResult = { ok: true } | { ok: false; error: string };

const GENERIC_LOGIN_ERROR = 'That email and password combination is not correct.';

/**
 * After a successful sign-in, fold any guest cart into the account cart so a
 * shopper who filled a basket before logging in does not lose it.
 */
async function mergeCartForCurrentUser(): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  const guestCartId = await readCartId();

  if (!userId || !guestCartId) return;

  try {
    const mergedId = await mergeGuestCartIntoUserCart(guestCartId, userId);
    await persistCartId(mergedId);
  } catch {
    // A missing or already-merged cart must never block signing in.
  }
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name') ?? '',
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check your details.' };
  }

  try {
    await createUser(parsed.data);
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    return { ok: false, error: 'Could not create your account. Try again.' };
  }

  let signedIn = true;
  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    // The account exists; let them sign in manually rather than failing hard.
    signedIn = false;
  }

  if (!signedIn) redirect('/login');

  await mergeCartForCurrentUser();
  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: GENERIC_LOGIN_ERROR };
    }
    throw error;
  }

  await mergeCartForCurrentUser();
  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
  revalidatePath('/', 'layout');
  redirect('/');
}
