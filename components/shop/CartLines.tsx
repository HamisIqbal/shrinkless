'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { updateQuantityAction } from '@/app/actions/cart';
import { cloudinaryUrl } from '@/lib/cloudinary/url';
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
    <div className="cartlines">
      <ul>
        {lines.map((line) => (
          <li key={line.variantId} className="cartline">
            <div className="cartline__plate">
              {line.imagePublicId ? (
                <Image
                  src={cloudinaryUrl(line.imagePublicId, 'c_fill,w_240,h_300,q_auto,f_auto')}
                  alt={line.productTitle}
                  width={240}
                  height={300}
                  className="cartline__image"
                />
              ) : (
                <span className="cartline__unset" aria-hidden="true">{line.color}</span>
              )}
            </div>

            <div className="cartline__body">
              <h2 className="cartline__title">
                <Link href={`/product/${line.productSlug}`}>{line.productTitle}</Link>
              </h2>
              <p className="meta">{line.size.toUpperCase()} / {line.color}</p>
              <p className="meta tnum">{formatCents(line.unitPriceCents)} each</p>
            </div>

            <label className="field cartline__qty">
              Qty
              <input
                type="number"
                min={1}
                max={line.availableStock}
                defaultValue={line.quantity}
                disabled={pending}
                onChange={(event) => change(line.variantId, Number(event.target.value))}
              />
            </label>

            <div className="cartline__total">
              <p className="price tnum">{formatCents(line.lineTotalCents)}</p>
              <button
                type="button"
                className="btn btn--quiet"
                disabled={pending}
                onClick={() => change(line.variantId, 0)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p role="status" aria-live="polite" className={error ? 'notice notice--error' : undefined}>
        {error}
      </p>
    </div>
  );
}
