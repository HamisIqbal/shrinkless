import Image from 'next/image';
import { InstagramIcon } from '@/components/site/icons';
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  fetchInstagramPosts,
} from '@/lib/brand/instagram';

/**
 * The real Instagram grid, above the footer, in a large horizontal band.
 *
 * The tiles used to be brand photography of tees — the same pictures already
 * on the product cards — dressed up as posts. They are gone: that rail now
 * lives on the homepage as what it always was, a lookbook. What is here is
 * either the account's actual posts or an honest invitation to go and look at
 * them.
 *
 * Same seamless trick as the announcement ticker: the rail holds the set twice
 * and travels exactly half its own width, so the second copy arrives where the
 * first began. The duplicate is `aria-hidden` and `inert`, so assistive tech
 * and the keyboard meet each post once. Hovering stops the rail, because a row
 * of moving targets you cannot click is a frustration rather than an effect.
 */
export async function InstagramStrip() {
  const posts = await fetchInstagramPosts(12);

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
          {posts.length ? 'Tap a post to open it on Instagram' : 'Follow along'}
        </p>
      </div>

      {posts.length ? (
        <div className="iglane__rail">
          {[0, 1].map((half) => (
            <div
              className="iglane__half"
              key={half}
              aria-hidden={half === 1 || undefined}
              inert={half === 1 || undefined}
            >
              {posts.map((post) => (
                <a
                  key={`${half}-${post.id}`}
                  href={post.permalink}
                  className="iglane__tile"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Image
                    src={post.imageUrl}
                    alt={post.alt}
                    width={640}
                    height={640}
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
      ) : (
        /* No token, or Meta said no. Say so plainly rather than filling the
           band with stock photography captioned as posts. */
        <div className="wrap iglane__empty">
          <p className="lede iglane__emptylede">
            New drops, fit pictures and the odd studio day, posted at
            @{INSTAGRAM_HANDLE}.
          </p>
          <a href={INSTAGRAM_URL} rel="me noreferrer" target="_blank" className="btn btn--lg">
            Follow on Instagram
          </a>
        </div>
      )}
    </section>
  );
}
