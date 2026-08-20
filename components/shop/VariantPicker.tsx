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
      setMessage(result.ok ? 'Added to cart' : result.error);
    });
  }

  return (
    <div>
      <fieldset>
        <legend>Size</legend>
        {sizes.map((option) => {
          const variant = findVariant(option, color);
          return (
            <label key={option}>
              <input
                type="radio"
                name="size"
                value={option}
                checked={size === option}
                disabled={!variant || !variant.inStock}
                onChange={() => setSize(option)}
              />
              {option.toUpperCase()}
              {variant && !variant.inStock ? ' (sold out)' : ''}
            </label>
          );
        })}
      </fieldset>

      <fieldset>
        <legend>Colour</legend>
        {colors.map((option) => (
          <label key={option}>
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
      </fieldset>

      <p>{selected ? formatCents(selected.priceCents) : 'Unavailable'}</p>

      <button type="button" onClick={add} disabled={!selected || !selected.inStock || pending}>
        {pending ? 'Adding…' : 'Add to cart'}
      </button>

      <p role="status" aria-live="polite">{message}</p>
    </div>
  );
}
