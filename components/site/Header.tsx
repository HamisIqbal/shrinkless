'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/why-shrinkless', label: 'Why Shrinkless' },
  { href: '/faq', label: 'FAQ' },
];

type Props = {
  itemCount: number;
  signedIn: boolean;
};

/**
 * Sits over the hero photograph on the homepage, then takes a solid ground and
 * a hairline once the hero's lower edge passes.
 *
 * Driven by an IntersectionObserver on a sentinel the homepage renders at the
 * foot of its hero — not a scroll listener, so nothing runs on every frame.
 * Any page without that sentinel simply gets the solid header from the start.
 */
export function Header({ itemCount, signedIn }: Props) {
  const pathname = usePathname();
  const canOverlay = pathname === '/';

  // Only the observer writes this; whether it is *used* is derived, so leaving
  // a page with a hero cannot strand the header in its transparent state.
  const [heroInView, setHeroInView] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const overlaid = canOverlay && heroInView;

  useEffect(() => {
    if (!canOverlay) return;

    const sentinel = document.getElementById('hero-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canOverlay, pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className={`masthead${overlaid ? ' masthead--over' : ''}`}>
      <div className="wrap masthead__inner">
        <Link href="/" className="wordmark">Shrinkless</Link>

        <nav aria-label="Main" className="mainnav">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="ulink"
                  aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="masthead__utils">
          <Link href="/shop?focus=search" className="ulink">Search</Link>
          <Link href={signedIn ? '/account' : '/login'} className="ulink">Account</Link>
          <Link href="/cart" className="ulink">
            Cart<span className="tnum"> ({itemCount})</span>
          </Link>
        </div>

        <button
          type="button"
          className="masthead__toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {menuOpen ? (
        <div className="mobilenav" id="mobile-nav" ref={panelRef}>
          <nav aria-label="Main, mobile">
            <ul>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="mobilenav__link"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <hr className="rule" />

          <ul className="mobilenav__utils">
            <li>
              <Link
                href={signedIn ? '/account' : '/login'}
                className="ulink"
                onClick={() => setMenuOpen(false)}
              >
                Account
              </Link>
            </li>
            <li>
              <Link href="/cart" className="ulink" onClick={() => setMenuOpen(false)}>
                Cart<span className="tnum"> ({itemCount})</span>
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
