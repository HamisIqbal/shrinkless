import { BRAND_IMAGES } from '@/lib/brand/images';
import { OverlayTiles, type Tile } from '@/components/editorial/OverlayTiles';
import { SplitFeature } from '@/components/editorial/SplitFeature';
import { FullBleedType } from '@/components/editorial/FullBleedType';

export const metadata = {
  title: 'Why Shrinkless',
  description: 'Organic cotton, garment dyed, built to hold its fit. Made in USA.',
};

const POINTS: Tile[] = [
  {
    index: '01',
    title: 'Organic Cotton',
    body: 'Premium organic cotton, selected for everyday wear. Certification: [TBC].',
    image: BRAND_IMAGES.fabric,
  },
  {
    index: '02',
    title: 'Garment Dyed',
    body: 'The finished garment is dyed for its distinctive character and feel.',
    image: BRAND_IMAGES.folded,
  },
  {
    index: '03',
    title: "Doesn't Shrink",
    body: 'Built to maintain its fit and proportions wash after wash. Expected residual shrinkage: [TBC]%.',
    image: BRAND_IMAGES.hanging,
  },
  {
    index: '04',
    title: 'Made in USA',
    body: 'Proudly made in the USA.',
    image: BRAND_IMAGES.craft,
  },
];

export default function WhyShrinklessPage() {
  return (
    <>
      <header className="band band--tight wrap pagehead">
        <p className="eyebrow">The difference</p>
        <h1 className="display pagehead__title">Why Shrinkless?</h1>
        <p className="lede pagehead__lede">
          Four things separate this tee from the one that stopped fitting.
        </p>
      </header>

      <OverlayTiles tiles={POINTS} columns={4} />

      <SplitFeature
        image={BRAND_IMAGES.heather}
        eyebrow="In practice"
        headline="The wash test."
        body="A tee that fits in the shop and not after laundry day was never the right size. Ours is finished at temperature before it reaches you, so what you try on is what you keep."
      />

      <FullBleedType
        lines={['Your tee', 'should fit', 'the same way', 'tomorrow.']}
        support="We make tees designed for real life, real washing and real wear."
        cta={{ href: '/shop', label: 'Shop Shrinkless' }}
      />
    </>
  );
}
