import { beforeEach, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { withTestDatabase } from '@/tests/setup/db';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';
import { Cart } from '@/lib/db/models/cart';
import {
  addItemToCart, createCart, getCartView,
  mergeGuestCartIntoUserCart, updateCartItemQuantity,
} from '@/lib/services/cart';

withTestDatabase();

let variantId: string;

beforeEach(async () => {
  const product = await Product.create({
    title: 'Field Shirt', slug: 'field-shirt', category: 'shirts', status: 'published',
    images: [{ publicId: 'shrinkless/fs', width: 800, height: 1000, alt: 'Field Shirt' }],
  });
  const variant = await Variant.create({
    productId: product._id, size: 'm', color: 'sand', sku: 'FS-M', priceCents: 4500, stock: 5,
  });
  variantId = String(variant._id);
});

describe('addItemToCart', () => {
  it('prices the line from the live variant', async () => {
    const cartId = await createCart();
    const view = await addItemToCart(cartId, variantId, 2);

    expect(view.lines[0].unitPriceCents).toBe(4500);
    expect(view.lines[0].lineTotalCents).toBe(9000);
    expect(view.subtotalCents).toBe(9000);
    expect(view.itemCount).toBe(2);
  });

  it('sums quantities when the same variant is added twice', async () => {
    const cartId = await createCart();
    await addItemToCart(cartId, variantId, 1);
    const view = await addItemToCart(cartId, variantId, 2);

    expect(view.lines).toHaveLength(1);
    expect(view.lines[0].quantity).toBe(3);
  });

  it('refuses to exceed available stock', async () => {
    const cartId = await createCart();
    await expect(addItemToCart(cartId, variantId, 6)).rejects.toThrowError(/only 5/i);
  });

  it('rejects an unknown variant', async () => {
    const cartId = await createCart();
    await expect(addItemToCart(cartId, String(new Types.ObjectId()), 1))
      .rejects.toThrowError(/variant not found/i);
  });
});

describe('updateCartItemQuantity', () => {
  it('removes the line when the quantity is zero', async () => {
    const cartId = await createCart();
    await addItemToCart(cartId, variantId, 2);
    const view = await updateCartItemQuantity(cartId, variantId, 0);

    expect(view.lines).toHaveLength(0);
    expect(view.subtotalCents).toBe(0);
  });
});

describe('getCartView', () => {
  it('reflects a price change made after the item was added', async () => {
    const cartId = await createCart();
    await addItemToCart(cartId, variantId, 1);
    await Variant.updateOne({ _id: variantId }, { priceCents: 5000 });

    const view = await getCartView(cartId);
    expect(view?.subtotalCents).toBe(5000);
  });

  it('returns null for an unknown cart', async () => {
    expect(await getCartView(String(new Types.ObjectId()))).toBeNull();
  });
});

describe('mergeGuestCartIntoUserCart', () => {
  it('sums quantities and caps them at available stock', async () => {
    const userId = String(new Types.ObjectId());
    const userCartId = await createCart(userId);
    await addItemToCart(userCartId, variantId, 4);

    const guestCartId = await createCart();
    await addItemToCart(guestCartId, variantId, 3);

    const mergedId = await mergeGuestCartIntoUserCart(guestCartId, userId);
    const view = await getCartView(mergedId);

    expect(mergedId).toBe(userCartId);
    expect(view?.lines[0].quantity).toBe(5);
    expect(await Cart.findById(guestCartId)).toBeNull();
  });
});
