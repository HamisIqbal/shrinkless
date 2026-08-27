import { SettingsForm } from '@/components/admin/SettingsForm';
import { requireAdminPage } from '@/lib/auth/guards';
import { getStoreSettings } from '@/lib/services/settings';

export default async function AdminSettingsPage() {
  await requireAdminPage('settings:read');
  const settings = await getStoreSettings();

  return (
    <section>
      <h1>Store settings</h1>
      {/* The shipping/tax rules themselves are a Phase 5 concern; this page
          only stores the values lib/pricing will consume. */}
      <SettingsForm settings={settings} />
    </section>
  );
}
