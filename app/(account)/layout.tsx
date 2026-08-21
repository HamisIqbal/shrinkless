import { getStoreSettings } from '@/lib/services/settings';
import { readCartView } from '@/lib/cart-session';
import { auth } from '@/auth';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';

export default async function AccountLayout({ children }: LayoutProps<'/'>) {
  const [settings, cart, session] = await Promise.all([
    getStoreSettings(),
    readCartView(),
    auth(),
  ]);

  return (
    <div className="shell">
      <a href="#main" className="skiplink">Skip to content</a>

      <Header itemCount={cart?.itemCount ?? 0} signedIn={Boolean(session?.user)} />

      <main id="main" className="band band--tight wrap narrow">{children}</main>

      <Footer storeEmail={settings.storeEmail} />
    </div>
  );
}
