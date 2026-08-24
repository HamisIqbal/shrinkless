/**
 * Navigation shape and the fixed parts of the menu.
 *
 * Deliberately free of anything that touches the database: `Header` is a
 * client component and imports `PRIMARY_NAV` from here, so a service import in
 * this file drags mongoose into the browser bundle. The query that fills the
 * menu in lives in `menu.server.ts`.
 */
import type { BrandImage, CategorySlug } from '@/lib/brand/images';

export type NavLink = { href: string; label: string };

export type NavColumn = {
  /** Column heading. Links to the category landing page where there is one. */
  title: string;
  href?: string;
  links: NavLink[];
};

export type NavFeature = {
  href: string;
  label: string;
  caption: string;
  image: BrandImage;
};

export type ShopMenu = {
  columns: NavColumn[];
  features: NavFeature[];
};

/** The categories that have their own landing page and gateway frame. */
export const SHOPPABLE: { slug: CategorySlug; label: string }[] = [
  { slug: 'men', label: 'Men' },
  { slug: 'women', label: 'Women' },
];

/** Top-level bar. Everything here resolves to a route that exists. */
export const PRIMARY_NAV: NavLink[] = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop/men', label: 'Men' },
  { href: '/shop/women', label: 'Women' },
  { href: '/our-story', label: 'About' },
];
