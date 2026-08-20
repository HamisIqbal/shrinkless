import Link from 'next/link';

export default function AccountLayout({ children }: LayoutProps<'/'>) {
  return (
    <div>
      <header>
        <Link href="/">Shrinkless</Link>
        <nav aria-label="Main">
          <ul>
            <li><Link href="/shop">Shop</Link></li>
            <li><Link href="/cart">Cart</Link></li>
          </ul>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
