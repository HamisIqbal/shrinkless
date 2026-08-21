'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCents } from '@/lib/money';
import { imageUrl } from '@/lib/images';
import { addToCartAction } from '@/app/actions/cart';
import type { VariantDTO } from '@/types/dto';

type Props = {
  slug: string;
  title: string;
  color: string;
  priceCents: number;
  image: { url: string; alt: string } | null;
  variants: VariantDTO[];
};

/**
 * One colourway, not one product. The catalogue holds a single tee in three
 * colours, so the grid shows the colours — which is what the customer is
 * actually choosing between.
 *
 * Quick add expands the size run inside the tile rather than guessing a size
 * or opening a modal. On touch devices the trigger is always visible, because
 * a hover-only affordance is unreachable on a phone.
 */
export function CollectionTile({ slug, title, color, priceCents, image, variants }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const href = `/product/${slug}?color=${encodeURIComponent(color)}`;
  const soldOut = variants.every((variant) => !variant.inStock);

  function add(variant: VariantDTO) {
    setError('');

    startTransition(async () => {
      const result = await addToCartAction(variant.id, 1);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <article className="tile">
      <Link href={href} className="tile__plate">
        <div className="frame frame--45">
          {image ? (
            <Image
              src={imageUrl(image.url, 'c_fill,w_900,h_1125,q_auto,f_auto')}
              alt={image.alt || `${title} in ${color}`}
              fill
              sizes="(min-width: 56.25rem) 33vw, 100vw"
            />
          ) : null}
        </div>
      </Link>

      <div className="tile__foot">
        <h3 className="tile__title">
          <Link href={href}>{title}</Link>
        </h3>
        <p className="tile__color">{color}</p>
        <p className="tile__price tnum">{formatCents(priceCents)}</p>
      </div>

      {soldOut ? (
        <p className="tile__quick tile__quick--sold">Sold out</p>
      ) : (
        <button
          type="button"
          className="tile__quick ulink"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Quick add'}
        </button>
      )}

      {open ? (
        <div className="tile__sizes">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              className="sizechip"
              disabled={!variant.inStock || pending}
              aria-disabled={!variant.inStock}
              onClick={() => add(variant)}
            >
              {variant.size.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="notice notice--error tile__error">{error}</p> : null}
    </article>
  );
}
