'use client';

import { useState, useTransition } from 'react';
import { addToCartAction } from '@/app/actions/cart';
import { formatCents } from '@/lib/money';
import type { VariantDTO } from '@/types/dto';

type Props = {
  sizes: string[];
  colors: string[];
  variants: VariantDTO[];
};

export function VariantPicker({ sizes, colors, variants }: Props) {
  const [size, setSize] = useState(sizes[0] ?? '');
  const [color, setColor] = useState(colors[0] ?? '');
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const selected = variants.find(
    (variant) => variant.size === size && variant.color === color && variant.enabled,
  );

  function findVariant(nextSize: string, nextColor: string) {
    return variants.find(
      (variant) => variant.size === nextSize && variant.color === nextColor && variant.enabled,
    );
  }

  function add() {
    if (!selected) return;

    startTransition(async () => {
      const result = await addToCartAction(selected.id, 1);
      setFailed(!result.ok);
      setMessage(result.ok ? 'Added to cart' : result.error);
    });
  }

  return (
    <div className="picker stack-lg">
      <fieldset>
        <legend className="meta picker__legend">Size</legend>
        <div className="chip-row">
          {sizes.map((option) => {
            const variant = findVariant(option, color);
            const unavailable = !variant || !variant.inStock;

            return (
              <label key={option} className="chip">
                <input
                  type="radio"
                  name="size"
                  value={option}
                  checked={size === option}
                  disabled={unavailable}
                  onChange={() => setSize(option)}
                />
                {option.toUpperCase()}
                {variant && !variant.inStock ? (
                  <span className="sr-only"> (sold out)</span>
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="meta picker__legend">Colour</legend>
        <div className="chip-row">
          {colors.map((option) => (
            <label key={option} className="chip">
              <input
                type="radio"
                name="color"
                value={option}
                checked={color === option}
                onChange={() => setColor(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="picker__buy">
        <p className="price price--lg tnum">
          {selected ? formatCents(selected.priceCents) : 'Unavailable'}
        </p>

        <button
          type="button"
          className="btn btn--spot"
          onClick={add}
          disabled={!selected || !selected.inStock || pending}
        >
          {pending ? 'Adding…' : 'Add to cart'}
        </button>
      </div>

      {selected ? (
        <p className="meta tnum">
          {selected.sku} — {selected.inStock ? `${selected.stock} in stock` : 'Sold out'}
        </p>
      ) : (
        <p className="meta">That combination is not made.</p>
      )}

      <p
        role="status"
        aria-live="polite"
        className={message ? `notice ${failed ? 'notice--error' : 'notice--ok'}` : undefined}
      >
        {message}
      </p>
    </div>
  );
}
