import Link from 'next/link';
import { readCartView } from '@/lib/cart-session';
import { CartLines } from '@/components/shop/CartLines';
import { formatCents } from '@/lib/money';

export default async function CartPage() {
  const cart = await readCartView();

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="pagehead reveal">
        <p className="eyebrow">Order</p>
        <h1 className="display">Your cart</h1>
        <p className="lede emptystate">Nothing in it yet. Start with the catalogue.</p>
        <Link href="/shop" className="btn">Shop all</Link>
      </div>
    );
  }

  return (
    <div className="reveal">
      <header className="pagehead">
        <p className="eyebrow">Order</p>
        <h1 className="display">Your cart</h1>
      </header>

      <div className="cartlayout">
        <CartLines lines={cart.lines} />

        <aside className="summary" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="meta summary__head">Summary</h2>
          <hr className="rule" />
          <dl className="summary__rows">
            <dt>Subtotal</dt>
            <dd className="tnum">{formatCents(cart.subtotalCents)}</dd>
            <dt>Shipping</dt>
            <dd className="summary__pending">At checkout</dd>
            <dt>Tax</dt>
            <dd className="summary__pending">At checkout</dd>
          </dl>
          <hr className="rule" />
          <Link href="/checkout" className="btn btn--spot summary__cta">Checkout</Link>
        </aside>
      </div>
    </div>
  );
}
