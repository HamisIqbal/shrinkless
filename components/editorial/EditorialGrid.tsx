import Image from 'next/image';
import { BRAND_IMAGES, LIFESTYLE_SLOTS } from '@/lib/brand/images';
import { Reveal } from '@/components/ui/Reveal';

type Props = {
  eyebrow?: string;
  headline: string;
  follow: { href: string; label: string };
};

/**
 * Nine frames on a deliberately uneven grid — mixed 1:1 and 4:5, two tiles
 * spanning double width. A nine-up grid of identical squares reads as a
 * contact sheet; this reads as a spread.
 *
 * The unevenness survives to mobile as a two-column mosaic rather than
 * collapsing to a single stack, which would lose the whole effect.
 */
export function EditorialGrid({ eyebrow, headline, follow }: Props) {
  return (
    <section className="band band--tall lifestyle" aria-labelledby="lifestyle-heading">
      <div className="wrap">
        <div className="lifestyle__head">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2 id="lifestyle-heading" className="head">{headline}</h2>
          </div>

          <a href={follow.href} className="ulink" rel="noreferrer" target="_blank">
            {follow.label}
          </a>
        </div>

        <ul className="lifestyle__grid">
          {LIFESTYLE_SLOTS.map((slot, index) => {
            const image = BRAND_IMAGES[slot];

            return (
              <li key={slot} className={`lifestyle__cell lifestyle__cell--${index + 1}`}>
                <Reveal index={index}>
                  <div className={`frame ${image.aspect === '1:1' ? 'frame--11' : 'frame--45'} zoom`}>
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 56.25rem) 33vw, 50vw"
                    />
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
