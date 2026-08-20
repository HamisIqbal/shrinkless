import { Types } from 'mongoose';
import { Cart } from '@/lib/db/models/cart';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';
import type { CartLineDTO, CartViewDTO } from '@/types/dto';

function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new Error(`Invalid id: ${id}`);
  return new Types.ObjectId(id);
}

export async function createCart(userId: string | null = null): Promise<string> {
  const cart = await Cart.create({ userId: userId ? toObjectId(userId) : null });
  return String(cart._id);
}

export async function getCartView(cartId: string): Promise<CartViewDTO | null> {
  const cart = await Cart.findById(toObjectId(cartId)).lean();
  if (!cart) return null;

  const variantIds = cart.items.map((item) => item.variantId);
  const variants = await Variant.find({ _id: { $in: variantIds } }).lean();
  const products = await Product.find({ _id: { $in: variants.map((v) => v.productId) } }).lean();

  const productById = new Map(products.map((product) => [String(product._id), product]));
  const lines: CartLineDTO[] = [];

  for (const item of cart.items) {
    const variant = variants.find((v) => String(v._id) === String(item.variantId));
    if (!variant) continue;

    const product = productById.get(String(variant.productId));
    if (!product) continue;

    lines.push({
      variantId: String(variant._id),
      productTitle: product.title,
      productSlug: product.slug,
      size: variant.size,
      color: variant.color,
      imagePublicId: product.images[0]?.publicId ?? '',
      unitPriceCents: variant.priceCents,
      quantity: item.quantity,
      lineTotalCents: variant.priceCents * item.quantity,
      availableStock: variant.stock,
    });
  }

  return {
    id: String(cart._id),
    lines,
    subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}

async function requireVariant(variantId: string) {
  const variant = await Variant.findById(toObjectId(variantId)).lean();
  if (!variant) throw new Error(`Variant not found: ${variantId}`);
  return variant;
}

export async function addItemToCart(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<CartViewDTO> {
  const variant = await requireVariant(variantId);
  const cart = await Cart.findById(toObjectId(cartId));
  if (!cart) throw new Error(`Cart not found: ${cartId}`);

  const existing = cart.items.find((item) => String(item.variantId) === variantId);
  const desired = (existing?.quantity ?? 0) + quantity;

  if (desired > variant.stock) {
    throw new Error(`Insufficient stock: only ${variant.stock} available`);
  }

  if (existing) {
    existing.quantity = desired;
  } else {
    cart.items.push({ variantId: toObjectId(variantId), quantity });
  }

  await cart.save();
  return (await getCartView(cartId))!;
}

export async function updateCartItemQuantity(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<CartViewDTO> {
  const cart = await Cart.findById(toObjectId(cartId));
  if (!cart) throw new Error(`Cart not found: ${cartId}`);

  if (quantity <= 0) {
    cart.items = cart.items.filter((item) => String(item.variantId) !== variantId);
  } else {
    const variant = await requireVariant(variantId);
    if (quantity > variant.stock) {
      throw new Error(`Insufficient stock: only ${variant.stock} available`);
    }

    const existing = cart.items.find((item) => String(item.variantId) === variantId);
    if (existing) existing.quantity = quantity;
  }

  await cart.save();
  return (await getCartView(cartId))!;
}

export async function mergeGuestCartIntoUserCart(
  guestCartId: string,
  userId: string,
): Promise<string> {
  const guestCart = await Cart.findById(toObjectId(guestCartId));
  if (!guestCart) throw new Error(`Cart not found: ${guestCartId}`);

  const userObjectId = toObjectId(userId);
  const userCart =
    (await Cart.findOne({ userId: userObjectId })) ??
    (await Cart.create({ userId: userObjectId }));

  for (const guestItem of guestCart.items) {
    const variant = await Variant.findById(guestItem.variantId).lean();
    if (!variant) continue;

    const existing = userCart.items.find(
      (item) => String(item.variantId) === String(guestItem.variantId),
    );

    const combined = (existing?.quantity ?? 0) + guestItem.quantity;
    const capped = Math.min(combined, variant.stock);
    if (capped <= 0) continue;

    if (existing) {
      existing.quantity = capped;
    } else {
      userCart.items.push({ variantId: guestItem.variantId, quantity: capped });
    }
  }

  await userCart.save();
  await Cart.deleteOne({ _id: guestCart._id });

  return String(userCart._id);
}
