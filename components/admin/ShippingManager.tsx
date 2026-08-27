'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  archiveShippingMethodAction,
  saveShippingMethodAction,
} from '@/app/actions/admin/shipping';
import { formatCents } from '@/lib/money';
import type { ShippingMethodDTO } from '@/types/dto';

const BLANK = {
  id: undefined as string | undefined,
  name: '',
  code: '',
  description: '',
  /** Dollars in the form, cents on the wire. */
  rate: '0',
  freeOver: '',
  countries: '',
  states: '',
  estimate: '',
  active: true,
  sortOrder: '0',
};

type Draft = typeof BLANK;

function draftFrom(method: ShippingMethodDTO): Draft {
  return {
    id: method.id,
    name: method.name,
    code: method.code,
    description: method.description,
    rate: (method.rateCents / 100).toFixed(2),
    freeOver: method.freeOverCents === null ? '' : (method.freeOverCents / 100).toFixed(2),
    countries: method.countries.join(', '),
    states: method.states.join(', '),
    estimate: method.estimate,
    active: method.active,
    sortOrder: String(method.sortOrder),
  };
}

function codeList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
}

export function ShippingManager({ methods }: { methods: ShippingMethodDTO[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function run(work: () => Promise<{ ok: boolean; error?: string }>, done?: string) {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await work();

      if (!result.ok) {
        setError(result.error ?? 'That did not work.');
        return;
      }

      if (done) setMessage(done);
      router.refresh();
    });
  }

  function save(event: React.FormEvent) {
    event.preventDefault();

    const rate = Number(draft.rate);
    if (!Number.isFinite(rate) || rate < 0) {
      setError('A rate has to be zero or more.');
      return;
    }

    run(
      () =>
        saveShippingMethodAction({
          ...(draft.id ? { id: draft.id } : {}),
          name: draft.name,
          code: draft.code,
          description: draft.description,
          rateCents: Math.round(rate * 100),
          freeOverCents:
            draft.freeOver === '' ? null : Math.round(Number(draft.freeOver) * 100),
          countries: codeList(draft.countries),
          states: codeList(draft.states),
          estimate: draft.estimate,
          active: draft.active,
          sortOrder: Number(draft.sortOrder) || 0,
        }),
      draft.id ? 'Method updated.' : 'Method created.',
    );

    if (!draft.id) setDraft(BLANK);
  }

  return (
    <div className="shipman">
      <table>
        <thead>
          <tr>
            <th scope="col">Method</th>
            <th scope="col">Rate</th>
            <th scope="col">Free over</th>
            <th scope="col">Applies to</th>
            <th scope="col">State</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {methods.length === 0 ? (
            <tr>
              <td colSpan={6}>
                No methods yet — the store still quotes from the legacy zone table
                in Settings.
              </td>
            </tr>
          ) : null}

          {methods.map((method) => (
            <tr key={method.id}>
              <td>
                {method.name} <small>({method.code})</small>
              </td>
              <td>{formatCents(method.rateCents)}</td>
              <td>{method.freeOverCents === null ? '—' : formatCents(method.freeOverCents)}</td>
              <td>
                {method.countries.length || method.states.length
                  ? [...method.countries, ...method.states].join(', ')
                  : 'Everywhere'}
              </td>
              <td>
                {method.archived ? 'Archived' : method.active ? 'Active' : 'Inactive'}
              </td>
              <td>
                <button type="button" onClick={() => setDraft(draftFrom(method))}>Edit</button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        archiveShippingMethodAction({
                          id: method.id,
                          archived: !method.archived,
                        }),
                      method.archived ? 'Restored.' : 'Archived.',
                    )
                  }
                >
                  {method.archived ? 'Restore' : 'Archive'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={save}>
        <h2>{draft.id ? `Edit ${draft.code}` : 'New shipping method'}</h2>

        <label>
          Name
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            required
          />
        </label>

        <label>
          Code
          <input
            value={draft.code}
            onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })}
            required
          />
        </label>

        <label>
          Rate (dollars)
          <input
            type="number"
            step="0.01"
            min="0"
            value={draft.rate}
            onChange={(event) => setDraft({ ...draft, rate: event.target.value })}
            required
          />
        </label>

        <label>
          Free over (dollars, blank for never)
          <input
            type="number"
            step="0.01"
            min="0"
            value={draft.freeOver}
            onChange={(event) => setDraft({ ...draft, freeOver: event.target.value })}
          />
        </label>

        <label>
          Countries (two-letter, comma separated, blank for all)
          <input
            value={draft.countries}
            onChange={(event) => setDraft({ ...draft, countries: event.target.value })}
            placeholder="US, CA"
          />
        </label>

        <label>
          States (two-letter, comma separated, blank for all)
          <input
            value={draft.states}
            onChange={(event) => setDraft({ ...draft, states: event.target.value })}
            placeholder="TX, CA"
          />
        </label>

        <label>
          Delivery estimate
          <input
            value={draft.estimate}
            onChange={(event) => setDraft({ ...draft, estimate: event.target.value })}
            placeholder="3–5 business days"
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
          />
          Active
        </label>

        <button type="submit" disabled={pending}>
          {draft.id ? 'Save method' : 'Create method'}
        </button>

        {draft.id ? (
          <button type="button" onClick={() => setDraft(BLANK)} disabled={pending}>
            Cancel
          </button>
        ) : null}
      </form>

      {error ? <p role="alert">{error}</p> : null}
      {!error && message ? <p>{message}</p> : null}
    </div>
  );
}
