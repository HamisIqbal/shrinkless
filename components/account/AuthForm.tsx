'use client';

import { useState, useTransition } from 'react';
import type { AuthResult } from '@/app/actions/auth';

type Props = {
  action: (formData: FormData) => Promise<AuthResult>;
  submitLabel: string;
  includeName?: boolean;
};

export function AuthForm({ action, submitLabel, includeName = false }: Props) {
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError('');
    startTransition(async () => {
      const result = await action(formData);
      // A successful action redirects, so reaching here means it failed.
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit}>
      {includeName && (
        <label>
          Name
          <input type="text" name="name" autoComplete="name" />
        </label>
      )}

      <label>
        Email
        <input type="email" name="email" required autoComplete="email" />
      </label>

      <label>
        Password
        <input
          type="password"
          name="password"
          required
          autoComplete={includeName ? 'new-password' : 'current-password'}
        />
      </label>

      <button type="submit" disabled={pending}>
        {pending ? 'Working…' : submitLabel}
      </button>

      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
