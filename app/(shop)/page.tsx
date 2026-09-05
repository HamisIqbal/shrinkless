import Link from 'next/link';
import {
  listFeaturedProducts,
  listNewArrivals,
  listProductsInCategory,
} from '@/lib/services/products';
import {
  categoryImage,
  getMediaLayer,
  getSiteMedia,
  type SiteMedia,
} from '@/lib/services/site-media';
import { MediaLayer } from '@/components/site/MediaLayer';
import { getContentLayer, getSiteContent, type SiteContent } from '@/lib/services/site-content';
import { ContentLayer } from '@/components/site/ContentLayer';
import { SHOPPABLE } from '@/lib/shop/navigation';
import { HeroSlider, type HeroSlide } from '@/components/site/HeroSlider';
import { CategoryGateway, type Gateway } from '@/components/shop/CategoryGateway';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { OverlayTiles, type Tile } from '@/components/editorial/OverlayTiles';
import { ImageBand } from '@/components/editorial/ImageBand';
import { QuoteRow, type Quote } from '@/components/editorial/QuoteRow';
import { LookbookRail } from '@/components/site/LookbookRail';
import { InstagramStrip } from '@/components/site/InstagramStrip';
import { Reveal } from '@/components/ui/Reveal';

/* The old statement band said this in type over an empty ground. The words and
   the photographs are both the admin's to change, so both are data here. */
const statement = ({ editorial }: SiteMedia, copy: SiteContent): Tile[] => [
  {
    title: copy['home.story.1.title'],
    body: copy['home.story.1.body'],
    image: editorial.torso,
    href: '/why-shrinkless',
  },
  {
    title: copy['home.story.2.title'],
    body: copy['home.story.2.body'],
    image: editorial.heather,
    href: '/our-story',
  },
];

// Placeholder copy until real reviews exist — spec §11.3. Editable on the
// Content tab, so replacing it is not a deploy.
const quotes = (copy: SiteContent): Quote[] => [
  { text: copy['home.reviews.1.text'], name: copy['home.reviews.1.name'] },
  { text: copy['home.reviews.2.text'], name: copy['home.reviews.2.name'] },
  { text: copy['home.reviews.3.text'], name: copy['home.reviews.3.name'] },
];

export default async function HomePage() {
  const [media, copy, layer, mediaLayer, newArrivals, featured, ...categories] = await Promise.all([
    getSiteMedia(),
    getSiteContent(),
    getContentLayer('home'),
    getMediaLayer('home'),
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
        eyebrow={copy['home.hero.eyebrow']}
        headline={[copy['home.hero.headline1'], copy['home.hero.headline2']]}
        lede={copy['home.hero.lede']}
        primary={{ href: '/shop', label: copy['home.hero.primary'] }}
        secondary={{ href: '/why-shrinkless', label: copy['home.hero.secondary'] }}
      />

      {/* Shopping direction, immediately after the hero — before any story. */}
      <CategoryGateway gateways={gateways} />

      {/* On the homepage the community band is not a footer ornament: the real
          account, high up, before the first grid of product cards. Every other
          shop page still gets it last, from
          app/(shop)/(instagram-last)/layout.tsx. */}
      <InstagramStrip />

      <section className="band band--white rail" aria-labelledby="new-heading">
        <div className="wrap">
          <Reveal>
            <div className="rail__head">
              <div>
                <p className="eyebrow">{copy['home.new.eyebrow']}</p>
                <h2 id="new-heading" className="head">{copy['home.new.heading']}</h2>
              </div>
              <Link href="/shop?sort=newest" className="ulink rail__more">{copy['home.new.link']}</Link>
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

        <OverlayTiles tiles={statement(media, copy)} columns={2} tall />

        <ImageBand
          image={media.editorial.promise}
          eyebrow={copy['home.promise.eyebrow']}
          headline={copy['home.promise.headline']}
          compact
          body={copy['home.promise.body']}
        />
      </div>

      {featured.length ? (
        <section className="band band--white rail" aria-labelledby="featured-heading">
          <div className="wrap">
            <Reveal>
              <div className="rail__head">
                <div>
                  <p className="eyebrow">{copy['home.featured.eyebrow']}</p>
                  <h2 id="featured-heading" className="head">{copy['home.featured.heading']}</h2>
                </div>
                <Link href="/shop" className="ulink rail__more">{copy['home.featured.link']}</Link>
              </div>
            </Reveal>

            <ProductGrid products={featured} columns={3} />
          </div>
        </section>
      ) : null}

      <QuoteRow
        eyebrow={copy['home.reviews.eyebrow']}
        heading={copy['home.reviews.heading']}
        quotes={quotes(copy)}
      />

      <ContentLayer {...layer} />

      <MediaLayer {...mediaLayer} />

    </>
  );
}
