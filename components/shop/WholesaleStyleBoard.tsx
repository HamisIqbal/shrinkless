'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { formatCents } from '@/lib/money';
import { enquiryTotal, type WholesaleTier } from '@/lib/wholesale/pricing';
import { WholesaleEnquiryForm } from '@/components/shop/WholesaleEnquiryForm';
import type { WholesaleProductDetailDTO } from '@/types/dto';

type Props = {
  style: WholesaleProductDetailDTO;
  /** The style itself — gallery, spec, copy — rendered on the server. */
  children: ReactNode;
};

const UNITS = new Intl.NumberFormat('en-US');

/** What a chosen quantity contributes to the enquiry. */
export type ChosenLine = {
  slug: string;
  title: string;
  tier: WholesaleTier;
  unitPriceCents: number;
  totalCents: number;
};

/**
 * One style, and the enquiry for it beside it.
 *
 * One piece of state: which tier, if any, is chosen. The line, the unit count,
 * the money and the field the form posts are all derived from it, so the panel
 * and the ladder cannot disagree about what has been asked for. Pressing the
 * chosen tier again clears it — otherwise a buyer who changed their mind about
 * the style entirely has no way back to "not ordering this" short of a reload.
 *
 * The figures are the server's, computed once in `lib/wholesale/pricing.ts`
 * and sent down with the style. Nothing is priced in the browser, and the form
 * posts a slug and a tier and no money at all — the action re-prices from the
 * database, so what the buyer saw and what the store receives are the same
 * numbers by construction rather than by agreement.
 *
 * The style itself arrives as `children` from the page, because a gallery and
 * a description have no state to keep and no business shipping to the browser.
 */
export function WholesaleStyleBoard({ style, children }: Props) {
  const [picked, setPicked] = useState<WholesaleTier | null>(null);

  const lines = useMemo<ChosenLine[]>(() => {
    if (!picked) return [];

    const quote = style.tiers.find((step) => step.tier === picked);
    if (!quote) return [];

    return [
      {
        slug: style.slug,
        title: style.title,
        tier: picked,
        unitPriceCents: quote.unitPriceCents,
        totalCents: quote.totalCents,
      },
    ];
  }, [style, picked]);

  const totals = useMemo(() => enquiryTotal(lines), [lines]);

  return (
    <div className="tradeboard">
      <div className="tradeboard__sheet tradestyle">
        {children}

        <div className="tradestyle__ladder">
          <div className="tradeboard__legend tradestyle__legend">
            <span>Units</span>
            <span>Per unit · line total</span>
          </div>

          <div
            className="sheetrow__tiers"
            role="group"
            aria-label={`Order quantity for ${style.title}`}
          >
            {style.tiers.map((step) => {
              const on = picked === step.tier;

              return (
                <button
                  key={step.tier}
                  type="button"
                  className={`tierbtn${on ? ' tierbtn--on' : ''}`}
                  aria-pressed={on}
                  onClick={() =>
                    setPicked((current) =>
                      current === step.tier ? null : (step.tier as WholesaleTier),
                    )
                  }
                >
                  <span className="tierbtn__qty tnum">{UNITS.format(step.tier)}</span>
                  <span className="tierbtn__unit tnum">
                    {formatCents(step.unitPriceCents)}
                  </span>
                  <span className="tierbtn__line tnum">
                    {formatCents(step.totalCents)}
                  </span>
                  {/* The discount is the argument for the bigger run, but a
                      fourth figure in the button would bury the three that
                      matter. Sighted buyers read it off the falling unit
                      price; a screen reader gets it said. */}
                  <span className="visually-hidden">
                    {`, ${step.discountPercent} percent off retail`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="tradepanel">
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
      </aside>
    </div>
  );
}
