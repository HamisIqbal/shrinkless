import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWholesaleProductBySlug } from '@/lib/services/wholesale';
import { WHOLESALE_TIERS } from '@/lib/wholesale/pricing';
import { formatCents } from '@/lib/money';
import { imageUrl } from '@/lib/images';
import { cropStyle } from '@/lib/media/crop';
import { ProductStory } from '@/components/shop/ProductStory';
import { WholesaleStyleBoard } from '@/components/shop/WholesaleStyleBoard';

const UNITS = new Intl.NumberFormat('en-US');

export async function generateMetadata(props: PageProps<'/wholesale/[slug]'>) {
  const { slug } = await props.params;
  const style = await getWholesaleProductBySlug(slug);

  if (!style) return { title: 'Wholesale' };

  return {
    title: `${style.title} — Wholesale`,
    description: `Trade terms for ${style.title}: made to order from ${UNITS.format(
      WHOLESALE_TIERS[0],
    )} units. Request a quote.`,
  };
}

/**
 * One style on the line sheet.
 *
 * The sheet's contents page carries a frame, a name and the opening figure;
 * everything else about a style lives here — the whole gallery, the spec, the
 * copy, the five-tier ladder — beside the enquiry form, which is now asking
 * about this style and nothing else. Same ink ground and same paper panel as
 * the sheet, because a buyer arriving from a card should not feel they have
 * left the document.
 */
export default async function WholesaleStylePage(
  props: PageProps<'/wholesale/[slug]'>,
) {
  const { slug } = await props.params;
  const style = await getWholesaleProductBySlug(slug);

  if (!style) notFound();

  const opening = style.tiers[0];

  return (
    <div className="band band--ink tradesheet tradestyle-page">
      <div className="wrap">
        <nav aria-label="Breadcrumb" className="tradestyle__crumbs">
          <ol className="crumbs">
            <li>
              <Link href="/wholesale" className="ulink">Wholesale</Link>
            </li>
            <li aria-hidden="true" className="crumbs__sep">/</li>
            <li>{style.title}</li>
          </ol>
        </nav>

        <WholesaleStyleBoard style={style}>
          <header className="tradestyle__head">
            <h1 className="tradestyle__title">{style.title}</h1>

            <p className="sheetrow__spec tradestyle__spec">
              <span className="sheetrow__gender">{style.category}</span>
              {style.sizes.length ? (
                <span className="sheetrow__fact">
                  {style.sizes.join(' · ').toUpperCase()}
                </span>
              ) : null}
              {style.colors.length ? (
                <span className="sheetrow__fact">{style.colors.join(', ')}</span>
              ) : null}
            </p>

            {opening ? (
              <p className="tradestyle__price tnum">
                {`From ${formatCents(opening.unitPriceCents)} per unit`}
                <span className="tradestyle__basis">
                  {`at ${UNITS.format(opening.tier)} units · ${formatCents(
                    style.retailCents,
                  )} retail`}
                </span>
              </p>
            ) : null}
          </header>

          {style.images.length ? (
            <div className="tradestyle__gallery">
              {style.images.map((frame, index) => (
                <div key={frame.publicId} className="tradestyle__shot frame">
                  <Image
                    src={imageUrl(frame.publicId)}
                    alt={frame.alt}
                    fill
                    sizes="(min-width: 68rem) 30rem, (min-width: 48rem) 45vw, 92vw"
                    /* The first frame is the one on screen when the page opens. */
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    style={cropStyle(frame)}
                  />
                </div>
              ))}
            </div>
          ) : null}

          <ProductStory description={style.description} />
        </WholesaleStyleBoard>
      </div>
    </div>
  );
}
