'use client';

import { useState, useTransition } from 'react';
import {
  createSiteUploadSignatureAction,
  resetMediaSlotAction,
  saveHeroFramesAction,
  saveMediaSlotAction,
} from '@/app/actions/admin/media';
import { uploadEndpoint } from '@/lib/cloudinary/config';
import { imageUrl } from '@/lib/images';
import { HERO_MAX, HERO_MIN } from '@/lib/validation/media';
import type { MediaLibrary, MediaSlotView } from '@/lib/services/site-media';

type Frame = { url: string; alt: string; focus: string };

const FOCUS_PRESETS = [
  { value: '', label: 'Centre' },
  { value: '50% 20%', label: 'Top' },
  { value: '50% 35%', label: 'Upper' },
  { value: '50% 65%', label: 'Lower' },
  { value: '50% 85%', label: 'Bottom' },
];

function toFrames(slot: MediaSlotView): Frame[] {
  return slot.frames.map((frame) => ({
    url: frame.url,
    alt: frame.alt,
    focus: frame.focus ?? '',
  }));
}

/**
 * Sends one file to Cloudinary and returns its public id.
 *
 * The bytes go straight from this browser to Cloudinary; the server only ever
 * hands out a signature, so a large photograph never travels through a
 * serverless function with a timeout on it.
 */
async function upload(file: File): Promise<string> {
  const signed = await createSiteUploadSignatureAction();
  if (!signed.ok) throw new Error(signed.error);

  const body = new FormData();
  body.set('file', file);
  body.set('api_key', signed.apiKey);
  body.set('timestamp', String(signed.timestamp));
  body.set('folder', signed.folder);
  body.set('signature', signed.signature);

  const response = await fetch(uploadEndpoint(signed.cloudName), { method: 'POST', body });
  if (!response.ok) throw new Error('Cloudinary rejected the upload.');

  const uploaded = (await response.json()) as { public_id: string };
  return uploaded.public_id;
}

/* --------------------------------------------------------------------------
   One frame's fields
   -------------------------------------------------------------------------- */

function FrameFields({
  frame,
  onChange,
  onError,
}: {
  frame: Frame;
  onChange: (patch: Partial<Frame>) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setBusy(true);
    onError('');

    try {
      onChange({ url: await upload(file) });
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mediaslot__body">
      <div className="mediaslot__preview">
        {frame.url ? (
          /* Not next/image: the source changes as the admin types, and this is
             a proof that the address resolves, not a rendered frame. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(frame.url)}
            alt=""
            className="mediaslot__image"
            style={frame.focus ? { objectPosition: frame.focus } : undefined}
          />
        ) : (
          <span className="mediaslot__empty">No image</span>
        )}
      </div>

      <div className="mediaslot__fields">
        <label className="adfield">
          Image
          <input
            value={frame.url}
            onChange={(event) => onChange({ url: event.target.value })}
            placeholder="https://… or a Cloudinary id"
            spellCheck={false}
          />
          <small>Paste an https:// address, or upload a file below.</small>
        </label>

        <label className="abtn abtn--ghost abtn--sm mediaslot__upload">
          {busy ? 'Uploading…' : 'Upload a file'}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={busy}
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>

        <label className="adfield">
          Alt text
          <input
            value={frame.alt}
            onChange={(event) => onChange({ alt: event.target.value })}
            maxLength={200}
            required
          />
          <small>Describe what is in the picture. Screen readers read this.</small>
        </label>

        <label className="adfield">
          Crop
          <select
            value={FOCUS_PRESETS.some((preset) => preset.value === frame.focus) ? frame.focus : ''}
            onChange={(event) => onChange({ focus: event.target.value })}
          >
            {FOCUS_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <small>
            Which part of the photograph to keep when the frame is a different
            shape.
          </small>
        </label>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   A single-image slot
   -------------------------------------------------------------------------- */

function SlotCard({ slot }: { slot: MediaSlotView }) {
  const [frame, setFrame] = useState<Frame>(() => toFrames(slot)[0]);
  const [overridden, setOverridden] = useState(slot.overridden);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function save() {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await saveMediaSlotAction({ slotId: slot.slotId, frame });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOverridden(true);
      setMessage('Saved. The storefront is updated.');
    });
  }

  function reset() {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await resetMediaSlotAction({ slotId: slot.slotId });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOverridden(false);
      setMessage('Restored. Reload to see the original.');
    });
  }

  return (
    <article className="panel mediaslot">
      <header className="mediaslot__head">
        <div>
          <h3 className="mediaslot__title">{slot.label}</h3>
          <p className="mediaslot__where">{slot.where}</p>
        </div>

        <span className={`mediaslot__state${overridden ? ' mediaslot__state--on' : ''}`}>
          {overridden ? 'Changed' : 'Original'}
        </span>
      </header>

      <FrameFields
        frame={frame}
        onChange={(patch) => setFrame({ ...frame, ...patch })}
        onError={setError}
      />

      <footer className="mediaslot__foot">
        <button type="button" className="abtn abtn--sm" onClick={save} disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </button>

        {overridden ? (
          <button
            type="button"
            className="abtn abtn--quiet abtn--sm"
            onClick={reset}
            disabled={pending}
          >
            Reset to default
          </button>
        ) : null}

        {error ? <p className="anotice anotice--error">{error}</p> : null}
        {!error && message ? <p className="anotice">{message}</p> : null}
      </footer>
    </article>
  );
}

/* --------------------------------------------------------------------------
   The carousel
   -------------------------------------------------------------------------- */

function HeroCard({ slot }: { slot: MediaSlotView }) {
  const [frames, setFrames] = useState<Frame[]>(() => toFrames(slot));
  const [overridden, setOverridden] = useState(slot.overridden);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function patch(index: number, change: Partial<Frame>) {
    setFrames(frames.map((frame, i) => (i === index ? { ...frame, ...change } : frame)));
  }

  /** Order is the campaign's running order, so moving a frame is how it is set. */
  function move(index: number, by: number) {
    const target = index + by;
    if (target < 0 || target >= frames.length) return;

    const next = [...frames];
    [next[index], next[target]] = [next[target], next[index]];
    setFrames(next);
  }

  function add() {
    if (frames.length >= HERO_MAX) return;
    setFrames([...frames, { url: '', alt: '', focus: '' }]);
  }

  function remove(index: number) {
    if (frames.length <= HERO_MIN) return;
    setFrames(frames.filter((_, i) => i !== index));
  }

  function save() {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await saveHeroFramesAction({ frames });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOverridden(true);
      setMessage('Saved. The storefront is updated.');
    });
  }

  function reset() {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await resetMediaSlotAction({ slotId: slot.slotId });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOverridden(false);
      setMessage('Restored. Reload to see the original frames.');
    });
  }

  return (
    <article className="panel mediaslot">
      <header className="mediaslot__head">
        <div>
          <h3 className="mediaslot__title">{slot.label}</h3>
          <p className="mediaslot__where">{slot.where}</p>
        </div>

        <span className={`mediaslot__state${overridden ? ' mediaslot__state--on' : ''}`}>
          {overridden ? 'Changed' : 'Original'}
        </span>
      </header>

      <ol className="mediaslot__frames">
        {frames.map((frame, index) => (
          <li key={index} className="mediaslot__frame">
            <div className="mediaslot__framehead">
              <span className="mediaslot__index">Frame {index + 1}</span>

              <div className="mediaslot__reorder">
                <button
                  type="button"
                  className="abtn abtn--quiet abtn--sm"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move frame ${index + 1} earlier`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="abtn abtn--quiet abtn--sm"
                  onClick={() => move(index, 1)}
                  disabled={index === frames.length - 1}
                  aria-label={`Move frame ${index + 1} later`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="abtn abtn--quiet abtn--sm"
                  onClick={() => remove(index)}
                  disabled={frames.length <= HERO_MIN}
                  aria-label={`Remove frame ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            </div>

            <FrameFields
              frame={frame}
              onChange={(change) => patch(index, change)}
              onError={setError}
            />
          </li>
        ))}
      </ol>

      <footer className="mediaslot__foot">
        <button type="button" className="abtn abtn--sm" onClick={save} disabled={pending}>
          {pending ? 'Saving…' : 'Save carousel'}
        </button>

        <button
          type="button"
          className="abtn abtn--ghost abtn--sm"
          onClick={add}
          disabled={frames.length >= HERO_MAX}
        >
          Add a frame
        </button>

        {overridden ? (
          <button
            type="button"
            className="abtn abtn--quiet abtn--sm"
            onClick={reset}
            disabled={pending}
          >
            Reset to default
          </button>
        ) : null}

        {error ? <p className="anotice anotice--error">{error}</p> : null}
        {!error && message ? <p className="anotice">{message}</p> : null}
      </footer>
    </article>
  );
}

/* --------------------------------------------------------------------------
   The page
   -------------------------------------------------------------------------- */

export function MediaManager({ library }: { library: MediaLibrary }) {
  return (
    <div className="media">
      <section className="settings__group">
        <div className="settings__aside">
          <h2 className="settings__grouptitle">Campaign carousel</h2>
          <p className="settings__groupnote">
            The frames behind the headline on the home page. They cycle on their
            own, so the order is the running order. Between {HERO_MIN} and{' '}
            {HERO_MAX} of them.
          </p>
        </div>

        <div className="settings__fields">
          <HeroCard slot={library.hero} />
        </div>
      </section>

      <section className="settings__group">
        <div className="settings__aside">
          <h2 className="settings__grouptitle">Category tiles</h2>
          <p className="settings__groupnote">
            The shopping doors on the home page, and the pictures in the desktop
            menu. One per category in the catalogue.
          </p>
        </div>

        <div className="settings__fields">
          {library.categories.map((slot) => (
            <SlotCard key={slot.slotId} slot={slot} />
          ))}
        </div>
      </section>

      <section className="settings__group">
        <div className="settings__aside">
          <h2 className="settings__grouptitle">Editorial</h2>
          <p className="settings__groupnote">
            The photography the storefront is composed from. Several frames
            appear in more than one place — changing one changes all of them,
            which is said under each name.
          </p>
        </div>

        <div className="settings__fields">
          {library.editorial.map((slot) => (
            <SlotCard key={slot.slotId} slot={slot} />
          ))}
        </div>
      </section>
    </div>
  );
}
