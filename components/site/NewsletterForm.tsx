'use client';

import { useActionState } from 'react';
import { subscribeAction, type NewsletterState } from '@/app/actions/newsletter';

const INITIAL: NewsletterState = { status: 'idle' };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeAction, INITIAL);

  return (
    <form action={formAction} className="signup">
      <label htmlFor="newsletter-email" className="visually-hidden">
        Email address
      </label>

      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email address"
        className="signup__input"
        aria-describedby={state.status === 'idle' ? undefined : 'newsletter-status'}
      />

      <button type="submit" className="btn btn--light signup__submit" disabled={pending}>
        {pending ? 'Joining' : 'Join'}
      </button>

      <p
        id="newsletter-status"
        role="status"
        className={`signup__status${state.status === 'error' ? ' signup__status--error' : ''}`}
      >
        {state.status === 'idle' ? '' : state.message}
      </p>
    </form>
  );
}
