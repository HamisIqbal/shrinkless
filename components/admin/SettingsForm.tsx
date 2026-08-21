'use client';

import { useState, useTransition } from 'react';
import { saveSettingsAction } from '@/app/actions/admin/settings';
import type { SettingsDTO } from '@/types/dto';

type Zone = SettingsDTO['shippingZones'][number];

export function SettingsForm({ settings }: { settings: SettingsDTO }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [storeEmail, setStoreEmail] = useState(settings.storeEmail);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [zones, setZones] = useState<Zone[]>(settings.shippingZones);
  const [threshold, setThreshold] = useState(
    settings.freeShippingThresholdCents === null ? '' : String(settings.freeShippingThresholdCents),
  );
  const [taxMode, setTaxMode] = useState(settings.taxMode);
  const [taxRate, setTaxRate] = useState(String(settings.flatTaxRateBasisPoints));

  function updateZone(index: number, patch: Partial<Zone>) {
    setZones(zones.map((zone, i) => (i === index ? { ...zone, ...patch } : zone)));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await saveSettingsAction({
        storeEmail,
        announcement,
        shippingZones: zones,
        freeShippingThresholdCents: threshold === '' ? null : Number(threshold),
        taxMode,
        flatTaxRateBasisPoints: Number(taxRate),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage('Settings saved.');
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Store email
        <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} required />
      </label>

      <label>Announcement bar
        <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
      </label>

      <fieldset>
        <legend>Shipping zones</legend>
        {zones.map((zone, index) => (
          <div key={index}>
            <label>Name
              <input value={zone.name} onChange={(e) => updateZone(index, { name: e.target.value })} />
            </label>
            <label>States (comma separated, two-letter codes)
              <input
                value={zone.states.join(', ')}
                onChange={(e) => updateZone(index, {
                  states: e.target.value.split(',').map((part) => part.trim()).filter(Boolean),
                })}
              />
            </label>
            <label>Rate (cents)
              <input
                type="number" min={0} step={1} value={zone.rateCents}
                onChange={(e) => updateZone(index, { rateCents: Number(e.target.value) })}
              />
            </label>
            <button type="button" onClick={() => setZones(zones.filter((_, i) => i !== index))}>
              Remove zone
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setZones([...zones, { name: '', states: [], rateCents: 0 }])}>
          Add zone
        </button>
      </fieldset>

      <label>Free shipping threshold (cents, blank for none)
        <input type="number" min={0} step={1} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
      </label>

      <label>Tax mode
        <select value={taxMode} onChange={(e) => setTaxMode(e.target.value as SettingsDTO['taxMode'])}>
          <option value="none">None</option>
          <option value="flat">Flat rate</option>
          <option value="stripe">Stripe Tax</option>
        </select>
      </label>

      <label>Flat tax rate (basis points)
        <input type="number" min={0} max={10000} step={1} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
      </label>

      <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save settings'}</button>
      {message ? <p role="status">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
