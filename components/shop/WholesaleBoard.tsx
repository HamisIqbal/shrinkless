'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { formatCents } from '@/lib/money';
import { imageUrl } from '@/lib/images';
import { cropStyle } from '@/lib/media/crop';
import { parseStory } from '@/lib/shop/story';
import { enquiryTotal, type WholesaleTier } from '@/lib/wholesale/pricing';
import { WholesaleEnquiryForm } from '@/components/shop/WholesaleEnquiryForm';
import type { WholesaleProductDTO } from '@/types/dto';

type Props = { styles: WholesaleProductDTO[] };

const UNITS = new Intl.NumberFormat('en-US');

/** What a chosen row contributes to the enquiry. */
export type ChosenLine = {
  slug: string;
  title: string;
  tier: WholesaleTier;
  unitPriceCents: number;
  totalCents: number;
};

/**
 * The line sheet, and the running enquiry beside it.
 *
 * One piece of state: which tier, if any, is chosen per style. Everything else
 * — the lines, the unit count, the money, the fields the form posts — is
 * derived from that map, so the panel and the rows cannot disagree about what
 * has been asked for. Choosing a second tier on a row REPLACES the first
 * rather than adding a line, because ordering one style at two quantities is
 * an order of the larger quantity.
 *
 * The figures are the server's, computed once in `lib/wholesale/pricing.ts`
 * and sent down with the styles. Nothing is priced in the browser, and the
 * form posts a slug and a tier and no money at all — the action re-prices from
 * the database, so what the buyer saw and what the store receives are the same
 * numbers by construction rather than by agreement.
 */
export function WholesaleBoard({ styles }: Props) {
  const [chosen, setChosen] = useState<Record<string, WholesaleTier>>({});

  const lines = useMemo<ChosenLine[]>(
    () =>
      styles.flatMap((style) => {
        const tier = chosen[style.slug];
        if (!tier) return [];

        const quote = style.tiers.find((step) => step.tier === tier);
        if (!quote) return [];

        return [
          {
            slug: style.slug,
            title: style.title,
            tier,
            unitPriceCents: quote.unitPriceCents,
            totalCents: quote.totalCents,
          },
        ];
      }),
    [styles, chosen],
  );

  const totals = useMemo(() => enquiryTotal(lines), [lines]);

  function toggle(slug: string, tier: WholesaleTier) {
    setChosen((current) => {
      // Pressing the chosen tier again clears the row. Without it, a buyer who
      // changed their mind about a style entirely has no way back to "not
      // ordering this" short of reloading the page.
      if (current[slug] === tier) {
        const cleared = { ...current };
        delete cleared[slug];
        return cleared;
      }

      return { ...current, [slug]: tier };
    });
  }

  return (
    <div className="tradeboard">
      <div className="tradeboard__sheet">
        <div className="tradeboard__legend" aria-hidden="true">
          <span>Style</span>
          <span>Units · per unit · line total</span>
        </div>

        <ol className="tradeboard__rows">
          {styles.map((style, index) => {
            const lead = parseStory(style.description).find(
              (block) => block.kind === 'paragraph',
            );

            const picked = chosen[style.slug];

            return (
              <li key={style.slug}>
                <article className={`sheetrow${picked ? ' sheetrow--chosen' : ''}`}>
                  <div className="sheetrow__frame frame">
                    {style.image ? (
                      <Image
                        src={imageUrl(style.image.publicId)}
                        alt={style.image.alt}
                        fill
                        sizes="(min-width: 62rem) 9rem, 5rem"
                        /* The first rows are above the fold on a laptop. */
                        loading={index < 2 ? 'eager' : 'lazy'}
                        style={cropStyle(style.image)}
                      />
                    ) : null}
                  </div>

                  <div className="sheetrow__body">
                    <h2 className="sheetrow__title">{style.title}</h2>

                    <p className="sheetrow__spec">
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

                    {lead?.kind === 'paragraph' ? (
                      <p className="sheetrow__copy">{lead.text}</p>
                    ) : null}
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
                          onClick={() => toggle(style.slug, step.tier as WholesaleTier)}
                        >
                          <span className="tierbtn__qty tnum">{UNITS.format(step.tier)}</span>
                          <span className="tierbtn__unit tnum">
                            {formatCents(step.unitPriceCents)}
                          </span>
                          <span className="tierbtn__line tnum">
                            {formatCents(step.totalCents)}
                          </span>
                          {/* The discount is the argument for the bigger run,
                              but a fourth figure in the button would bury the
                              three that matter. Sighted buyers read it off the
                              falling unit price; a screen reader gets it said. */}
                          <span className="visually-hidden">
                            {`, ${step.discountPercent} percent off retail`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
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
              Choose a quantity against a style and it collects here. Nothing is ordered
              and nothing is charged — this sends a request for real terms.
            </p>
          )}

          <WholesaleEnquiryForm lines={lines} onSent={() => setChosen({})} />
        </div>
      </aside>
    </div>
  );
}
