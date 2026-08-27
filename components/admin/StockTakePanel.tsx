'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLowStockThresholdAction, setStockAction } from '@/app/actions/admin/inventory';

/**
 * The absolute-set half of inventory: a stock take, and the low-stock
 * threshold for this variant.
 *
 * Setting a count is deliberately separated from adjusting one. An adjustment
 * says what happened; a stock take says what is true. Both are recorded, both
 * name the person, and the service refuses either if it would leave stock
 * negative.
 */
export function StockTakePanel({
  variantId,
  stock,
  threshold,
}: {
  variantId: string;
  stock: number;
  threshold: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [count, setCount] = useState(String(stock));
  const [note, setNote] = useState('');
  const [override, setOverride] = useState(threshold === null ? '' : String(threshold));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function submitCount(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    const value = Number(count);
    if (!Number.isInteger(value) || value < 0) {
      setError('A count has to be a whole number, zero or more.');
      return;
    }

    startTransition(async () => {
      const result = await setStockAction({ variantId, stock: value, note });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setNote('');
      setMessage(`Counted ${result.data.stock}.`);
      router.refresh();
    });
  }

  function submitThreshold(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    const value = override.trim() === '' ? null : Number(override);
    if (value !== null && (!Number.isInteger(value) || value < 0)) {
      setError('A threshold has to be a whole number, zero or more.');
      return;
    }

    startTransition(async () => {
      const result = await setLowStockThresholdAction({ variantId, threshold: value });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage(value === null ? 'Using the store default.' : `Low at ${value}.`);
      router.refresh();
    });
  }

  return (
    <div className="stocktake">
      <form onSubmit={submitCount}>
        <h2>Stock take</h2>

        <label>
          Counted
          <input
            type="number"
            min={0}
            step={1}
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </label>

        <label>
          Note
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why the count changed"
          />
        </label>

        <button type="submit" disabled={pending}>Record count</button>
      </form>

      <form onSubmit={submitThreshold}>
        <h2>Low-stock threshold</h2>

        <label>
          Low at
          <input
            type="number"
            min={0}
            step={1}
            value={override}
            onChange={(event) => setOverride(event.target.value)}
            placeholder="Store default"
          />
        </label>

        <button type="submit" disabled={pending}>Save threshold</button>
      </form>

      {error ? <p role="alert">{error}</p> : null}
      {!error && message ? <p>{message}</p> : null}
    </div>
  );
}
