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
    <div>
      <aside>
        <Link href="/admin">Shrinkless admin</Link>
        <nav aria-label="Admin">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p>Signed in as {actor.email}</p>
        <Link href="/">Back to store</Link>
      </aside>

      <main>{children}</main>
    </div>
  );
}
