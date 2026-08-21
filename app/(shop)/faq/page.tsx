import Link from 'next/link';

export const metadata = {
  title: 'FAQ',
  description: 'Sizing, care, shipping and returns.',
};

/**
 * Anything factual that has not been confirmed is marked [TBC] rather than
 * invented — spec §11.2. A guessed return window is a promise the business
 * then has to keep.
 */
const GROUPS = [
  {
    heading: 'The product',
    items: [
      {
        q: "Does it really not shrink?",
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
    ],
  },
  {
    heading: 'Sizing',
    items: [
      {
        q: 'How does it fit?',
        a: 'A regular fit through the body and shoulder, not boxy and not slim. Full measurements by size: [TBC].',
      },
      {
        q: 'Should I size up?',
        a: 'No. The tee is finished before it ships, so it will not shrink into a smaller size — buy the size you want to wear.',
      },
    ],
  },
  {
    heading: 'Care',
    items: [
      {
        q: 'How should I wash it?',
        a: 'Machine wash cold with like colours and tumble dry low. Garment dyed cotton keeps its character best out of high heat. Full care instructions: [TBC].',
      },
    ],
  },
  {
    heading: 'Shipping & returns',
    items: [
      {
        q: 'Where do you ship?',
        a: 'Shipping destinations, options and delivery estimates: [TBC].',
      },
      {
        q: 'Can I return it?',
        a: 'Returns are accepted on unworn items within [TBC] days. Return shipping policy: [TBC].',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="band band--tight wrap faq">
      <header className="faq__head">
        <p className="eyebrow">Support</p>
        <h1 className="head">Frequently asked.</h1>
      </header>

      {GROUPS.map((group) => (
        <section key={group.heading} className="faq__group" aria-labelledby={group.heading}>
          <h2 id={group.heading} className="meta faq__groupname">{group.heading}</h2>

          <ul className="accordion">
            {group.items.map((item) => (
              <li key={item.q}>
                <details className="accordion__item">
                  <summary className="accordion__summary">
                    <span>{item.q}</span>
                    <span className="accordion__mark" aria-hidden="true" />
                  </summary>
                  <p className="accordion__body">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="faq__contact">
        Still stuck? <Link href="/shop" className="ulink">Shop tees</Link>
      </p>
    </div>
  );
}
