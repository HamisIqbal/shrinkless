'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addToCartAction } from '@/app/actions/cart';
import { useToast } from '@/components/ui/Toast';
import { formatCents } from '@/lib/money';
import { sizeOrder } from '@/lib/shop/colorways';
import type { VariantDTO } from '@/types/dto';

type Props = {
  sizes: string[];
  colors: string[];
  variants: VariantDTO[];
  /** From `?color=` on the collection tiles, so the tile you clicked is selected. */
  initialColor?: string;
};

export function VariantPicker({ sizes, colors, variants, initialColor }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [color, setColor] = useState(
    initialColor && colors.includes(initialColor) ? initialColor : (colors[0] ?? ''),
  );
  const [size, setSize] = useState('');
  const [pending, startTransition] = useTransition();

  const ordered = [...sizes].sort((a, b) => sizeOrder(a) - sizeOrder(b));

  function findVariant(nextSize: string, nextColor: string) {
    return variants.find(
      (variant) => variant.size === nextSize && variant.color === nextColor && variant.enabled,
    );
  }

  const selected = size ? findVariant(size, color) : undefined;
  const priced = selected ?? findVariant(ordered[0] ?? '', color);

  function add(then?: () => void) {
    if (!selected) {
      toast('Choose a size first', 'error');
      return;
    }

    startTransition(async () => {
      const result = await addToCartAction(selected.id, 1);
      toast(result.ok ? 'Added to cart' : result.error, result.ok ? 'ok' : 'error');

      if (result.ok) {
        router.refresh();
        then?.();
      }
    });
  }

  return (
    <div className="picker">
      <p className="picker__price tnum">
        {priced ? formatCents(priced.priceCents) : 'Unavailable'}
      </p>

      <ul className="picker__spec">
        <li>Garment Dyed Organic Cotton</li>
        <li>Made in USA</li>
        <li>Doesn&rsquo;t Shrink</li>
      </ul>

      <fieldset className="picker__group">
        <legend className="meta picker__legend">Color</legend>
        <div className="swatchrow">
          {colors.map((option) => (
            <label key={option} className={`swatch${color === option ? ' swatch--on' : ''}`}>
              <input
                type="radio"
                name="color"
                value={option}
                className="visually-hidden"
                checked={color === option}
                onChange={() => setColor(option)}
              />
              <span className={`swatch__dot dot--${option}`} aria-hidden="true" />
              <span className="swatch__name">{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="picker__group">
        <legend className="meta picker__legend">Size</legend>
        <div className="chiprow">
          {ordered.map((option) => {
            const variant = findVariant(option, color);
            const soldOut = !variant || !variant.inStock;

            return (
              <label
                key={option}
                className={`chip${size === option ? ' chip--on' : ''}${soldOut ? ' chip--sold' : ''}`}
              >
                <input
                  type="radio"
                  name="size"
                  value={option}
                  className="visually-hidden"
                  checked={size === option}
                  disabled={soldOut}
                  onChange={() => setSize(option)}
                />
                {option.toUpperCase()}
                {soldOut ? <span className="visually-hidden"> (sold out)</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="picker__actions">
        <button
          type="button"
          className="btn btn--lg btn--block"
          onClick={() => add()}
          disabled={pending}
        >
          {pending ? 'Adding' : 'Add to cart'}
        </button>

        {/* /checkout does not exist until Phase 5, so Buy now adds and goes to
            the cart rather than pretending to be an express checkout. */}
        <button
          type="button"
          className="btn btn--outline btn--lg btn--block"
          onClick={() => add(() => router.push('/cart'))}
          disabled={pending}
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
