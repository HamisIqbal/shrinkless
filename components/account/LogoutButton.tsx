'use client';

import { useTransition } from 'react';
import { logoutAction } from '@/app/actions/auth';

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn--quiet"
      disabled={pending}
      onClick={() => startTransition(logoutAction)}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
