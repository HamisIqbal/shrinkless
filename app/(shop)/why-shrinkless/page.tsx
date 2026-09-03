import Link from 'next/link';
import { getSiteMedia, type SiteMedia } from '@/lib/services/site-media';
import { OverlayTiles, type Tile } from '@/components/editorial/OverlayTiles';

export const metadata = {
  title: 'Why Shrinkless',
  description: 'Organic cotton, garment dyed, built to hold its fit. Made in USA.',
};

/* Built per request rather than at module scope: the photographs are the
   admin's to change, so they are data now, not constants. */
const points = ({ editorial }: SiteMedia): Tile[] => [
  {
    index: '01',
    title: 'Organic Cotton',
    body: 'Premium organic cotton, selected for everyday wear. Certification: [TBC].',
    image: editorial.fabric,
  },
  {
    index: '02',
    title: 'Garment Dyed',
    body: 'The finished garment is dyed for its distinctive character and feel.',
    image: editorial.folded,
  },
  {
    index: '03',
    title: "Doesn't Shrink",
    body: 'Built to maintain its fit and proportions wash after wash. Expected residual shrinkage: [TBC]%.',
    image: editorial.hanging,
  },
  {
    index: '04',
    title: 'Made in USA',
    body: 'Proudly made in the USA.',
    image: editorial.craft,
  },
];

/* No <InstagramStrip /> here — app/(shop)/layout.tsx already renders it
   after every page's content, right where the brief wants it. */
export default async function WhyShrinklessPage() {
  const media = await getSiteMedia();

  return (
    <>
      <header className="band band--tight wrap pagehead pagehead--center">
        <h1 className="display pagehead__title">Why Shrinkless</h1>
        <p className="lede pagehead__lede">
          Four things separate this tee from the one that stopped fitting.
        </p>
      </header>

      <OverlayTiles tiles={points(media)} columns={4} contained />

      <div className="band band--tight wrap shopcta">
        <Link href="/shop" className="btn">Shop Now</Link>
      </div>
    </>
  );
}
