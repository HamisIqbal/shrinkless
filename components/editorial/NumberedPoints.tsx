import Image from 'next/image';
import type { BrandImage } from '@/lib/brand/images';
import { Reveal } from '@/components/ui/Reveal';

export type Point = {
  number: string;
  title: string;
  body: string;
};

type Props = {
  eyebrow?: string;
  headline: string;
  points: Point[];
  images: [BrandImage, BrandImage];
};

/**
 * Four numbered points interleaved with two full-height photographs on an
 * asymmetric grid, so the eye moves diagonally down the section.
 *
 * Deliberately not four equal cards, and deliberately no icons — the brief
 * asks for photography, typography and rules to carry the differentiation.
 */
export function NumberedPoints({ eyebrow, headline, points, images }: Props) {
  const [first, second] = images;

  return (
    <section className="band band--tall why" aria-labelledby="why-heading">
      <div className="wrap">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id="why-heading" className="head why__head">{headline}</h2>

        <div className="why__grid">
          <div className="why__media why__media--a">
            <div className="frame frame--45">
              <Image src={first.url} alt={first.alt} fill sizes="(min-width: 56.25rem) 33vw, 100vw" />
            </div>
          </div>

          {points.map((point, index) => (
            <Reveal key={point.number} index={index} className={`why__point why__point--${index + 1}`}>
              <article>
                <p className="why__number tnum">{point.number}</p>
                <h3 className="sub why__title">{point.title}</h3>
                <p className="why__body">{point.body}</p>
              </article>
            </Reveal>
          ))}

          <div className="why__media why__media--b">
            <div className="frame frame--45">
              <Image src={second.url} alt={second.alt} fill sizes="(min-width: 56.25rem) 33vw, 100vw" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
