import Link from 'next/link';
import {
  listFeaturedProducts,
  listNewArrivals,
  listProductsInCategory,
} from '@/lib/services/products';
import { categoryImage, getSiteMedia, type SiteMedia } from '@/lib/services/site-media';
import { SHOPPABLE } from '@/lib/shop/navigation';
import { HeroSlider, type HeroSlide } from '@/components/site/HeroSlider';
import { CategoryGateway, type Gateway } from '@/components/shop/CategoryGateway';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { OverlayTiles, type Tile } from '@/components/editorial/OverlayTiles';
import { ImageBand } from '@/components/editorial/ImageBand';
import { FullBleedType } from '@/components/editorial/FullBleedType';
import { QuoteRow, type Quote } from '@/components/editorial/QuoteRow';
import { LookbookRail } from '@/components/site/LookbookRail';
import { Reveal } from '@/components/ui/Reveal';

/** Captions ride with the frames, so the campaign reads as a sequence. */
const HERO_CAPTIONS = [
  'Organic Tee — Black',
  'Organic Tee — White',
  'Boxy Tee — Olive',
  'Heavyweight Tee — Black',
];

/* Each claim sits on the frame that evidences it. Built per request, because
   the photographs are the admin's to change. */
const why = ({ editorial }: SiteMedia): Tile[] => [
  {
    index: '01',
    title: 'Organic Cotton',
    body: 'Premium organic cotton, selected for everyday wear.',
    image: editorial.fabric,
  },
  {
    index: '02',
    title: 'Garment Dyed',
    body: 'The finished garment is dyed for its character and its feel.',
    image: editorial.folded,
  },
  {
    index: '03',
    title: "Doesn't Shrink",
    body: 'Built to hold its fit and its proportions, wash after wash.',
    image: editorial.hanging,
  },
  {
    index: '04',
    title: 'Made in USA',
    body: 'Cut and sewn in the United States.',
    image: editorial.craft,
  },
];

/* The old statement band said this in type over an empty ground. */
const statement = ({ editorial }: SiteMedia): Tile[] => [
  {
    title: 'The tee that stays the same.',
    body: 'Pre-shrunk, then garment dyed at temperature — so the change happens in our facility, not in your machine.',
    image: editorial.torso,
    href: '/why-shrinkless',
  },
  {
    title: 'Worn in, not worn out.',
    body: 'Garment dyeing settles the colour into the cotton rather than sitting on top of it.',
    image: editorial.heather,
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
  const [media, newArrivals, featured, ...categories] = await Promise.all([
    getSiteMedia(),
    listNewArrivals(6),
    listFeaturedProducts(3),
    ...SHOPPABLE.map(({ slug }) => listProductsInCategory(slug)),
  ]);

  // Captions are copy and stay in the code; the frames are media and come from
  // the database. A carousel the admin has lengthened simply runs out of
  // written captions and falls back to the brand name.
  const slides: HeroSlide[] = media.hero.map((image, index) => ({
    image,
    caption: HERO_CAPTIONS[index] ?? 'Shrinkless',
  }));

  // Deliberately still the curated pair rather than every category in the
  // database: these are art-directed frames with their own photography, not a
  // menu. The navigation and /shop routes read the real category list.
  const gateways: Gateway[] = SHOPPABLE.map(({ slug, label }, index) => ({
    slug,
    label,
    count: categories[index]?.length ?? 0,
    image: categoryImage(media, slug),
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

      {/* Photography between two grids of product cards, so the page does not
          read as three shops in a row. */}
      <LookbookRail />

      <OverlayTiles tiles={statement(media)} columns={2} tall />

      <ImageBand
        image={media.editorial.promise}
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
        tiles={why(media)}
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
