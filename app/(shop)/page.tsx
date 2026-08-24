import Link from 'next/link';
import {
  listFeaturedProducts,
  listNewArrivals,
  listProductsInCategory,
} from '@/lib/services/products';
import { BRAND_IMAGES, HERO_SLIDES, PRODUCT_IMAGES } from '@/lib/brand/images';
import { SHOPPABLE } from '@/lib/shop/navigation';
import { HeroSlider, type HeroSlide } from '@/components/site/HeroSlider';
import { CategoryGateway, type Gateway } from '@/components/shop/CategoryGateway';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { OverlayTiles, type Tile } from '@/components/editorial/OverlayTiles';
import { ImageBand } from '@/components/editorial/ImageBand';
import { FullBleedType } from '@/components/editorial/FullBleedType';
import { QuoteRow, type Quote } from '@/components/editorial/QuoteRow';
import { Reveal } from '@/components/ui/Reveal';

/** Captions ride with the frames, so the campaign reads as a sequence. */
const HERO_CAPTIONS = [
  'Organic Tee — Black',
  'Organic Tee — White',
  'Boxy Tee — Olive',
  'Heavyweight Tee — Black',
];

/* Each claim sits on the frame that evidences it. */
const WHY: Tile[] = [
  {
    index: '01',
    title: 'Organic Cotton',
    body: 'Premium organic cotton, selected for everyday wear.',
    image: BRAND_IMAGES.fabric,
  },
  {
    index: '02',
    title: 'Garment Dyed',
    body: 'The finished garment is dyed for its character and its feel.',
    image: BRAND_IMAGES.folded,
  },
  {
    index: '03',
    title: "Doesn't Shrink",
    body: 'Built to hold its fit and its proportions, wash after wash.',
    image: BRAND_IMAGES.hanging,
  },
  {
    index: '04',
    title: 'Made in USA',
    body: 'Cut and sewn in the United States.',
    image: BRAND_IMAGES.craft,
  },
];

/* The old statement band said this in type over an empty ground. */
const STATEMENT: Tile[] = [
  {
    title: 'The tee that stays the same.',
    body: 'Pre-shrunk, then garment dyed at temperature — so the change happens in our facility, not in your machine.',
    image: BRAND_IMAGES.torso,
    href: '/why-shrinkless',
  },
  {
    title: 'Worn in, not worn out.',
    body: 'Garment dyeing settles the colour into the cotton rather than sitting on top of it.',
    image: BRAND_IMAGES.heather,
    href: '/our-story',
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
  const [newArrivals, featured, ...categories] = await Promise.all([
    listNewArrivals(6),
    listFeaturedProducts(3),
    ...SHOPPABLE.map(({ slug }) => listProductsInCategory(slug)),
  ]);

  const slides: HeroSlide[] = HERO_SLIDES.map((image, index) => ({
    image,
    caption: HERO_CAPTIONS[index] ?? 'Shrinkless',
  }));

  const gateways: Gateway[] = SHOPPABLE.map(({ slug, label }, index) => ({
    slug,
    label,
    count: categories[index]?.length ?? 0,
  }));

  return (
    <>
      <HeroSlider
        slides={slides}
        eyebrow="Made in USA"
        headline={['Organic tees', "that don't shrink."]}
        lede="Garment dyed organic cotton, cut and sewn in the United States."
        primary={{ href: '/shop', label: 'Shop tees' }}
        secondary={{ href: '/why-shrinkless', label: 'Why Shrinkless' }}
      />

      {/* Shopping direction, immediately after the hero — before any story. */}
      <CategoryGateway gateways={gateways} />

      <section className="band band--white rail" aria-labelledby="new-heading">
        <div className="wrap">
          <Reveal>
            <div className="rail__head">
              <div>
                <p className="eyebrow">Just landed</p>
                <h2 id="new-heading" className="head">New Arrivals</h2>
              </div>
              <Link href="/shop?sort=newest" className="ulink rail__more">Shop all</Link>
            </div>
          </Reveal>

          {newArrivals.length ? (
            <ProductGrid products={newArrivals} columns={3} />
          ) : (
            <p className="lede">The catalogue is empty. Seed it with <code>npm run seed:shrinkless</code>.</p>
          )}
        </div>
      </section>

      <OverlayTiles tiles={STATEMENT} columns={2} tall />

      <ImageBand
        image={PRODUCT_IMAGES['mens-heavyweight-tee'][0]}
        eyebrow="The promise"
        headline="Wash it. Dry it. Wear it."
        body="The shrinking happens in our facility, not in your machine."
      />

      {featured.length ? (
        <section className="band band--white rail" aria-labelledby="featured-heading">
          <div className="wrap">
            <Reveal>
              <div className="rail__head">
                <div>
                  <p className="eyebrow">Chosen by us</p>
                  <h2 id="featured-heading" className="head">Featured</h2>
                </div>
                <Link href="/shop" className="ulink rail__more">Shop all</Link>
              </div>
            </Reveal>

            <ProductGrid products={featured} columns={3} />
          </div>
        </section>
      ) : null}

      <OverlayTiles
        eyebrow="Why Shrinkless"
        heading="Four things, done properly."
        tiles={WHY}
        columns={4}
      />

      <QuoteRow eyebrow="Reviews" heading="What people say." quotes={QUOTES} />

      <FullBleedType
        lines={['Start', 'with one.']}
        support="Six styles, two fits, and a tee that comes out of the wash the same size it went in."
        cta={{ href: '/shop', label: 'Shop the collection' }}
      />
    </>
  );
}
