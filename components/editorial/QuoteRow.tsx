import { Reveal } from '@/components/ui/Reveal';

export type Quote = {
  text: string;
  name: string;
};

type Props = {
  eyebrow?: string;
  quotes: Quote[];
};

/**
 * Three quotes on hairlines. The Cormorant quotation mark is set large and
 * pale behind the text — it is the only serif on the site apart from its twin,
 * and it earns its place by doing the job a testimonial card would otherwise
 * do with a border and a shadow.
 *
 * Placeholder copy until real reviews exist (spec §11.3).
 */
export function QuoteRow({ eyebrow, quotes }: Props) {
  return (
    <section className="band band--white quotes" aria-labelledby="quotes-heading">
      <div className="wrap">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id="quotes-heading" className="visually-hidden">What people say</h2>

        <ul className="quotes__row">
          {quotes.map((quote, index) => (
            <li key={`${quote.name}-${index}`} className="quotes__item">
              <Reveal index={index}>
                <figure className="quotes__figure">
                  <span className="serif-mark quotes__mark" aria-hidden="true">&ldquo;</span>
                  <blockquote className="quotes__text">
                    <p>{quote.text}</p>
                  </blockquote>
                  <figcaption className="meta quotes__name">{quote.name}</figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
