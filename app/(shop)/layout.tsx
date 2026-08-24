import { getStoreSettings } from '@/lib/services/settings';
import { readCartView } from '@/lib/cart-session';
import { buildShopMenu } from '@/lib/shop/menu.server';
import { auth } from '@/auth';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { Motion } from '@/components/ui/Motion';
import { AnnounceBar } from '@/components/site/AnnounceBar';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { FooterReveal } from '@/components/site/FooterReveal';
import { InstagramStrip } from '@/components/site/InstagramStrip';

export default async function ShopLayout({ children }: LayoutProps<'/'>) {
  const [settings, cart, session, menu] = await Promise.all([
    getStoreSettings(),
    readCartView(),
    auth(),
    buildShopMenu(),
  ]);

  return (
    <Motion>
    <div className="shell">
      <div className="shell__stack">
      <SmoothScroll />

      <a href="#main" className="skiplink">Skip to content</a>

      <AnnounceBar message={settings.announcement} />

      <Header
        menu={menu}
        itemCount={cart?.itemCount ?? 0}
        signedIn={Boolean(session?.user)}
        storeEmail={settings.storeEmail}
      />

      <main id="main">{children}</main>

        <InstagramStrip />
      </div>

      <FooterReveal>
        <Footer storeEmail={settings.storeEmail} />
      </FooterReveal>
    </div>
    </Motion>
  );
}
