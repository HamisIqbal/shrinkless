import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_IMAGES, type CategorySlug } from '@/lib/brand/images';

export type Gateway = {
  slug: CategorySlug;
  label: string;
  /** Real count, read from the catalogue. */
  count: number;
};

type Props = {
  gateways: Gateway[];
};

/**
 * The two shopping doors, as campaign blocks rather than nav links.
 *
 * Side by side on desktop, stacked on a phone, and each one a single large
 * frame — the whole tile is the target, so there is no hunting for a small
 * "shop" link in the corner. The label sits on the photograph rather than
 * underneath it, which is what keeps these reading as editorial and not as
 * two product cards that grew.
 */
export function CategoryGateway({ gateways }: Props) {
  return (
    <section className="gateway" aria-labelledby="gateway-heading">
      <h2 id="gateway-heading" className="visually-hidden">Shop by category</h2>

      <ul className="gateway__grid">
        {gateways.map((gateway) => {
          const image = CATEGORY_IMAGES[gateway.slug];

          return (
            <li key={gateway.slug} className="gateway__cell">
              <Link href={`/shop/${gateway.slug}`} className="gateway__tile">
                <div className="gateway__frame">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 48rem) 50vw, 100vw"
                    className="gateway__image"
                    style={image.focus ? { objectPosition: image.focus } : undefined}
                  />
                  <span className="gateway__wash" aria-hidden="true" />
                </div>

                <span className="gateway__body">
                  <span className="display gateway__label">{gateway.label}</span>
                  <span className="gateway__meta meta">
                    {gateway.count} {gateway.count === 1 ? 'style' : 'styles'}
                  </span>
                  <span className="gateway__cta">
                    Shop {gateway.label}
                    <span className="gateway__arrow" aria-hidden="true">&rarr;</span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
