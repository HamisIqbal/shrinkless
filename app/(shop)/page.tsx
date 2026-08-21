import Link from 'next/link';
import { listPublishedProducts } from '@/lib/services/products';
import { ProductCard } from '@/components/shop/ProductCard';

/* The spec strip is the brand's signature device: every shirt is described the
   way a workwear tag describes it, in four fixed fields. Same four, every
   time — the repetition is the point. */
const SPEC = [
  { field: 'Fabric', value: '100% cotton' },
  { field: 'Weight', value: '8.4 oz' },
  { field: 'Cut', value: 'Boxy, straight hem' },
  { field: 'Run', value: 'Limited' },
];

export default async function HomePage() {
  const products = await listPublishedProducts({ sizes: [], colors: [], sort: 'newest' });
  const featured = products.slice(0, 3);

  return (
    <div>
      <section aria-labelledby="hero-heading" className="broadside reveal">
        <p className="eyebrow">Catalogue No. 01 — Everyday shirts</p>

        <h1 id="hero-heading" className="display broadside__head">
          Shirts, cut for
          <br />
          everyday wear.
        </h1>

        <p className="lede broadside__lede">
          Heavyweight cotton. Made to be worn, washed, and worn again.
        </p>

        <Link href="/shop" className="btn btn--spot broadside__cta">Shop all</Link>

        <dl className="specstrip">
          {SPEC.map((row) => (
            <div key={row.field} className="specstrip__cell">
              <dt className="meta">{row.field}</dt>
              <dd className="specstrip__value">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="featured-heading" className="spread">
        <p className="spread__label" id="featured-heading">Featured</p>

        <div className="spread__body">
          {featured.length === 0 ? (
            <p className="lede">Nothing in stock yet. The first run is on the press.</p>
          ) : (
            <ul className="grid12 reveal-list">
              {featured.map((product) => (
                <li key={product.id} className="cardslot">
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="story-heading" className="spread">
        <p className="spread__label" id="story-heading">The shop</p>

        <div className="spread__body storycols">
          <p>
            Shrinkless started with one complaint: a good shirt should not come out of the
            wash a size smaller. Ours are cut from pre-shrunk heavyweight cotton and sewn
            with a straight hem, so the shirt you pull on in a year is the shirt you bought.
          </p>
          <p>
            We print in small runs and stop when they are gone. No seasonal churn, no
            restocks on a schedule — when a colourway sells through, it makes way for the
            next one on the press.
          </p>
        </div>
      </section>
    </div>
  );
}
