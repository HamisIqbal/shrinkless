import Link from 'next/link';

export const metadata = {
  title: 'Our Story',
  description: 'Why Shrinkless makes one tee, and makes it in the United States.',
};

type Block = { eyebrow: string; heading: string; body: string; glyph?: string };

const BLOCKS: Block[] = [
  {
    eyebrow: 'The beginning',
    heading: 'We got tired of tees that stopped fitting.',
    body: 'Every wardrobe has one: the tee that fit perfectly until the third wash, and then belonged to somebody smaller.',
  },
  {
    eyebrow: 'The process',
    heading: 'Shrunk before you own it.',
    body: 'We pre-shrink the fabric and garment dye the finished tee at temperature, so the change that normally happens in your machine has already happened in ours.',
  },
  {
    eyebrow: 'The material',
    heading: 'Organic cotton, garment dyed.',
    body: 'Garment dyeing gives each run its own depth and character — the colour settles into the cotton rather than sitting on top of it, and it wears in instead of wearing out.',
  },
  {
    eyebrow: 'Craft',
    glyph: '🇺🇸',
    heading: 'Made in USA.',
    body: 'Cut and sewn in the United States. Mill and factory details: [TBC].',
  },
];

/* No <InstagramStrip /> here — app/(shop)/layout.tsx already renders it
   after every page's content, right where the brief wants it. */
export default function OurStoryPage() {
  return (
    <div className="band band--white">
      <header className="wrap pagehead pagehead--center">
        <p className="eyebrow">Our story</p>
        <h1 className="display pagehead__title">One tee, made properly.</h1>
      </header>

      {BLOCKS.map((block) => (
        <section key={block.heading} className="wrap pagehead pagehead--center pagehead--rule">
          <p className="eyebrow">
            {block.glyph ? (
              <span className="storyblock__glyph" aria-hidden="true">{block.glyph} </span>
            ) : null}
            {block.eyebrow}
          </p>
          <h2 className="head pagehead__title">{block.heading}</h2>
          <p className="lede pagehead__lede">{block.body}</p>
        </section>
      ))}

      <section className="wrap pagehead pagehead--center pagehead--rule">
        <h2 className="display pagehead__title">
          Less,
          <br />
          but better.
        </h2>
        <p className="lede pagehead__lede">
          Six styles, cut from the same cotton and finished the same way. Made well enough that
          we do not need a seventh.
        </p>

        <Link href="/shop" className="btn storyblock__cta">Shop Now</Link>
      </section>
    </div>
  );
}
