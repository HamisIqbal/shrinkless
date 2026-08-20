import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LogoutButton } from '@/components/account/LogoutButton';

export const metadata = { title: 'Your account' };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div>
      <h1>Your account</h1>
      <dl>
        <dt>Name</dt>
        <dd>{session.user.name || 'Not set'}</dd>
        <dt>Email</dt>
        <dd>{session.user.email}</dd>
      </dl>

      <section aria-labelledby="orders-heading">
        <h2 id="orders-heading">Orders</h2>
        <p>Your order history will appear here once checkout is live.</p>
      </section>

      <LogoutButton />
    </div>
  );
}
