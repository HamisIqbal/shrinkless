import Link from 'next/link';
import { getStoreSettings } from '@/lib/services/settings';
import { readCartView } from '@/lib/cart-session';

export default async function ShopLayout({ children }: LayoutProps<'/'>) {
  const [settings, cart] = await Promise.all([getStoreSettings(), readCartView()]);

  return (
    <div>
      {settings.announcement ? <p role="status">{settings.announcement}</p> : null}

      <header>
        <Link href="/">Shrinkless</Link>
        <nav aria-label="Main">
          <ul>
            <li><Link href="/shop">Shop</Link></li>
            <li><Link href="/about">About</Link></li>
            <li>
              <Link href="/cart">Cart ({cart?.itemCount ?? 0})</Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>{children}</main>

      <footer>
        <p>&copy; {new Date().getFullYear()} Shrinkless</p>
        <p>{settings.storeEmail}</p>
      </footer>
    </div>
  );
}
