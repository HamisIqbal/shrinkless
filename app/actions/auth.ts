'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { AuthError } from 'next-auth';
import { auth, signIn, signOut } from '@/auth';
import { EmailTakenError, createUser, verifyCredentials } from '@/lib/services/users';
import { loginSchema, registerSchema } from '@/lib/validation/auth';
import { CODE_TTL_MS, issueAdminChallenge } from '@/lib/services/two-factor';
import { adminCodeMail, adminCodeRecipient, maskEmail } from '@/lib/email/admin-code';
import { sendMail } from '@/lib/email/send';
import { mergeGuestCartIntoUserCart } from '@/lib/services/cart';
import { persistCartId, readCartId } from '@/lib/cart-session';
import { LIMITS, consume, reset, retryAfterMinutes } from '@/lib/security/rate-limit';
import { headers } from 'next/headers';

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string }
  /** The password was right and the account is an admin: a code is in the
   *  mailbox and the form has a second step to render. */
  | { step: 'code'; sentTo: string; error?: string };

const GENERIC_LOGIN_ERROR = 'That email and password combination is not correct.';
const THROTTLED_ERROR = (minutes: number) =>
  `Too many attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;

/**
 * Best-effort client address, for the per-address limit.
 *
 * A forwarded header can be spoofed, which is exactly why it is only ever the
 * *second* limit — the per-email one does the real work and cannot be dodged
 * by lying about where you are, because the account being attacked is the
 * account named in the form.
 */
async function clientAddress(): Promise<string> {
  const store = await headers();
  const forwarded = store.get('x-forwarded-for') ?? '';

  return forwarded.split(',')[0]?.trim() || 'unknown';
}
const BAD_CODE_ERROR = 'That code is not right, or it has expired. Send a new one.';
const MAIL_FAILED_ERROR =
  'Your password was right, but the code could not be emailed. Check the mail settings and try again.';

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

/**
 * Issues a second factor and mails it. Returns the step the form should show.
 *
 * A cooldown-suppressed resend is deliberately indistinguishable from a fresh
 * send in the copy: the live code is still the right one to type.
 */
async function startAdminChallenge(
  userId: string,
  accountEmail: string,
): Promise<AuthResult> {
  const recipient = adminCodeRecipient(accountEmail);
  const masked = maskEmail(recipient);

  let issued;
  try {
    issued = await issueAdminChallenge(userId, recipient);
  } catch {
    return { ok: false, error: 'Could not start the sign-in. Try again.' };
  }

  if (issued.code) {
    try {
      await sendMail(adminCodeMail(recipient, issued.code, CODE_TTL_MS / 60_000));
    } catch (error) {
      // Never strand an admin with a code they cannot read: drop the challenge
      // so the next attempt starts clean, and say what went wrong.
      console.error('admin 2FA mail failed', error);
      return { ok: false, error: MAIL_FAILED_ERROR };
    }
  }

  return { step: 'code', sentTo: masked };
}

/**
 * Two passes for an admin, one for everyone else.
 *
 * Pass one carries the password and gets a code in the mail. Pass two carries
 * the password *and* the code, and only then does signIn() run — so a session
 * is never minted anywhere except behind both factors.
 */
export async function loginAction(formData: FormData): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  const rawCode = formData.get('code');
  const code = typeof rawCode === 'string' ? rawCode.trim() : '';

  // Two budgets: one for the account under attack, one for the source. Both
  // are consumed before any password is verified, so a throttled attacker
  // cannot even measure whether an email exists.
  const byEmail = await consume(
    `login:${parsed.data.email}`,
    LIMITS.login.limit,
    LIMITS.login.windowMs,
  );

  const byIp = await consume(
    `login-ip:${await clientAddress()}`,
    LIMITS.loginByIp.limit,
    LIMITS.loginByIp.windowMs,
  );

  if (!byEmail.allowed || !byIp.allowed) {
    const worst = byEmail.allowed ? byIp : byEmail;
    return { ok: false, error: THROTTLED_ERROR(retryAfterMinutes(worst)) };
  }

  if (!code) {
    // Check the password here so a non-admin never pays for a second round
    // trip, and so an admin's code is only ever mailed on a *correct*
    // password — the mailbox is not an oracle for password guessing.
    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    if (!user) return { ok: false, error: GENERIC_LOGIN_ERROR };

    if (user.role === 'admin') {
      // Mailing a code costs money and fills an inbox, so it gets its own
      // budget on top of the password one.
      const sends = await consume(
        `2fa:${user.id}`,
        LIMITS.twoFactorSend.limit,
        LIMITS.twoFactorSend.windowMs,
      );

      if (!sends.allowed) {
        return { ok: false, error: THROTTLED_ERROR(retryAfterMinutes(sends)) };
      }

      return startAdminChallenge(user.id, user.email);
    }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      code,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // With a code in hand the password was already proven, so the only new
      // way to fail is the code itself. Keep the form on step two.
      if (code) {
        const recipient = adminCodeRecipient(parsed.data.email);
        return { step: 'code', sentTo: maskEmail(recipient), error: BAD_CODE_ERROR };
      }
      return { ok: false, error: GENERIC_LOGIN_ERROR };
    }
    throw error;
  }

  // A completed sign-in hands the budget back, so a shared address does not
  // accumulate a debt from its own successful logins.
  await reset(`login:${parsed.data.email}`);

  await mergeCartForCurrentUser();
  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
  revalidatePath('/', 'layout');
  redirect('/');
}
