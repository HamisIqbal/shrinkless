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

  // An open panel needs a solid masthead behind it, or the bar keeps the
  // hero's white-on-photograph treatment while the panel below it is paper.
  const overlaid = canOverlay && heroInView && !menuOpen;

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
    <header
      className={`masthead${overlaid ? ' masthead--over' : ''}${menuOpen ? ' masthead--menu' : ''}`}
    >
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
          <span className="masthead__bars" aria-hidden="true" />
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Stays mounted in both states so closing animates too; `inert` keeps the
          collapsed panel out of the tab order and away from screen readers. */}
      <div
        className={`mobilenav${menuOpen ? ' mobilenav--open' : ''}`}
        id="mobile-nav"
        ref={panelRef}
        inert={!menuOpen}
      >
        <div className="mobilenav__inner">
          <nav aria-label="Main, mobile">
            <ul className="mobilenav__list">
              {NAV.map((item, index) => (
                <li key={item.href} className="mobilenav__item">
                  <Link
                    href={item.href}
                    className="mobilenav__link"
                    aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="mobilenav__index tnum">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="mobilenav__label">{item.label}</span>
                    <span className="mobilenav__arrow" aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mobilenav__utils">
            <Link
              href={signedIn ? '/account' : '/login'}
              className="ulink"
              onClick={() => setMenuOpen(false)}
            >
              {signedIn ? 'Account' : 'Sign in'}
            </Link>
            <Link href="/shop?focus=search" className="ulink" onClick={() => setMenuOpen(false)}>
              Search
            </Link>
            <Link href="/cart" className="ulink" onClick={() => setMenuOpen(false)}>
              Cart<span className="tnum"> ({itemCount})</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
