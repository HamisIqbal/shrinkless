import Link from 'next/link';
import { NewsletterForm } from '@/components/site/NewsletterForm';

const INSTAGRAM = 'https://www.instagram.com/shrinkless/';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/why-shrinkless', label: 'Why Shrinkless' },
  { href: '/faq', label: 'FAQ' },
];

export function Footer({ storeEmail }: { storeEmail: string }) {
  return (
    <footer className="band band--ink colophon">
      <div className="wrap">
        <div className="colophon__signup">
          <div>
            <h2 className="head">Get the good stuff.</h2>
            <p className="lede colophon__lede">
              Sign up for new releases, restocks and Shrinkless updates.
            </p>
          </div>

          <NewsletterForm />
        </div>

        <hr className="rule colophon__rule" />

        <div className="colophon__grid">
          <div className="colophon__brand">
            <p className="colophon__mark">Shrinkless</p>
            <p className="meta">Organic Tees That Don&rsquo;t Shrink.</p>
          </div>

          <nav aria-label="Footer">
            <ul className="colophon__links">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="ulink">{item.label}</Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${storeEmail}`} className="ulink">Contact</a>
              </li>
            </ul>
          </nav>

          <div className="colophon__social">
            <a href={INSTAGRAM} className="ulink" rel="me noreferrer" target="_blank">
              Instagram
            </a>
          </div>
        </div>

        <p className="meta colophon__legal tnum">
          &copy; {new Date().getFullYear()} Shrinkless. Made in USA.
        </p>
      </div>
    </footer>
  );
}
