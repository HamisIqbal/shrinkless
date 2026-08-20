'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { updateQuantityAction } from '@/app/actions/cart';
import { formatCents } from '@/lib/money';
import type { CartLineDTO } from '@/types/dto';

export function CartLines({ lines }: { lines: CartLineDTO[] }) {
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function change(variantId: string, quantity: number) {
    startTransition(async () => {
      const result = await updateQuantityAction(variantId, quantity);
      setError(result.ok ? '' : result.error);
    });
  }

  return (
    <div>
      <ul>
        {lines.map((line) => (
          <li key={line.variantId}>
            <Link href={`/product/${line.productSlug}`}>{line.productTitle}</Link>
            <p>{line.size.toUpperCase()} / {line.color}</p>
            <p>{formatCents(line.unitPriceCents)} each</p>

            <label>
              Quantity
              <input
                type="number"
                min={1}
                max={line.availableStock}
                defaultValue={line.quantity}
                disabled={pending}
                onChange={(event) => change(line.variantId, Number(event.target.value))}
              />
            </label>

            <p>{formatCents(line.lineTotalCents)}</p>

            <button type="button" disabled={pending} onClick={() => change(line.variantId, 0)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <p role="status" aria-live="polite">{error}</p>
    </div>
  );
}
