'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PRIMARY_NAV, type ShopMenu } from '@/lib/shop/navigation';
import { MegaMenu } from '@/components/site/MegaMenu';
import { SearchIcon, AccountIcon, CartIcon } from '@/components/site/icons';
import { MobileDrawer } from '@/components/site/MobileDrawer';

type Props = {
  menu: ShopMenu;
  itemCount: number;
  signedIn: boolean;
  storeEmail: string;
};

/** How far you have to move before the compact bar takes over. */
const COMPACT_AT = 16;

/**
 * Sits over the campaign hero on the homepage and takes a solid ground the
 * moment the page moves.
 *
 * The shop panel is a click-only disclosure. It used to open on hover, which
 * meant it dropped over the page whenever the pointer merely crossed the bar on
 * its way somewhere else.
 *
 * Spec §11: the compact bar has to arrive on the *first* meaningful scroll,
 * so the trigger is scroll position, not the foot of the hero. Sixteen pixels
 * is roughly one wheel notch — far enough not to fire on a rubber-band bounce,
 * near enough that the bar feels like it was waiting for you. Scrolling back
 * to the top hands the transparent treatment back.
 */
export function Header({ menu, itemCount, signedIn, storeEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const canOverlay = pathname === '/';

  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const searchInput = useRef<HTMLInputElement>(null);

  const overlaid = canOverlay && !scrolled && !megaOpen && !searchOpen;

  useEffect(() => {
    let frame = 0;

    function read() {
      frame = 0;
      setScrolled(window.scrollY > COMPACT_AT);
    }

    function onScroll() {
      // One read per painted frame. The listener itself does no layout work.
      if (!frame) frame = requestAnimationFrame(read);
    }

    frame = requestAnimationFrame(read);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Any navigation closes everything. Without this a soft route change leaves
  // the mega menu hanging over the page it just moved to. Adjusting during
  // render rather than in an effect means the new route never paints a frame
  // with the old panel still open.
  const [routeMark, setRouteMark] = useState(pathname);

  if (routeMark !== pathname) {
    setRouteMark(pathname);
    setMegaOpen(false);
    setDrawerOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    if (!megaOpen && !searchOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setMegaOpen(false);
      setSearchOpen(false);
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [megaOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  const closeMega = useCallback(() => setMegaOpen(false), []);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();

    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setSearchOpen(false);
  }

  const classes = [
    'masthead',
    overlaid ? 'masthead--over' : '',
    scrolled ? 'masthead--compact' : '',
    megaOpen || searchOpen ? 'masthead--panel' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <header className={classes}>
        <div className="wrap masthead__inner">
          <button
            type="button"
            className="masthead__toggle"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="masthead__bars" aria-hidden="true" />
            <span className="visually-hidden">Open menu</span>
          </button>

          <Link href="/" className="wordmark">Shrinkless</Link>

          <nav aria-label="Main" className="mainnav">
            <ul>
              {PRIMARY_NAV.map((item) => {
                const isShop = item.href === '/shop';
                const current = isShop
                  ? pathname === '/shop'
                  : pathname.startsWith(item.href);

                return (
                  <li key={item.href} className="mainnav__item">
                    {isShop ? (
                      <button
                        type="button"
                        className="ulink mainnav__trigger"
                        aria-expanded={megaOpen}
                        aria-controls="shop-mega"
                        onClick={() => setMegaOpen((value) => !value)}
                      >
                        {item.label}
                        <span className="mainnav__chevron" aria-hidden="true" />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className="ulink"
                        aria-current={current ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="masthead__utils">
            <button
              type="button"
              className="iconbtn masthead__search"
              aria-expanded={searchOpen}
              aria-controls="site-search"
              onClick={() => setSearchOpen((value) => !value)}
            >
              <SearchIcon />
              <span className="visually-hidden">Search</span>
            </button>

            <Link
              href={signedIn ? '/account' : '/login'}
              className="iconbtn masthead__account"
            >
              <AccountIcon />
              <span className="visually-hidden">{signedIn ? 'Account' : 'Sign in'}</span>
            </Link>

            <Link href="/cart" className="iconbtn iconbtn--cart">
              <CartIcon />
              {itemCount > 0 ? (
                <span className="iconbtn__count tnum" aria-hidden="true">{itemCount}</span>
              ) : null}
              <span className="visually-hidden">
                Cart, {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </Link>
          </div>
        </div>

        <div
          id="site-search"
          className={`sitesearch${searchOpen ? ' sitesearch--open' : ''}`}
          inert={!searchOpen}
        >
          <form className="wrap sitesearch__inner" role="search" onSubmit={submitSearch}>
            <label htmlFor="site-search-input" className="visually-hidden">
              Search products
            </label>
            <input
              id="site-search-input"
              ref={searchInput}
              type="search"
              className="sitesearch__input"
              placeholder="Search tees, colours, fits"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" className="btn sitesearch__go">Search</button>
            <button
              type="button"
              className="ulink sitesearch__close"
              onClick={() => setSearchOpen(false)}
            >
              Close
            </button>
          </form>
        </div>

        <MegaMenu menu={menu} open={megaOpen} id="shop-mega" onNavigate={closeMega} />
      </header>

      <div id="mobile-drawer">
        <MobileDrawer
          menu={menu}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          itemCount={itemCount}
          signedIn={signedIn}
          storeEmail={storeEmail}
        />
      </div>
    </>
  );
}
