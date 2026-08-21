import { getStoreSettings } from '@/lib/services/settings';
import { readCartView } from '@/lib/cart-session';
import { auth } from '@/auth';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';

export default async function ShopLayout({ children }: LayoutProps<'/'>) {
  const [settings, cart, session] = await Promise.all([
    getStoreSettings(),
    readCartView(),
    auth(),
  ]);

  return (
    <div className="shell">
      <SmoothScroll />

      <a href="#main" className="skiplink">Skip to content</a>

      {settings.announcement ? (
        <p role="status" className="announce">{settings.announcement}</p>
      ) : null}

      <Header itemCount={cart?.itemCount ?? 0} signedIn={Boolean(session?.user)} />

      <main id="main">{children}</main>

      <Footer storeEmail={settings.storeEmail} />
    </div>
  );
}
