'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { BrandImage } from '@/lib/brand/images';

export type HeroSlide = {
  image: BrandImage;
  /** Short line naming what is in the frame. Changes with the slide. */
  caption: string;
};

type Props = {
  slides: HeroSlide[];
  eyebrow: string;
  headline: string[];
  lede: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  /** Milliseconds each frame holds before the next one takes over. */
  interval?: number;
};

/**
 * The campaign hero: a stack of frames cycling 1 → 2 → 3 → 4 → 1, forever.
 *
 * The incoming frame wipes across the outgoing one rather than dissolving into
 * it. A cross-dissolve spends its whole duration showing two photographs at
 * partial opacity, which reads as a double exposure — the one thing that makes
 * a campaign look cheap. Wiping keeps both frames fully opaque, so at every
 * moment you are looking at a real photograph. Under it the frame settles out
 * of a slight over-scale across the whole hold, so the image is always drifting
 * rather than sitting still and then cutting.
 *
 * The caption is the only text that changes; the headline is the brand
 * statement and stays put, so there is exactly one stable `<h1>` on the page.
 *
 * The image stack animates in CSS rather than through Motion: it is the
 * heaviest thing on the page and `opacity`/`transform` on a handful of nodes
 * is cheaper than a React render per frame.
 *
 * `#hero-sentinel` at the foot is what the header watches. Moving or renaming
 * it silently breaks the header's overlay state.
 */
export function HeroSlider({
  slides,
  eyebrow,
  headline,
  lede,
  primary,
  secondary,
  interval = 6000,
}: Props) {
  const reduced = useReducedMotion();
  // The outgoing frame has to stay painted underneath while the incoming one
  // wipes over it, so the slider tracks a pair, not an index.
  const [[active, previous], setFrame] = useState<[number, number | null]>([0, null]);
  const [hidden, setHidden] = useState(false);
  const [hovering, setHovering] = useState(false);

  const count = slides.length;
  // Hovering the hero usually means reading it. Advancing out from under the
  // cursor is the single most irritating thing a carousel can do.
  const paused = hidden || hovering;

  const go = useCallback(
    (next: number) =>
      setFrame(([current]) => [((next % count) + count) % count, current]),
    [count],
  );

  // Reduced motion gets a single still frame and no timer at all — an
  // auto-advancing carousel is exactly the vestibular trigger the media query
  // exists to suppress.
  useEffect(() => {
    if (reduced || paused || count < 2) return;

    const timer = window.setInterval(
      () => setFrame(([current]) => [(current + 1) % count, current]),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [reduced, paused, count, interval]);

  // A carousel animating in a hidden tab is pure battery cost.
  useEffect(() => {
    function onVisibility() {
      setHidden(document.visibilityState === 'hidden');
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <section
      className="hero"
      aria-labelledby="hero-heading"
      aria-roledescription="carousel"
      aria-label="Shrinkless campaign"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="hero__stack" aria-live="off">
        {slides.map((slide, index) => (
          <div
            key={slide.image.url}
            className={
              'hero__frame' +
              (index === active ? ' hero__frame--on' : '') +
              (index === previous ? ' hero__frame--under' : '')
            }
            aria-hidden={index !== active}
          >
            <Image
              src={slide.image.url}
              alt={slide.image.alt}
              fill
              priority={index === 0}
              loading={index === 0 ? undefined : 'lazy'}
              sizes="100vw"
              className="hero__image"
              style={slide.image.focus ? { objectPosition: slide.image.focus } : undefined}
            />
          </div>
        ))}
      </div>

      <div className="hero__scrim" aria-hidden="true" />

      <div className="wrap hero__inner">
        <p className="eyebrow hero__eyebrow">{eyebrow}</p>

        <h1 id="hero-heading" className="display hero__head">
          {headline.map((line, index) => (
            <span key={line} className="hero__line">
              {line}
              {index < headline.length - 1 ? <br /> : null}
            </span>
          ))}
        </h1>

        <p className="lede hero__lede">{lede}</p>

        <div className="hero__actions">
          <Link href={primary.href} className="btn btn--light btn--lg">{primary.label}</Link>
          <Link href={secondary.href} className="btn btn--ghost btn--lg">{secondary.label}</Link>
        </div>
      </div>

      <div className="wrap hero__foot">
        <p className="hero__caption" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 0.84, 0.44, 1] }}
              className="hero__captiontext"
            >
              {slides[active].caption}
            </motion.span>
          </AnimatePresence>
        </p>

        <ol className="hero__dots">
          {slides.map((slide, index) => (
            <li key={slide.image.url}>
              <button
                type="button"
                className={`hero__dot${index === active ? ' hero__dot--on' : ''}`}
                aria-label={`Show frame ${index + 1} of ${count}`}
                aria-current={index === active ? 'true' : undefined}
                onClick={() => go(index)}
              >
                {/* The rule fills across while the frame holds, so the
                    indicator doubles as the timer. */}
                <span
                  key={index === active ? `run-${active}` : 'idle'}
                  className="hero__dotfill"
                  style={
                    index === active ? { animationDuration: `${interval}ms` } : undefined
                  }
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div id="hero-sentinel" className="hero__sentinel" aria-hidden="true" />
    </section>
  );
}
