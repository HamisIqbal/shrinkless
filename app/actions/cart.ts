'use server';

import { revalidatePath } from 'next/cache';
import {
  addItemToCart,
  createCart,
  getCartView,
  updateCartItemQuantity,
} from '@/lib/services/cart';
import { persistCartId, readCartId } from '@/lib/cart-session';
import type { CartViewDTO } from '@/types/dto';

export type ActionResult =
  | { ok: true; cart: CartViewDTO }
  | { ok: false; error: string };

function failure(error: unknown): ActionResult {
  const message = error instanceof Error ? error.message : 'Something went wrong';
  return { ok: false, error: message };
}

function revalidateCartSurfaces(): void {
  revalidatePath('/cart');
  revalidatePath('/', 'layout');
}

async function resolveCartId(): Promise<string> {
  const existing = await readCartId();
  if (existing && (await getCartView(existing))) return existing;

  const created = await createCart();
  await persistCartId(created);
  return created;
}

export async function addToCartAction(
  variantId: string,
  quantity: number,
): Promise<ActionResult> {
  try {
    const cartId = await resolveCartId();
    const cart = await addItemToCart(cartId, variantId, quantity);
    revalidateCartSurfaces();
    return { ok: true, cart };
  } catch (error) {
    return failure(error);
  }
}

export async function updateQuantityAction(
  variantId: string,
  quantity: number,
): Promise<ActionResult> {
  try {
    const cartId = await readCartId();
    if (!cartId) return { ok: false, error: 'No cart' };

    const cart = await updateCartItemQuantity(cartId, variantId, quantity);
    revalidateCartSurfaces();
    return { ok: true, cart };
  } catch (error) {
    return failure(error);
  }
}
