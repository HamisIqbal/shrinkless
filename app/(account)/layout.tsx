import Link from 'next/link';

export default function AccountLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="shell">
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
              <li><Link href="/cart">Cart</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="sheet narrow">{children}</main>
    </div>
  );
}
