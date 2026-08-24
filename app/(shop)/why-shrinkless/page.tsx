import { BRAND_IMAGES } from '@/lib/brand/images';
import { StatementBlock } from '@/components/editorial/StatementBlock';
import { NumberedPoints, type Point } from '@/components/editorial/NumberedPoints';
import { SplitFeature } from '@/components/editorial/SplitFeature';
import { FullBleedType } from '@/components/editorial/FullBleedType';

export const metadata = {
  title: 'Why Shrinkless',
  description: 'Organic cotton, garment dyed, built to hold its fit. Made in USA.',
};

const POINTS: Point[] = [
  {
    number: '01',
    title: 'Organic Cotton',
    body: 'Premium organic cotton, selected for everyday wear. Certification: [TBC].',
  },
  {
    number: '02',
    title: 'Garment Dyed',
    body: 'The finished garment is dyed for its distinctive character and feel.',
  },
  {
    number: '03',
    title: "Doesn't Shrink",
    body: 'Built to maintain its fit and proportions wash after wash. Expected residual shrinkage: [TBC]%.',
  },
  {
    number: '04',
    title: 'Made in USA',
    body: 'Proudly made in the USA.',
  },
];

export default function WhyShrinklessPage() {
  return (
    <>
      <StatementBlock
        lines={['Why', 'Shrinkless?']}
        support="Four things separate this tee from the one that stopped fitting."
      />

      <NumberedPoints
        eyebrow="The difference"
        headline="Four reasons."
        points={POINTS}
        images={[BRAND_IMAGES.fabric, BRAND_IMAGES.hanging]}
      />

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
