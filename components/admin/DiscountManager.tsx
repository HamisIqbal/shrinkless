'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { archiveDiscountAction, saveDiscountAction } from '@/app/actions/admin/discounts';
import { formatCents } from '@/lib/money';
import type { DiscountDTO } from '@/types/dto';

const BLANK = {
  id: undefined as string | undefined,
  code: '',
  description: '',
  type: 'percentage' as 'percentage' | 'fixed',
  /** Percent for a percentage discount, dollars for a fixed one. Converted to
   *  basis points or cents on the way out — the server only ever sees integers. */
  amount: '10',
  active: true,
  startsAt: '',
  endsAt: '',
  usageLimit: '',
  perCustomerLimit: '',
  minOrder: '',
  categorySlugs: [] as string[],
};

type Draft = typeof BLANK;

function draftFrom(discount: DiscountDTO): Draft {
  return {
    id: discount.id,
    code: discount.code,
    description: discount.description,
    type: discount.type,
    amount:
      discount.type === 'percentage'
        ? String(discount.value / 100)
        : String(discount.value / 100),
    active: discount.active,
    startsAt: discount.startsAt ? discount.startsAt.slice(0, 10) : '',
    endsAt: discount.endsAt ? discount.endsAt.slice(0, 10) : '',
    usageLimit: discount.usageLimit === null ? '' : String(discount.usageLimit),
    perCustomerLimit:
      discount.perCustomerLimit === null ? '' : String(discount.perCustomerLimit),
    minOrder: discount.minOrderCents ? String(discount.minOrderCents / 100) : '',
    categorySlugs: discount.categorySlugs,
  };
}

function describe(discount: DiscountDTO): string {
  return discount.type === 'percentage'
    ? `${discount.value / 100}%`
    : formatCents(discount.value);
}

export function DiscountManager({
  discounts,
  categorySlugs,
}: {
  discounts: DiscountDTO[];
  categorySlugs: string[];
}) {
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

    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('The discount needs a positive amount.');
      return;
    }

    // Percent → basis points, dollars → cents. Both land as integers so no
    // float reaches the money path.
    const value = Math.round(amount * 100);

    run(
      () =>
        saveDiscountAction({
          ...(draft.id ? { id: draft.id } : {}),
          code: draft.code,
          description: draft.description,
          type: draft.type,
          value,
          active: draft.active,
          startsAt: draft.startsAt || null,
          endsAt: draft.endsAt || null,
          usageLimit: draft.usageLimit === '' ? null : Number(draft.usageLimit),
          perCustomerLimit:
            draft.perCustomerLimit === '' ? null : Number(draft.perCustomerLimit),
          minOrderCents: draft.minOrder === '' ? 0 : Math.round(Number(draft.minOrder) * 100),
          productIds: [],
          categorySlugs: draft.categorySlugs,
        }),
      draft.id ? 'Discount updated.' : 'Discount created.',
    );

    if (!draft.id) setDraft(BLANK);
  }

  return (
    <div className="discountman">
      <table>
        <thead>
          <tr>
            <th scope="col">Code</th>
            <th scope="col">Worth</th>
            <th scope="col">Window</th>
            <th scope="col">Used</th>
            <th scope="col">State</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {discounts.length === 0 ? (
            <tr>
              <td colSpan={6}>No discounts yet.</td>
            </tr>
          ) : null}

          {discounts.map((discount) => (
            <tr key={discount.id}>
              <td>{discount.code}</td>
              <td>{describe(discount)}</td>
              <td>
                {discount.startsAt ? discount.startsAt.slice(0, 10) : 'now'} →{' '}
                {discount.endsAt ? discount.endsAt.slice(0, 10) : 'open'}
              </td>
              <td>
                {discount.usedCount}
                {discount.usageLimit === null ? '' : ` / ${discount.usageLimit}`}
              </td>
              <td>{discount.redeemable ? 'Redeemable' : 'Not redeemable'}</td>
              <td>
                <button type="button" onClick={() => setDraft(draftFrom(discount))}>Edit</button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        archiveDiscountAction({
                          id: discount.id,
                          archived: !discount.archived,
                        }),
                      discount.archived ? 'Restored.' : 'Archived.',
                    )
                  }
                >
                  {discount.archived ? 'Restore' : 'Archive'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={save}>
        <h2>{draft.id ? `Edit ${draft.code}` : 'New discount'}</h2>

        <label>
          Code
          <input
            value={draft.code}
            onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })}
            required
          />
        </label>

        <label>
          Description
          <input
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </label>

        <label>
          Type
          <select
            value={draft.type}
            onChange={(event) =>
              setDraft({ ...draft, type: event.target.value as 'percentage' | 'fixed' })
            }
          >
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
        </label>

        <label>
          {draft.type === 'percentage' ? 'Percent off' : 'Dollars off'}
          <input
            type="number"
            step="0.01"
            min="0"
            value={draft.amount}
            onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
            required
          />
        </label>

        <label>
          Minimum order (dollars)
          <input
            type="number"
            step="0.01"
            min="0"
            value={draft.minOrder}
            onChange={(event) => setDraft({ ...draft, minOrder: event.target.value })}
          />
        </label>

        <label>
          Starts
          <input
            type="date"
            value={draft.startsAt}
            onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
          />
        </label>

        <label>
          Ends
          <input
            type="date"
            value={draft.endsAt}
            onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
          />
        </label>

        <label>
          Total uses (blank for unlimited)
          <input
            type="number"
            min="1"
            value={draft.usageLimit}
            onChange={(event) => setDraft({ ...draft, usageLimit: event.target.value })}
          />
        </label>

        <label>
          Uses per customer (blank for unlimited)
          <input
            type="number"
            min="1"
            value={draft.perCustomerLimit}
            onChange={(event) => setDraft({ ...draft, perCustomerLimit: event.target.value })}
          />
        </label>

        <fieldset>
          <legend>Limit to categories (none means all)</legend>
          {categorySlugs.map((slug) => (
            <label key={slug}>
              <input
                type="checkbox"
                checked={draft.categorySlugs.includes(slug)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    categorySlugs: event.target.checked
                      ? [...draft.categorySlugs, slug]
                      : draft.categorySlugs.filter((value) => value !== slug),
                  })
                }
              />
              {slug}
            </label>
          ))}
        </fieldset>

        <label>
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
          />
          Active
        </label>

        <button type="submit" disabled={pending}>
          {draft.id ? 'Save discount' : 'Create discount'}
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
