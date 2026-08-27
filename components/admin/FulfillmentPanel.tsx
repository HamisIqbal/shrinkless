'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { transitionOrderAction } from '@/app/actions/admin/orders';
import type { OrderStatus } from '@/types/dto';

type Props = {
  orderId: string;
  status: OrderStatus;
  trackingNumber: string;
  /** Where this order may legally go next, as the server sees it. */
  allowed: OrderStatus[];
};

const LABELS: Record<OrderStatus, string> = {
  pending: 'Back to pending',
  paid: 'Mark as paid',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
  cancelled: 'Cancel order',
  payment_failed: 'Mark payment failed',
};

/**
 * The buttons are built from the transitions the *server* says are legal,
 * rather than from a copy of the rules kept here. One state machine, in
 * `lib/services/orders.ts`; this only renders it.
 *
 * Cancelling and marking paid both move stock, so both ask first — marking
 * paid can fail outright if the units are no longer there, and that refusal is
 * shown rather than swallowed.
 */
export function FulfillmentPanel({ orderId, status, trackingNumber, allowed }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tracking, setTracking] = useState(trackingNumber);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function run(to: OrderStatus) {
    if (to === 'cancelled' && !window.confirm('Cancel this order and return its stock?')) {
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await transitionOrderAction({
        id: orderId,
        to,
        trackingNumber: tracking,
        note,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setNote('');
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="fulfillment-heading">
      <h2 id="fulfillment-heading">Fulfillment</h2>

      {allowed.includes('shipped') ? (
        <label>
          Tracking number
          <input value={tracking} onChange={(event) => setTracking(event.target.value)} />
        </label>
      ) : null}

      {allowed.length ? (
        <label>
          Note (recorded against the status change)
          <input value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
      ) : null}

      {allowed.map((to) => (
        <button key={to} type="button" disabled={pending} onClick={() => run(to)}>
          {LABELS[to]}
        </button>
      ))}

      {!allowed.length ? <p>This order is closed. No further status changes.</p> : null}

      {status === 'paid' ? (
        <p><small>Stock for this order has been taken from inventory.</small></p>
      ) : null}

      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
