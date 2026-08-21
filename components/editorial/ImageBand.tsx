import Image from 'next/image';
import type { BrandImage } from '@/lib/brand/images';

type Props = {
  image: BrandImage;
  eyebrow?: string;
  headline: string;
  body?: string;
  /** A single small glyph beside the eyebrow. Used once, for the flag. */
  glyph?: string;
};

/**
 * Full-bleed photograph with type laid over it. Used for MADE IN USA.
 *
 * The flag is a 12px glyph next to the eyebrow and appears exactly once on the
 * site — the message is craftsmanship, and decoration would undercut it.
 */
export function ImageBand({ image, eyebrow, headline, body, glyph }: Props) {
  return (
    <section className="imageband">
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes="100vw"
        className="imageband__image"
      />

      <div className="imageband__scrim" aria-hidden="true" />

      <div className="wrap imageband__inner">
        {eyebrow ? (
          <p className="eyebrow imageband__eyebrow">
            {glyph ? <span className="imageband__glyph" aria-hidden="true">{glyph}</span> : null}
            {eyebrow}
          </p>
        ) : null}

        <h2 className="display imageband__head">{headline}</h2>

        {body ? <p className="lede imageband__lede">{body}</p> : null}
      </div>
    </section>
  );
}
