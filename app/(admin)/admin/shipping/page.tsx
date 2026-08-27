import { ShippingManager } from '@/components/admin/ShippingManager';
import { requireAdminPage } from '@/lib/auth/guards';
import { getStoreSettings } from '@/lib/services/settings';
import { listShippingMethods } from '@/lib/services/shipping';

export default async function AdminShippingPage() {
  await requireAdminPage('shipping:read');

  const [methods, settings] = await Promise.all([
    listShippingMethods({ includeArchived: true }),
    getStoreSettings(),
  ]);

  return (
    <section>
      <h1>Shipping</h1>
      <p>
        Rates are quoted server-side at checkout. A method with no countries and
        no states applies everywhere; anything listed narrows it.
        {settings.freeShippingThresholdCents !== null
          ? ` Orders over ${(settings.freeShippingThresholdCents / 100).toFixed(2)} ship free store-wide.`
          : ''}
      </p>

      <ShippingManager methods={methods} />
    </section>
  );
}
