import { Reveal } from '@/components/ui/Reveal';

type Props = {
  lines: string[];
  support?: string;
  /** Ink-on-white rather than ink-on-paper. */
  white?: boolean;
};

/**
 * The page's largest voice: three or four hard-broken lines, left-aligned,
 * with the supporting sentence offset into the right third.
 *
 * That offset is the first asymmetry on the page and every band below inherits
 * its grammar. Centring this would flatten the whole layout.
 */
export function StatementBlock({ lines, support, white = false }: Props) {
  return (
    <section className={`band band--tall statement${white ? ' band--white' : ''}`}>
      <div className="wrap statement__inner">
        <Reveal>
          <h2 className="display statement__head">
            {lines.map((line, index) => (
              <span key={line}>
                {line}
                {index < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h2>
        </Reveal>

        {support ? (
          <Reveal index={1}>
            <p className="lede statement__support">{support}</p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
