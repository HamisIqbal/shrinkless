import Link from 'next/link';
import { listPublishedProducts } from '@/lib/services/products';
import { productFilterSchema } from '@/lib/validation/catalogue';
import { toColorways } from '@/lib/shop/colorways';
import { BRAND_IMAGES } from '@/lib/brand/images';
import { Hero } from '@/components/editorial/Hero';
import { StatementBlock } from '@/components/editorial/StatementBlock';
import { SplitFeature } from '@/components/editorial/SplitFeature';
import { FullBleedType } from '@/components/editorial/FullBleedType';
import { ImageBand } from '@/components/editorial/ImageBand';
import { NumberedPoints, type Point } from '@/components/editorial/NumberedPoints';
import { EditorialGrid } from '@/components/editorial/EditorialGrid';
import { QuoteRow, type Quote } from '@/components/editorial/QuoteRow';
import { CollectionTile } from '@/components/shop/CollectionTile';

const WHY: Point[] = [
  {
    number: '01',
    title: 'Organic Cotton',
    body: 'Premium organic cotton, selected for everyday wear.',
  },
  {
    number: '02',
    title: 'Garment Dyed',
    body: 'The finished garment is dyed for its distinctive character and feel.',
  },
  {
    number: '03',
    title: "Doesn't Shrink",
    body: 'Built to maintain its fit and proportions wash after wash.',
  },
  {
    number: '04',
    title: 'Made in USA',
    body: 'Proudly made in the USA.',
  },
];

// Placeholder copy until real reviews exist — spec §11.3. Replace verbatim.
const QUOTES: Quote[] = [
  {
    text: 'Finally found a tee that still fits the way I want it to after washing.',
    name: 'Placeholder review',
  },
  {
    text: 'The colour has settled into something better than it started. It looks worn in, not worn out.',
    name: 'Placeholder review',
  },
  {
    text: 'I bought one to try it. I now own four.',
    name: 'Placeholder review',
  },
];

export default async function HomePage() {
  const products = await listPublishedProducts(productFilterSchema.parse({}));
  const tee = products[0];
  const colorways = tee ? toColorways(tee) : [];

  return (
    <>
      <Hero
        image={BRAND_IMAGES.hero}
        eyebrow="Shrinkless"
        headline={['Organic tees', "that don't shrink."]}
        lede="Garment dyed organic tees. Made in USA."
        primary={{ href: '/shop', label: 'Shop tees' }}
        secondary={{ href: '/why-shrinkless', label: 'Why Shrinkless' }}
      />

      <StatementBlock
        lines={['The tee', 'that stays', 'the same.']}
        support="Garment dyed organic cotton tees engineered to hold their shape, wash after wash."
      />

      <section className="band band--white collection" aria-labelledby="collection-heading">
        <div className="wrap">
          <div className="collection__head">
            <h2 id="collection-heading" className="head">The Collection</h2>
            <Link href="/shop" className="ulink">Shop all</Link>
          </div>

          {colorways.length === 0 ? (
            <p className="lede">The first run is on the press.</p>
          ) : (
            <ul className="collection__grid">
              {colorways.map((colorway) => (
                <li key={colorway.color}>
                  <CollectionTile
                    slug={tee.slug}
                    title={tee.title}
                    color={colorway.color}
                    priceCents={colorway.priceCents}
                    image={colorway.image}
                    variants={colorway.variants}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <NumberedPoints
        eyebrow="The difference"
        headline="Why Shrinkless?"
        points={WHY}
        images={[BRAND_IMAGES.why01, BRAND_IMAGES.why02]}
      />

      <FullBleedType
        lines={['Your tee', 'should fit', 'the same way', 'tomorrow.']}
        support="We make tees designed for real life, real washing and real wear."
        cta={{ href: '/shop', label: 'Shop Shrinkless' }}
      />

      <SplitFeature
        image={BRAND_IMAGES.dyeStory}
        eyebrow="Garment dyed"
        headline="Made differently."
        body="We garment dye our finished tees to create their character, feel and lasting fit."
        cta={{ href: '/our-story', label: 'Our story' }}
      />

      <ImageBand
        image={BRAND_IMAGES.madeInUsa}
        eyebrow="Craft"
        glyph="🇺🇸"
        headline="Made in USA."
        body="Cut and sewn in the United States, by people who do this for a living."
      />

      <EditorialGrid
        eyebrow="Everyday"
        headline="Worn everywhere."
        follow={{ href: 'https://www.instagram.com/shrinkless/', label: 'Follow @shrinkless' }}
      />

      <QuoteRow eyebrow="Wearers" quotes={QUOTES} />
    </>
  );
}
