import Image from 'next/image';
import Link from 'next/link';
import { BRAND_IMAGES, PRODUCT_IMAGES } from '@/lib/brand/images';

type Frame = {
  href: string;
  label: string;
  image: { url: string; alt: string };
};

/**
 * Landscape frames on an endless rail, wider than they are tall.
 *
 * These tiles used to be the Instagram strip, where they were brand
 * photography passed off as posts. Here they are simply the lookbook, which is
 * what they always were — and being honest about that also let them grow. A
 * square Instagram tile has to stay square; a lookbook frame can be as wide as
 * the photograph deserves, which is what makes this read as a campaign reel
 * rather than a contact sheet.
 *
 * The loop is the same seam-free trick as the ticker: the rail carries the set
 * twice and travels exactly half its own width, so copy two arrives where copy
 * one began. The second copy is `aria-hidden` and `inert` so each frame is
 * reachable exactly once.
 */
const FRAMES: Frame[] = [
  {
    href: '/product/mens-heavyweight-tee',
    label: 'Heavyweight Tee',
    image: PRODUCT_IMAGES['mens-heavyweight-tee'][1],
  },
  { href: '/why-shrinkless', label: 'The cotton', image: BRAND_IMAGES.fabric },
  {
    href: '/product/womens-boxy-tee',
    label: 'Boxy Tee',
    image: PRODUCT_IMAGES['womens-boxy-tee'][1],
  },
  { href: '/our-story', label: 'Cut and sewn', image: BRAND_IMAGES.craft },
  {
    href: '/product/womens-organic-tee',
    label: 'Organic Tee',
    image: PRODUCT_IMAGES['womens-organic-tee'][1],
  },
  { href: '/why-shrinkless', label: "Doesn't shrink", image: BRAND_IMAGES.hanging },
  {
    href: '/product/mens-organic-tee',
    label: 'Organic Tee',
    image: BRAND_IMAGES.torso,
  },
  { href: '/shop', label: 'The collection', image: BRAND_IMAGES.heather },
];

export function LookbookRail() {
  return (
    <section className="lookbook" aria-labelledby="lookbook-heading">
      <div className="wrap lookbook__head">
        <div>
          <p className="eyebrow">Lookbook</p>
          <h2 id="lookbook-heading" className="head lookbook__title">
            On the body.
          </h2>
        </div>

        <Link href="/shop" className="ulink lookbook__more">Shop all</Link>
      </div>

      <div className="lookbook__rail">
        {[0, 1].map((half) => (
          <div
            className="lookbook__half"
            key={half}
            aria-hidden={half === 1 || undefined}
            inert={half === 1 || undefined}
          >
            {FRAMES.map((frame, index) => (
              <Link key={`${half}-${index}`} href={frame.href} className="lookbook__tile">
                <Image
                  src={frame.image.url}
                  alt={frame.image.alt}
                  fill
                  loading="lazy"
                  sizes="(min-width: 62rem) 38rem, 80vw"
                  className="lookbook__image"
                />
                <span className="lookbook__label">{frame.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
