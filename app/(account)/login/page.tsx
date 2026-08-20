import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { loginAction } from '@/app/actions/auth';
import { AuthForm } from '@/components/account/AuthForm';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/account');

  return (
    <div>
      <h1>Sign in</h1>
      <AuthForm action={loginAction} submitLabel="Sign in" />
      <p>
        No account? <Link href="/register">Create one</Link>
      </p>
    </div>
  );
}
