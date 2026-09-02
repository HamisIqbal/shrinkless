'use client';

import { useMemo, useRef, useState } from 'react';
import { ProductStory } from '@/components/shop/ProductStory';
import { StickyBuyBar } from '@/components/shop/StickyBuyBar';
import {
  WholesaleEnquiryForm,
  type ChosenLine,
} from '@/components/shop/WholesaleEnquiryForm';
import { formatCents } from '@/lib/money';
import { enquiryTotal, type WholesaleTier } from '@/lib/wholesale/pricing';
import type { WholesaleProductDetailDTO } from '@/types/dto';

type Props = { style: WholesaleProductDetailDTO };

const UNITS = new Intl.NumberFormat('en-US');

/**
 * The trade equivalent of `VariantPicker`, in the same order and the same
 * frame: price, story, spec, the choices, then the action that ends the page.
 *
 * The only difference is what a wholesale buyer actually chooses. There are no
 * per-unit variants to pick and no cart to add to, so the one control is the
 * quantity — a dropdown of this style's own tiers, read off `style.tiers` and
 * never hardcoded, because every style's ladder is struck from its own retail
 * basis. Choosing one re-prices the panel and fills the enquiry beneath it.
 *
 * Nothing is priced in the browser: the figures are the server's, and the form
 * still posts only `slug:tier` for the action to re-price from the database.
 */
export function WholesaleBuyPanel({ style }: Props) {
  const [picked, setPicked] = useState<WholesaleTier | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const enquiryRef = useRef<HTMLDivElement>(null);

  const chosen = useMemo(
    () => style.tiers.find((step) => step.tier === picked) ?? null,
    [style.tiers, picked],
  );

  const lines = useMemo<ChosenLine[]>(
    () =>
      chosen
        ? [
            {
              slug: style.slug,
              title: style.title,
              tier: chosen.tier as WholesaleTier,
              unitPriceCents: chosen.unitPriceCents,
              totalCents: chosen.totalCents,
            },
          ]
        : [],
    [chosen, style.slug, style.title],
  );

  const totals = useMemo(() => enquiryTotal(lines), [lines]);

  /** The opening rung, shown until a quantity is chosen. */
  const opening = style.tiers[0];

  const priceLabel = chosen
    ? `${formatCents(chosen.unitPriceCents)} per unit`
    : opening
      ? `From ${formatCents(opening.unitPriceCents)} per unit`
      : 'Price on request';

  const basis = chosen
    ? `${UNITS.format(chosen.tier)} units · ${formatCents(chosen.totalCents)} total`
    : opening
      ? `at ${UNITS.format(opening.tier)} units · ${formatCents(style.retailCents)} retail`
      : null;

  /** Both purchase actions do the same thing: put the form in front of you. */
  function goToEnquiry() {
    enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    enquiryRef.current
      ?.querySelector<HTMLInputElement>('#wholesale-company')
      ?.focus({ preventScroll: true });
  }

  return (
    <div className="picker">
      <p className="picker__price tnum">
        {priceLabel}
        {basis ? <span className="tradestyle__basis">{basis}</span> : null}
      </p>

      <ProductStory description={style.description} />

      <ul className="picker__spec">
        <li>Garment Dyed Organic Cotton</li>
        <li>Made in USA</li>
        <li>Made to order</li>
      </ul>

      {style.colors.length ? (
        <div className="picker__group">
          <p className="meta picker__legend">Colors</p>
          <div className="swatchrow">
            {style.colors.map((option) => (
              <span key={option} className="swatch swatch--static">
                <span className={`swatch__dot dot--${option}`} aria-hidden="true" />
                <span className="swatch__name">{option}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {style.sizes.length ? (
        <div className="picker__group">
          <p className="meta picker__legend">Sizes</p>
          <div className="chiprow">
            {style.sizes.map((option) => (
              <span key={option} className="chip chip--static">
                {option.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="picker__group">
        <label className="meta picker__legend" htmlFor="wholesale-quantity">
          Quantity — sold by the run
        </label>
        <select
          id="wholesale-quantity"
          className="picker__select"
          value={picked ?? ''}
          onChange={(event) => {
            const next = event.target.value;
            setPicked(next ? (Number(next) as WholesaleTier) : null);
          }}
        >
          <option value="">Choose a quantity</option>
          {style.tiers.map((step) => (
            <option key={step.tier} value={step.tier}>
              {`${UNITS.format(step.tier)} units — ${formatCents(
                step.unitPriceCents,
              )} per unit · ${formatCents(step.totalCents)}`}
            </option>
          ))}
        </select>

        {chosen ? (
          <p className="picker__total tnum" aria-live="polite">
            <span>Indicative total</span>
            <span>{formatCents(totals.totalCents)}</span>
          </p>
        ) : null}
      </div>

      <div className="picker__actions" ref={actionsRef}>
        <button
          type="button"
          className="btn btn--light btn--lg btn--block"
          onClick={goToEnquiry}
        >
          Request a quote
        </button>
      </div>

      <div className="pdp__enquiry" ref={enquiryRef}>
        <div className="tradepanel__inner">
          <h2 className="tradepanel__title">Your enquiry</h2>

          {lines.length ? (
            <>
              <ul className="tradepanel__lines">
                {lines.map((line) => (
                  <li key={line.slug} className="tradepanel__line">
                    <span className="tradepanel__style">{line.title}</span>
                    <span className="tradepanel__qty tnum">
                      {`${UNITS.format(line.tier)} × ${formatCents(line.unitPriceCents)}`}
                    </span>
                    <span className="tradepanel__money tnum">
                      {formatCents(line.totalCents)}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="tradepanel__total">
                <span className="tradepanel__totallabel">
                  Indicative total
                  <span className="tradepanel__units tnum">
                    {`${UNITS.format(totals.units)} units`}
                  </span>
                </span>
                <span className="tnum">{formatCents(totals.totalCents)}</span>
              </p>
            </>
          ) : (
            <p className="tradepanel__empty">
              Choose a quantity above and it collects here. Nothing is ordered and
              nothing is charged — this sends a request for real terms on this style.
            </p>
          )}

          <WholesaleEnquiryForm lines={lines} onSent={() => setPicked(null)} />
        </div>
      </div>

      {/* Wholesale has no cart and no checkout: the enquiry is the purchase
          action, so the bar carries the buyer back to it rather than growing a
          second, parallel way to ask for terms. */}
      <StickyBuyBar
        anchor={actionsRef}
        title={style.title}
        price={
          chosen
            ? `${UNITS.format(totals.units)} units · ${formatCents(totals.totalCents)}`
            : priceLabel
        }
      >
        <button type="button" className="btn btn--accent" onClick={goToEnquiry}>
          Request a quote
        </button>
      </StickyBuyBar>
    </div>
  );
}
