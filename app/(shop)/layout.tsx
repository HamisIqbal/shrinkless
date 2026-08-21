import Link from 'next/link';
import { getStoreSettings } from '@/lib/services/settings';
import { readCartView } from '@/lib/cart-session';
import { auth } from '@/auth';
import { SmoothScroll } from '@/components/ui/SmoothScroll';

export default async function ShopLayout({ children }: LayoutProps<'/'>) {
  const [settings, cart, session] = await Promise.all([
    getStoreSettings(),
    readCartView(),
    auth(),
  ]);

  const itemCount = cart?.itemCount ?? 0;

  return (
    <div className="shell">
      <SmoothScroll />
      {settings.announcement ? (
        <p role="status" className="announce">{settings.announcement}</p>
      ) : null}

      <header className="masthead">
        <div className="sheet masthead__inner">
          <Link href="/" className="wordmark">
            Shrinkless
            <span className="wordmark__rule" aria-hidden="true" />
            <span className="wordmark__est">Est. MMXXVI</span>
          </Link>

          <nav aria-label="Main" className="mainnav">
            <ul>
              <li><Link href="/shop">Shop</Link></li>
              <li>
                {session?.user ? (
                  <Link href="/account">Account</Link>
                ) : (
                  <Link href="/login">Sign in</Link>
                )}
              </li>
              <li>
                <Link href="/cart" className="mainnav__cart">
                  Cart
                  <span className="mainnav__count tnum">{itemCount}</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="sheet">{children}</main>

      <footer className="colophon">
        <div className="sheet colophon__inner">
          <p className="colophon__mark">Shrinkless</p>
          <p className="meta">Heavyweight cotton, cut and sewn in limited runs.</p>
          <nav aria-label="Footer" className="colophon__links">
            <ul>
              <li><Link href="/shop">Shop all</Link></li>
              <li><Link href="/cart">Cart</Link></li>
              <li><a href={`mailto:${settings.storeEmail}`}>{settings.storeEmail}</a></li>
            </ul>
          </nav>
          <p className="meta tnum">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
