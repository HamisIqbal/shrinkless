'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCents } from '@/lib/money';
import { imageUrl } from '@/lib/images';
import { toColorways } from '@/lib/shop/colorways';
import type { ProductDTO } from '@/types/dto';

type Props = {
  product: ProductDTO;
  /** Grid position, so the first row can skip lazy loading. */
  index?: number;
  onQuickView: (product: ProductDTO) => void;
};

/**
 * Image, name, price — in that order of weight.
 *
 * The frame is a fixed 4:5 for every card regardless of what shape the source
 * photograph is, because a grid where one product is taller than its
 * neighbours reads as broken rather than as editorial (spec §17).
 *
 * The colour dots are the image switcher, not decoration: picking one swaps
 * the frame and carries the choice through to the product page. That is the
 * one interaction worth having on a card, so it is the only one here — the
 * quick-view control stays hidden until the card is hovered, and is
 * permanently visible only where there is no hover to depend on.
 */
export function ProductCard({ product, index = 0, onQuickView }: Props) {
  const colorways = useMemo(() => toColorways(product), [product]);
  const [active, setActive] = useState(0);

  const colorway = colorways[active] ?? colorways[0];
  const image = colorway?.image ?? (product.images[0]
    ? { url: product.images[0].publicId, alt: product.images[0].alt }
    : null);

  const soldOut = colorways.every((option) => !option.inStock);
  const href = colorway
    ? `/product/${product.slug}?color=${encodeURIComponent(colorway.color)}`
    : `/product/${product.slug}`;

  return (
    <article className="pcard">
      <div className="pcard__media">
        <Link href={href} className="pcard__plate" tabIndex={-1} aria-hidden="true">
          <div className="frame frame--45">
            {image ? (
              <Image
                src={imageUrl(image.url, 'c_fill,w_1000,h_1250,q_auto,f_auto')}
                alt=""
                fill
                loading={index < 2 ? undefined : 'lazy'}
                priority={index < 2}
                sizes="(min-width: 62rem) 30vw, (min-width: 48rem) 45vw, 50vw"
              />
            ) : null}
          </div>
        </Link>

        {soldOut ? <p className="pcard__flag">Sold out</p> : null}

        <button
          type="button"
          className="pcard__quick"
          onClick={() => onQuickView(product)}
        >
          <span className="pcard__quickmark" aria-hidden="true" />
          <span className="visually-hidden">Quick view: {product.title}</span>
        </button>
      </div>

      <div className="pcard__foot">
        <h3 className="pcard__title">
          <Link href={href} className="pcard__link">
            {product.title}
            <span className="visually-hidden">
              {colorway ? `, ${colorway.color}` : ''}
            </span>
          </Link>
        </h3>

        <p className="pcard__price tnum">
          {formatCents(colorway?.priceCents ?? product.minPriceCents)}
        </p>
      </div>

      {colorways.length > 1 ? (
        <ul className="pcard__colors">
          {colorways.map((option, optionIndex) => (
            <li key={option.color}>
              <button
                type="button"
                className={`swatchdot dot--${option.color}${
                  optionIndex === active ? ' swatchdot--on' : ''
                }`}
                aria-pressed={optionIndex === active}
                onMouseEnter={() => setActive(optionIndex)}
                onFocus={() => setActive(optionIndex)}
                onClick={() => setActive(optionIndex)}
              >
                <span className="visually-hidden">Show {option.color}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
