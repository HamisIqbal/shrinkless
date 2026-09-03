'use client';

import { useState, useTransition } from 'react';
import {
  createSiteUploadSignatureAction,
  saveHeroFramesAction,
  saveMediaSlotAction,
} from '@/app/actions/admin/media';
import { uploadEndpoint } from '@/lib/cloudinary/config';
import { ImageCropField } from '@/components/admin/ImageCropField';
import { ZOOM_MIN, type ViewRatios } from '@/lib/media/crop';
import { HERO_MAX, HERO_MIN } from '@/lib/validation/media';
import type { MediaLibrary, MediaSlotView } from '@/lib/services/site-media';

type Frame = {
  url: string;
  alt: string;
  focus: string;
  zoom: number;
  /** Empty and undefined while the phone follows the desktop crop. */
  mobileFocus: string;
  mobileZoom?: number;
};

function toFrames(slot: MediaSlotView): Frame[] {
  return slot.frames.map((frame) => ({
    url: frame.url,
    alt: frame.alt,
    focus: frame.focus ?? '',
    zoom: frame.zoom ?? ZOOM_MIN,
    mobileFocus: frame.mobileFocus ?? '',
    mobileZoom: frame.mobileZoom,
  }));
}

/**
 * Whether two frames are the same edit.
 *
 * `Reset` is offered only when there is something to undo, so this decides
 * whether the button is there at all. Compared field by field rather than by
 * stringifying, because `mobileZoom` is legitimately `undefined` and a key
 * order is not a contract.
 */
function sameFrame(a: Frame, b: Frame): boolean {
  return (
    a.url === b.url &&
    a.alt === b.alt &&
    a.focus === b.focus &&
    a.zoom === b.zoom &&
    a.mobileFocus === b.mobileFocus &&
    a.mobileZoom === b.mobileZoom
  );
}

function sameFrames(a: Frame[], b: Frame[]): boolean {
  return a.length === b.length && a.every((frame, i) => sameFrame(frame, b[i]));
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
  ratios,
  onChange,
  onError,
}: {
  frame: Frame;
  ratios: ViewRatios;
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
        <ImageCropField
          url={frame.url}
          alt={frame.alt}
          crop={frame}
          ratios={ratios}
          onChange={(crop) =>
            onChange({
              focus: crop.focus ?? '',
              zoom: crop.zoom ?? ZOOM_MIN,
              mobileFocus: crop.mobileFocus ?? '',
              mobileZoom: crop.mobileZoom,
            })
          }
        />
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

      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   A single-image slot
   -------------------------------------------------------------------------- */

function SlotCard({ slot }: { slot: MediaSlotView }) {
  /* What the storefront is serving right now — the last save, or the shipped
     frame if there has never been one. `Reset` returns to this and no further:
     it undoes the edit in front of you, it does not throw away work that is
     already live. */
  const [saved, setSaved] = useState<Frame>(() => toFrames(slot)[0]);
  const [frame, setFrame] = useState<Frame>(saved);
  const [overridden, setOverridden] = useState(slot.overridden);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const edited = !sameFrame(frame, saved);

  function save() {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await saveMediaSlotAction({ slotId: slot.slotId, frame });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSaved(frame);
      setOverridden(true);
      setMessage('Saved. The storefront is updated.');
    });
  }

  /** Undoes the edits on this card. Nothing is sent, and nothing already
   *  saved is touched. */
  function reset() {
    setError('');
    setFrame(saved);
    setMessage('Changes undone. Back to the saved photograph.');
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
        ratios={slot.ratios}
        onChange={(patch) => setFrame({ ...frame, ...patch })}
        onError={setError}
      />

      <footer className="mediaslot__foot">
        <button type="button" className="abtn abtn--sm" onClick={save} disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </button>

        {edited ? (
          <button
            type="button"
            className="abtn abtn--quiet abtn--sm"
            onClick={reset}
            disabled={pending}
          >
            Reset changes
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
  /* Same rule as a single slot: the carousel resets to the set that is live,
     not to the set the site launched with. */
  const [saved, setSaved] = useState<Frame[]>(() => toFrames(slot));
  const [frames, setFrames] = useState<Frame[]>(saved);
  const [overridden, setOverridden] = useState(slot.overridden);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const edited = !sameFrames(frames, saved);

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
    setFrames([
      ...frames,
      { url: '', alt: '', focus: '', zoom: ZOOM_MIN, mobileFocus: '', mobileZoom: undefined },
    ]);
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

      setSaved(frames);
      setOverridden(true);
      setMessage('Saved. The storefront is updated.');
    });
  }

  /** Undoes the edits to the carousel — added, removed and reordered frames
   *  included — back to the set that is live. */
  function reset() {
    setError('');
    setFrames(saved);
    setMessage('Changes undone. Back to the saved frames.');
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
              ratios={slot.ratios}
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

        {edited ? (
          <button
            type="button"
            className="abtn abtn--quiet abtn--sm"
            onClick={reset}
            disabled={pending}
          >
            Reset changes
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
