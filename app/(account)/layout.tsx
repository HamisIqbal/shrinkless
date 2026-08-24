import { getStoreSettings } from '@/lib/services/settings';
import { readCartView } from '@/lib/cart-session';
import { buildShopMenu } from '@/lib/shop/menu.server';
import { auth } from '@/auth';
import { Motion } from '@/components/ui/Motion';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';

export default async function AccountLayout({ children }: LayoutProps<'/'>) {
  const [settings, cart, session, menu] = await Promise.all([
    getStoreSettings(),
    readCartView(),
    auth(),
    buildShopMenu(),
  ]);

  return (
    <Motion>
    <div className="shell">
      <a href="#main" className="skiplink">Skip to content</a>

      <Header
        menu={menu}
        itemCount={cart?.itemCount ?? 0}
        signedIn={Boolean(session?.user)}
        storeEmail={settings.storeEmail}
      />

      <main id="main" className="band band--tight wrap narrow">{children}</main>

      <Footer storeEmail={settings.storeEmail} />
    </div>
    </Motion>
  );
}
