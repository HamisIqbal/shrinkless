'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type Props = {
  children: ReactNode;
  /** Position in a stagger group. Delay is capped so long grids never crawl. */
  index?: number;
  className?: string;
};

/**
 * Spec §6: short, once-only entrance reveals on section headers and grid
 * items. Under prefers-reduced-motion the content renders in place with no
 * animation at all.
 */
export function Reveal({ children, index = 0, className }: Props) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{
        duration: 0.42,
        ease: [0.16, 0.84, 0.44, 1],
        delay: Math.min(index, 5) * 0.04,
      }}
    >
      {children}
    </motion.div>
  );
}
