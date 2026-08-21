'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { transitionOrderAction } from '@/app/actions/admin/orders';
import type { OrderStatus } from '@/types/dto';

type Props = {
  orderId: string;
  status: OrderStatus;
  trackingNumber: string;
};

export function FulfillmentPanel({ orderId, status, trackingNumber }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tracking, setTracking] = useState(trackingNumber);
  const [error, setError] = useState('');

  function run(to: OrderStatus) {
    setError('');
    startTransition(async () => {
      const result = await transitionOrderAction({ id: orderId, to, trackingNumber: tracking });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="fulfillment-heading">
      <h2 id="fulfillment-heading">Fulfillment</h2>

      {status === 'paid' && (
        <>
          <label>Tracking number
            <input value={tracking} onChange={(event) => setTracking(event.target.value)} />
          </label>
          <button type="button" disabled={pending} onClick={() => run('shipped')}>
            Mark as shipped
          </button>
        </>
      )}

      {status === 'shipped' && (
        <button type="button" disabled={pending} onClick={() => run('delivered')}>
          Mark as delivered
        </button>
      )}

      {(status === 'pending' || status === 'paid') && (
        <button type="button" disabled={pending} onClick={() => run('cancelled')}>
          Cancel order
        </button>
      )}

      {['delivered', 'cancelled', 'payment_failed'].includes(status) && (
        <p>This order is closed. No further actions.</p>
      )}

      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
