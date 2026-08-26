'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Publishes the footer's height to CSS so the page above it can reserve
 * exactly that much room and slide away to reveal it.
 *
 * The footer is fixed to the bottom of the viewport and the page scrolls over
 * the top of it, so the reveal needs a real measurement — the footer's height
 * depends on the store email, the column contents and the viewport width, and
 * a hard-coded value would either clip the footer or leave a gap under the
 * page. A ResizeObserver keeps it right through a font swap or a rotate.
 *
 * The effect itself is gated to desktop in CSS. On a phone the footer is most
 * of a screen tall, and reserving that much space below every page would mean
 * scrolling through a hole to reach it.
 *
 * It is gated on the measurement too. A footer pinned to the bottom of the
 * viewport can only ever show its last viewport-worth: on a short laptop
 * window the signup and the heading sat above the top edge and no amount of
 * scrolling brought them back. When the footer does not fit, `data-footer` goes
 * to `static` and it becomes the ordinary last block on the page instead.
 */
export function FooterReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const publish = () => {
      const height = Math.round(node.getBoundingClientRect().height);
      const root = document.documentElement;

      root.style.setProperty('--footer-h', `${height}px`);

      // The margin holds the page above the pinned footer, so the reveal is
      // only honest while the whole footer is inside the viewport. The slack
      // is deliberate: a footer within a hair of the window height reads as
      // clipped even when it technically fits.
      root.dataset.footer = height <= window.innerHeight - 8 ? 'reveal' : 'static';
    };

    publish();

    const observer = new ResizeObserver(publish);
    observer.observe(node);

    // The footer's own height is not the only input: shrinking the window can
    // put a footer that fitted out of reach without changing its height at all.
    window.addEventListener('resize', publish);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', publish);
      document.documentElement.style.removeProperty('--footer-h');
      delete document.documentElement.dataset.footer;
    };
  }, []);

  return (
    <div className="footerdock" ref={ref}>
      {children}
    </div>
  );
}
