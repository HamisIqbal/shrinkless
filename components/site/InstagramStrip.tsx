import Image from 'next/image';
import { imageUrl } from '@/lib/images';
import { InstagramIcon } from '@/components/site/icons';
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_IS_PLACEHOLDER,
  INSTAGRAM_POSTS,
  INSTAGRAM_URL,
} from '@/lib/brand/instagram';

/**
 * An endless horizontal rail of Instagram tiles, sitting above the footer.
 *
 * Same trick as the announcement ticker: the rail holds the set twice and
 * travels exactly half its own width, so the second copy arrives where the
 * first began and the loop has no seam. The duplicate is `aria-hidden` and
 * untabbable, so assistive tech and the keyboard see each post once.
 *
 * Hovering stops the rail. A row of moving targets you cannot click is a
 * frustration, not an effect.
 */
export function InstagramStrip() {
  const posts = INSTAGRAM_POSTS;
  if (posts.length === 0) return null;

  return (
    <section className="iglane" aria-labelledby="ig-heading">
      <div className="wrap iglane__head">
        <div>
          <p className="eyebrow">Community</p>
          <h2 id="ig-heading" className="head iglane__title">
            <a href={INSTAGRAM_URL} rel="me noreferrer" target="_blank" className="iglane__handle">
              <InstagramIcon className="iglane__icon" />
              @{INSTAGRAM_HANDLE}
            </a>
          </h2>
        </div>

        <p className="meta iglane__note">
          {INSTAGRAM_IS_PLACEHOLDER
            ? 'Sample imagery — follow for the real thing'
            : 'Tap a post to open it on Instagram'}
        </p>
      </div>

      <div className="iglane__rail">
        {[0, 1].map((half) => (
          <div
            className="iglane__half"
            key={half}
            aria-hidden={half === 1 || undefined}
            inert={half === 1 || undefined}
          >
            {posts.map((post, index) => (
              <a
                key={`${half}-${index}`}
                href={post.permalink}
                className="iglane__tile"
                rel="noreferrer"
                target="_blank"
              >
                <Image
                  src={imageUrl(post.image.url, 'c_fill,w_600,h_600,q_auto,f_auto')}
                  alt={post.image.alt}
                  width={300}
                  height={300}
                  loading="lazy"
                  className="iglane__image"
                />
                <span className="iglane__mark" aria-hidden="true">
                  <InstagramIcon />
                </span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
