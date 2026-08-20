import { cookies } from 'next/headers';
import { getCartView } from '@/lib/services/cart';
import type { CartViewDTO } from '@/types/dto';

export const CART_COOKIE = 'shrinkless_cart';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30,
} as const;

/** Read-only: safe to call from Server Components. */
export async function readCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** Read-only: safe to call from Server Components. */
export async function readCartView(): Promise<CartViewDTO | null> {
  const cartId = await readCartId();
  if (!cartId) return null;

  return getCartView(cartId);
}

/** Writes a cookie - only valid inside a Server Action or Route Handler. */
export async function persistCartId(cartId: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, cartId, COOKIE_OPTIONS);
}
