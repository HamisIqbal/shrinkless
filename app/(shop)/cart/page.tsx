import Link from 'next/link';
import { readCartView } from '@/lib/cart-session';
import { CartLines } from '@/components/shop/CartLines';
import { formatCents } from '@/lib/money';

export default async function CartPage() {
  const cart = await readCartView();

  if (!cart || cart.lines.length === 0) {
    return (
      <div>
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link href="/shop">Shop all</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Your cart</h1>
      <CartLines lines={cart.lines} />
      <p>Subtotal: {formatCents(cart.subtotalCents)}</p>
      <p>Shipping and tax are calculated at checkout.</p>
      <Link href="/checkout">Checkout</Link>
    </div>
  );
}
