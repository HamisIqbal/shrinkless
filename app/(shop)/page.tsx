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
import { QuoteRow, type Quote } from '@/components/editorial/QuoteRow';
import { LookbookRail } from '@/components/site/LookbookRail';
import { Reveal } from '@/components/ui/Reveal';

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

  // The frames are media and come from the database; nothing else rides with
  // them, so the hero is the photography and the two calls to action.
  const slides: HeroSlide[] = media.hero.map((image) => ({ image }));

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
          read as three shops in a row. The three bands below run back to
          back with no paper gap between them — one continuous run of
          imagery from the rail through to the promise photograph. */}
      <div className="home-visual-stack">
        <LookbookRail />

        <OverlayTiles tiles={statement(media)} columns={2} tall />

        <ImageBand
          image={media.editorial.promise}
          eyebrow="The promise"
          headline="Wash it. Dry it. Wear it."
          compact
          body="The shrinking happens in our facility, not in your machine."
        />
      </div>

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

      <QuoteRow eyebrow="Reviews" heading="What people say." quotes={QUOTES} />

    </>
  );
}
