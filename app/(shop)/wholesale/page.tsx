import Image from 'next/image';
import Link from 'next/link';
import { listWholesaleProducts } from '@/lib/services/wholesale';
import { WHOLESALE_TIERS } from '@/lib/wholesale/pricing';
import { formatCents } from '@/lib/money';
import { imageUrl } from '@/lib/images';
import { cropStyle } from '@/lib/media/crop';

export const metadata = {
  title: 'Wholesale',
  description:
    'Shrinkless trade terms: ten styles, made to order, from 150 units. Request a quote.',
};

const UNITS = new Intl.NumberFormat('en-US');

/**
 * The trade line sheet.
 *
 * Deliberately not the shop with different numbers on it. The retail pages
 * lead with photography and hide everything else behind a filter panel,
 * because a shopper is choosing a thing to wear; a wholesale buyer is reading
 * a document, comparing styles before they compare quantities. So this page is
 * the contents of the sheet — ink ground, one card per style, a frame, a name
 * and the opening figure — and the ladder, the spec and the enquiry itself
 * live on the style's own page, where a buyer is asking about one thing.
 *
 * Nothing here can be bought. At 150 units a price is the opening of a
 * conversation, not a checkout — so the sheet collects an enquiry and the
 * store replies with real terms.
 */
export default async function WholesalePage() {
  const styles = await listWholesaleProducts();

  const first = WHOLESALE_TIERS[0];
  const last = WHOLESALE_TIERS[WHOLESALE_TIERS.length - 1];

  return (
    <div className="band band--ink tradesheet">
      <div className="wrap">
        <header className="tradesheet__head">
          <p className="eyebrow tradesheet__eyebrow">Trade</p>
          <h1 className="display tradesheet__title">Wholesale</h1>

          <p className="lede tradesheet__intro">
            Ten styles, cut and sewn to order in the United States on the same cloth and
            the same dye process as the shop. Runs start at {UNITS.format(first)} units and
            the per-unit price falls the whole way to {UNITS.format(last)}.
          </p>

          <dl className="tradesheet__terms">
            <div className="tradesheet__term">
              <dt>Minimum</dt>
              <dd className="tnum">{UNITS.format(first)} units per style</dd>
            </div>
            <div className="tradesheet__term">
              <dt>Lead time</dt>
              <dd className="tnum">6–8 weeks from approval</dd>
            </div>
            <div className="tradesheet__term">
              <dt>Sizing</dt>
              <dd>Ratio broken to your spec</dd>
            </div>
            <div className="tradesheet__term">
              <dt>Terms</dt>
              <dd>50% deposit, balance on despatch</dd>
            </div>
          </dl>
        </header>

        {styles.length ? (
          <ol className="tradecards">
            {styles.map((style, index) => {
              const opening = style.tiers[0];

              return (
                <li key={style.slug} className="tradecards__item">
                  {/* The whole card is the link: one target, one hover, and
                      nothing inside it competing for the same click. */}
                  <Link href={`/wholesale/${style.slug}`} className="tradecard">
                    <div className="tradecard__frame frame">
                      {style.image ? (
                        <Image
                          src={imageUrl(style.image.publicId)}
                          alt={style.image.alt}
                          fill
                          sizes="(min-width: 62rem) 22rem, (min-width: 40rem) 45vw, 92vw"
                          /* The first row is above the fold on a laptop. */
                          loading={index < 3 ? 'eager' : 'lazy'}
                          style={cropStyle(style.image)}
                        />
                      ) : null}
                    </div>

                    <h2 className="tradecard__title">{style.title}</h2>

                    <p className="tradecard__price tnum">
                      {opening ? (
                        <>
                          <span className="tradecard__from">From</span>
                          {formatCents(opening.unitPriceCents)}
                          <span className="tradecard__per">
                            {` per unit at ${UNITS.format(opening.tier)}`}
                          </span>
                        </>
                      ) : (
                        <span className="tradecard__from">Price on request</span>
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="tradesheet__empty">
            The line sheet is being updated. Email us and we will send the current one.
          </p>
        )}
      </div>
    </div>
  );
}
