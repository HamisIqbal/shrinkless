import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/guards';

export const metadata = { title: 'Shrinkless admin' };

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/settings', label: 'Settings' },
];

export default async function AdminLayout({ children }: LayoutProps<'/'>) {
  const actor = await requireAdminPage();

  return (
    <div className="admin">
      <aside className="admin__aside">
        <Link href="/admin" className="admin__mark">Shrinkless admin</Link>

        <nav aria-label="Admin" className="admin__nav">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin__foot">
          <p className="admin__actor">{actor.email}</p>
          <Link href="/" className="admin__back">Back to store</Link>
        </div>
      </aside>

      <main className="admin__main">{children}</main>
    </div>
  );
}
