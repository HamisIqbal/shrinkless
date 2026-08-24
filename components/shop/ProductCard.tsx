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
 * Image, name, price — in that order of weight, and by a wide margin. The
 * frame is most of the card; the name and price are captions under it.
 *
 * Every card crops to the same 3:4 regardless of the source photograph's
 * shape, because a grid where one product is taller than its neighbours reads
 * as broken rather than as editorial.
 *
 * One index drives everything. The arrows step through the product's frames;
 * the colour dots jump to the frame for that colour (images and colours are
 * stored positionally, which the seed guarantees); and the price and the link
 * follow whichever colourway that index lands on. Two separate indices would
 * let the picture and the price disagree.
 */
export function ProductCard({ product, index = 0, onQuickView }: Props) {
  const colorways = useMemo(() => toColorways(product), [product]);
  const [shot, setShot] = useState(0);

  const frames = product.images;
  const hasFrames = frames.length > 0;
  const many = frames.length > 1;

  const colorway = colorways[Math.min(shot, colorways.length - 1)] ?? colorways[0];
  const image = frames[shot] ?? frames[0];

  const soldOut = colorways.every((option) => !option.inStock);
  const href = colorway
    ? `/product/${product.slug}?color=${encodeURIComponent(colorway.color)}`
    : `/product/${product.slug}`;

  const step = (delta: number) =>
    setShot((current) => (current + delta + frames.length) % frames.length);

  return (
    <article className="pcard">
      <div className="pcard__media">
        <Link href={href} className="pcard__plate" tabIndex={-1} aria-hidden="true">
          <div className="frame frame--34">
            {hasFrames ? (
              <Image
                src={imageUrl(image.publicId, 'c_fill,w_1200,h_1600,q_auto,f_auto')}
                alt=""
                fill
                loading={index < 2 ? undefined : 'lazy'}
                priority={index < 2}
                sizes="(min-width: 75rem) 33vw, (min-width: 48rem) 48vw, 50vw"
              />
            ) : null}
          </div>
        </Link>

        {soldOut ? <p className="pcard__flag">Sold out</p> : null}

        <button type="button" className="pcard__preview" onClick={() => onQuickView(product)}>
          Preview
          <span className="visually-hidden"> {product.title}</span>
        </button>

        {many ? (
          <>
            <button
              type="button"
              className="pcard__step pcard__step--prev"
              onClick={() => step(-1)}
            >
              <span className="pcard__chev" aria-hidden="true" />
              <span className="visually-hidden">Previous image of {product.title}</span>
            </button>

            <button
              type="button"
              className="pcard__step pcard__step--next"
              onClick={() => step(1)}
            >
              <span className="pcard__chev" aria-hidden="true" />
              <span className="visually-hidden">Next image of {product.title}</span>
            </button>

            <ol className="pcard__ticks" aria-hidden="true">
              {frames.map((frame, i) => (
                <li
                  key={frame.publicId}
                  className={`pcard__tick${i === shot ? ' pcard__tick--on' : ''}`}
                />
              ))}
            </ol>
          </>
        ) : null}
      </div>

      <div className="pcard__foot">
        <h3 className="pcard__title">
          <Link href={href} className="pcard__link">
            {product.title}
            <span className="visually-hidden">{colorway ? `, ${colorway.color}` : ''}</span>
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
                  optionIndex === Math.min(shot, colorways.length - 1)
                    ? ' swatchdot--on'
                    : ''
                }`}
                aria-pressed={optionIndex === Math.min(shot, colorways.length - 1)}
                onMouseEnter={() => setShot(optionIndex)}
                onFocus={() => setShot(optionIndex)}
                onClick={() => setShot(optionIndex)}
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
