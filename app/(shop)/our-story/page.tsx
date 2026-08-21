import { BRAND_IMAGES } from '@/lib/brand/images';
import { ImageBand } from '@/components/editorial/ImageBand';
import { StatementBlock } from '@/components/editorial/StatementBlock';
import { SplitFeature } from '@/components/editorial/SplitFeature';
import { FullBleedType } from '@/components/editorial/FullBleedType';

export const metadata = {
  title: 'Our Story',
  description: 'Why Shrinkless makes one tee, and makes it in the United States.',
};

export default function OurStoryPage() {
  return (
    <>
      <ImageBand
        image={BRAND_IMAGES.dyeStory}
        eyebrow="Our story"
        headline="One tee, made properly."
      />

      <StatementBlock
        lines={['We got tired', 'of tees that', 'stopped fitting.']}
        support="Every wardrobe has one: the tee that fit perfectly until the third wash, and then belonged to somebody smaller."
      />

      <SplitFeature
        image={BRAND_IMAGES.why01}
        eyebrow="The process"
        headline="Shrunk before you own it."
        body="We pre-shrink the fabric and garment dye the finished tee at temperature, so the change that normally happens in your machine has already happened in ours."
      />

      <SplitFeature
        image={BRAND_IMAGES.why02}
        eyebrow="The material"
        headline="Organic cotton, garment dyed."
        body="Garment dyeing gives each run its own depth and character — the colour settles into the cotton rather than sitting on top of it, and it wears in instead of wearing out."
        flip
      />

      <ImageBand
        image={BRAND_IMAGES.madeInUsa}
        eyebrow="Craft"
        glyph="🇺🇸"
        headline="Made in USA."
        body="Cut and sewn in the United States. Mill and factory details: [TBC]."
      />

      <FullBleedType
        lines={['Less,', 'but better.']}
        support="One tee. Three colours. Made well enough that we do not need a fourth product."
        cta={{ href: '/shop', label: 'Shop tees' }}
      />
    </>
  );
}
