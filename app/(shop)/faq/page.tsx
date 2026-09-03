import { FaqAccordion, type FaqItem } from '@/components/site/FaqAccordion';

export const metadata = {
  title: 'FAQ',
  description: 'Sizing, care, shipping and returns.',
};

/**
 * Anything factual that has not been confirmed is marked [TBC] rather than
 * invented — spec §11.2. A guessed return window is a promise the business
 * then has to keep.
 */
const ITEMS: FaqItem[] = [
  {
    q: 'Does it really not shrink?',
    a: 'The fabric is pre-shrunk and the finished garment is dyed at temperature, so the shrinkage happens before the tee reaches you. Expected residual shrinkage after washing: [TBC]%.',
  },
  {
    q: 'What is garment dyeing?',
    a: 'The tee is sewn first and dyed afterwards, as a finished garment. The colour settles into the cotton rather than sitting on the surface, which is why it has depth when new and wears in rather than out.',
  },
  {
    q: 'What is the fabric?',
    a: '[TBC]oz organic cotton, [TBC] knit. Certification body: [TBC].',
  },
  {
    q: 'How does it fit?',
    a: 'A regular fit through the body and shoulder, not boxy and not slim. Full measurements by size: [TBC].',
  },
  {
    q: 'Should I size up?',
    a: 'No. The tee is finished before it ships, so it will not shrink into a smaller size — buy the size you want to wear.',
  },
  {
    q: 'How should I wash it?',
    a: 'Machine wash cold with like colours and tumble dry low. Garment dyed cotton keeps its character best out of high heat. Full care instructions: [TBC].',
  },
  {
    q: 'Where do you ship?',
    a: 'Shipping destinations, options and delivery estimates: [TBC].',
  },
  {
    q: 'Can I return it?',
    a: 'Returns are accepted on unworn items within [TBC] days. Return shipping policy: [TBC].',
  },
];

/* No <InstagramStrip /> here — app/(shop)/layout.tsx already renders it
   after every page's content, right where the brief wants it. */
export default function FaqPage() {
  return (
    <div className="band band--tight wrap">
      <header className="pagehead pagehead--center">
        <h1 className="display pagehead__title">Frequently asked questions</h1>
      </header>

      <FaqAccordion items={ITEMS} />
    </div>
  );
}
