'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CategoriesIcon,
  CustomersIcon,
  DashboardIcon,
  DiscountsIcon,
  ExitIcon,
  InventoryIcon,
  OrdersIcon,
  PaymentsIcon,
  ProductsIcon,
  SettingsIcon,
  ShippingIcon,
} from '@/components/admin/icons';

const NAV = [
  { href: '/admin', label: 'Dashboard', Icon: DashboardIcon },
  { href: '/admin/orders', label: 'Orders', Icon: OrdersIcon },
  { href: '/admin/products', label: 'Products', Icon: ProductsIcon },
  { href: '/admin/inventory', label: 'Inventory', Icon: InventoryIcon },
  { href: '/admin/customers', label: 'Customers', Icon: CustomersIcon },
  { href: '/admin/categories', label: 'Collections', Icon: CategoriesIcon },
  { href: '/admin/discounts', label: 'Discounts', Icon: DiscountsIcon },
  { href: '/admin/shipping', label: 'Shipping', Icon: ShippingIcon },
  { href: '/admin/payments', label: 'Payments', Icon: PaymentsIcon },
  { href: '/admin/settings', label: 'Settings', Icon: SettingsIcon },
];

/**
 * The dark spine.
 *
 * A client component for one reason: it marks the current section, and knowing
 * where you are is the single most useful thing a rail does. `/admin` is
 * matched exactly so the dashboard does not stay lit on every page beneath it.
 *
 * Below the desktop breakpoint this becomes a dark header with the sections
 * scrolling horizontally — a recomposition rather than a squeeze, and one that
 * needs no toggle, no overlay and no JavaScript to open.
 */
export function AdminRail({ actorEmail }: { actorEmail: string }) {
  const pathname = usePathname();

  function isCurrent(href: string): boolean {
    return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  }

  return (
    <div className="rail">
      <Link href="/admin" className="rail__brand">
        Shrinkless
      </Link>

      <div className="rail__scroll">
        <nav aria-label="Admin sections" className="rail__nav">
          <ul>
            {NAV.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="rail__link"
                  aria-current={isCurrent(href) ? 'page' : undefined}
                >
                  <Icon className="rail__icon" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="rail__foot">
        <span className="rail__actor">Signed in</span>
        <span className="rail__email">{actorEmail}</span>
        <Link href="/" className="rail__back">
          <ExitIcon />
          View store
        </Link>
      </div>
    </div>
  );
}
