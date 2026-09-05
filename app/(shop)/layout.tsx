import { getStoreSettings } from '@/lib/services/settings';
import { readCartView } from '@/lib/cart-session';
import { buildShopMenu } from '@/lib/shop/menu.server';
import { auth } from '@/auth';
import { isAdminSession } from '@/lib/auth/guards';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { Motion } from '@/components/ui/Motion';
import { ToastProvider } from '@/components/ui/Toast';
import { AnnounceBar } from '@/components/site/AnnounceBar';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { FooterReveal } from '@/components/site/FooterReveal';

export default async function ShopLayout({ children }: LayoutProps<'/'>) {
  const [settings, cart, session, menu] = await Promise.all([
    getStoreSettings(),
    readCartView(),
    auth(),
    buildShopMenu(),
  ]);

  return (
    <Motion>
    <ToastProvider>
    <div className="shell">
      <div className="shell__stack">
      <SmoothScroll />

      <a href="#main" className="skiplink">Skip to content</a>

      <AnnounceBar message={settings.announcement} />

      <Header
        menu={menu}
        cart={cart}
        signedIn={Boolean(session?.user)}
        isAdmin={isAdminSession(session)}
        storeEmail={settings.storeEmail}
      />

      {/* The Instagram band is no longer bolted on here. Every route but the
          homepage gets it from app/(shop)/(instagram-last)/layout.tsx; the
          homepage places it itself, above New arrivals. */}
      <main id="main">{children}</main>
      </div>

      <FooterReveal>
        <Footer storeEmail={settings.storeEmail} />
      </FooterReveal>
    </div>
    </ToastProvider>
    </Motion>
  );
}
