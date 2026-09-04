import { StoryFilm } from '@/components/site/StoryFilm';

export const metadata = {
  title: 'Our Story',
  description: 'Why Shrinkless makes one tee, and makes it in the United States.',
};

const VIDEO_SRC =
  'https://res.cloudinary.com/dcsewsmhd/video/upload/v1788450220/There_s_a_lot_of_work_that_goes_into_making_our_t-shirts_special._Cutting_sewing_dyeing_washi_u85ovb.mp4';

const STORY = `Founded in 2015 by Nicholas Bowles, Shrinkless was created from a simple belief: your favorite T-shirt shouldn’t change after you wash it. Frustrated by shirts that lost their fit, shape, and feel after just a few washes, Nicholas set out to create something better. Today, Shrinkless makes garment-dyed organic cotton tees that are made in the USA and designed to keep their fit, feel, and character wash after wash. We believe a great T-shirt should be simple, comfortable, and built to last, which is why we focus on quality materials, thoughtful craftsmanship, and timeless design rather than chasing trends. From the way our tees feel when you first put them on to the way they become part of your everyday wardrobe, everything we do comes back to one idea: make a T-shirt you can count on. No unnecessary fuss, no disposable fashion, just exceptionally comfortable tees made to be worn, washed, and worn again. That’s Shrinkless.`;

/* One film, one block of copy: over the video on desktop, under it on a tablet
   or phone. No <InstagramStrip /> here — app/(shop)/layout.tsx already renders
   it after every page's content, right where the brief wants it. */
export default function OurStoryPage() {
  return (
    <div className="band band--white">
      <section className="wrap storyfilm">
        <StoryFilm src={VIDEO_SRC} label="Cutting, sewing, dyeing and washing a Shrinkless tee">
          <div className="storyfilm__copy">
            <p className="eyebrow storyfilm__eyebrow">Our story</p>
            <p className="storyfilm__body">{STORY}</p>
          </div>
        </StoryFilm>
      </section>
    </div>
  );
}
