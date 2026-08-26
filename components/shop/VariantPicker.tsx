'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addToCartAction } from '@/app/actions/cart';
import { ProductStory } from '@/components/shop/ProductStory';
import { RestockForm } from '@/components/shop/RestockForm';
import { useToast } from '@/components/ui/Toast';
import { formatCents } from '@/lib/money';
import { sizeOrder } from '@/lib/shop/colorways';
import type { VariantDTO } from '@/types/dto';

type Props = {
  /** For the back-in-stock record, which is per product and per colourway. */
  slug: string;
  sizes: string[];
  colors: string[];
  variants: VariantDTO[];
  /** Sits under the price: the first thing read after the number. */
  description?: string;
  /** From `?color=` on the collection tiles, so the tile you clicked is selected. */
  initialColor?: string;
};

export function VariantPicker({
  slug,
  sizes,
  colors,
  variants,
  description,
  initialColor,
}: Props) {
  const router = useRouter();
  const toast = useToast();

  const [color, setColor] = useState(
    initialColor && colors.includes(initialColor) ? initialColor : (colors[0] ?? ''),
  );
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();

  const ordered = [...sizes].sort((a, b) => sizeOrder(a) - sizeOrder(b));

  function findVariant(nextSize: string, nextColor: string) {
    return variants.find(
      (variant) => variant.size === nextSize && variant.color === nextColor && variant.enabled,
    );
  }

  const selected = size ? findVariant(size, color) : undefined;
  const priced = selected ?? findVariant(ordered[0] ?? '', color);

  // Nothing in this colourway can be bought. The buttons say so rather than
  // sending a shopper round the "choose a size" loop with no size to choose:
  // every chip is disabled, so the error had no way to be acted on.
  const soldOut = ordered.every((option) => {
    const variant = findVariant(option, color);
    return !variant || !variant.inStock;
  });

  // The stepper cannot offer more than the shelf holds. Before a size is
  // picked there is no stock figure to cap against, so it opens at ten.
  const ceiling = Math.max(selected?.stock ?? 10, 1);
  const capped = Math.min(quantity, ceiling);

  function add(then?: () => void) {
    if (!selected) {
      toast('Choose a size first', 'error');
      return;
    }

    startTransition(async () => {
      const result = await addToCartAction(selected.id, capped);
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

      <ProductStory description={description} />

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
                onChange={() => {
                  setColor(option);
                  // A size the new colourway does not stock would otherwise stay
                  // lit while nothing was actually selected underneath it.
                  const carried = findVariant(size, option);
                  if (!carried || !carried.inStock) setSize('');
                }}
              />
              <span className={`swatch__dot dot--${option}`} aria-hidden="true" />
              <span className="swatch__name">{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {soldOut ? (
        <RestockForm slug={slug} color={color} />
      ) : (
        <>
      <fieldset className="picker__group">
        <legend className="meta picker__legend">Size</legend>
        <div className="chiprow">
          {ordered.map((option) => {
            const variant = findVariant(option, color);
            const unavailable = !variant || !variant.inStock;

            return (
              <label
                key={option}
                className={`chip${size === option ? ' chip--on' : ''}${
                  unavailable ? ' chip--sold' : ''
                }`}
                aria-disabled={unavailable || undefined}
                title={unavailable ? `${option.toUpperCase()} is sold out` : undefined}
              >
                <input
                  type="radio"
                  name="size"
                  value={option}
                  className="visually-hidden"
                  checked={size === option}
                  disabled={unavailable}
                  onChange={() => setSize(option)}
                />
                {option.toUpperCase()}
                {unavailable ? <span className="visually-hidden"> (sold out)</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="picker__group">
        <p className="meta picker__legend" id="qty-label">Quantity</p>
        <div className="stepper picker__qty" role="group" aria-labelledby="qty-label">
          <button
            type="button"
            className="stepper__button"
            disabled={capped <= 1}
            aria-label="Decrease quantity"
            onClick={() => setQuantity(Math.max(capped - 1, 1))}
          >
            &minus;
          </button>

          <span className="stepper__value tnum" aria-live="polite">{capped}</span>

          <button
            type="button"
            className="stepper__button"
            disabled={capped >= ceiling}
            aria-label="Increase quantity"
            onClick={() => setQuantity(Math.min(capped + 1, ceiling))}
          >
            +
          </button>

          {selected ? (
            <span
              className={`picker__stock${selected.stock > 5 ? ' picker__stock--in' : ''}`}
            >
              {selected.stock <= 5 ? `Only ${selected.stock} left` : 'In stock'}
            </span>
          ) : null}
        </div>
      </div>

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
          className="btn btn--accent btn--lg btn--block"
          onClick={() => add(() => router.push('/cart'))}
          disabled={pending}
        >
          Buy now
        </button>
      </div>
        </>
      )}
    </div>
  );
}
