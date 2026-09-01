import { listWholesaleProducts } from '@/lib/services/wholesale';
import { WHOLESALE_TIERS } from '@/lib/wholesale/pricing';
import { WholesaleBoard } from '@/components/shop/WholesaleBoard';

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
 * a document, comparing per-unit figures across ten styles and five order
 * sizes, and wants them in a column they can run their eye down. So this page
 * is a sheet: ink ground, tabular figures, one row per style, and the frame
 * shrunk to a thumbnail rather than given the page.
 *
 * Nothing here can be bought. At 150 units a price is the opening of a
 * conversation, not a checkout — so the page collects an enquiry and the store
 * replies with real terms.
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
          <WholesaleBoard styles={styles} />
        ) : (
          <p className="tradesheet__empty">
            The line sheet is being updated. Email us and we will send the current one.
          </p>
        )}
      </div>
    </div>
  );
}
