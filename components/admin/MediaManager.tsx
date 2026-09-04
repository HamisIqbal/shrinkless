'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSiteUploadSignatureAction,
  resetMediaSlotAction,
  saveHeroFramesAction,
  saveMediaSlotAction,
} from '@/app/actions/admin/media';
import { uploadEndpoint } from '@/lib/cloudinary/config';
import { ImageCropField } from '@/components/admin/ImageCropField';
import { sizedImageUrl } from '@/lib/images';
import {
  ZOOM_MIN,
  desktopView,
  mobileView,
  ratioValue,
  viewStyle,
  type Ratio,
} from '@/lib/media/crop';
import { HERO_MAX, HERO_MIN } from '@/lib/validation/media';
import type { MediaPageView, MediaSlotView } from '@/lib/services/site-media';

type Viewport = 'desktop' | 'mobile';

type Frame = {
  url: string;
  alt: string;
  focus: string;
  zoom: number;
  /** Empty and undefined while the phone follows the desktop crop. */
  mobileFocus: string;
  mobileZoom?: number;
};

/** Which photograph is being edited. A slot can stand in two places on one
 *  page — the same frame is a story tile and a lookbook tile — so the
 *  selection is the slot and not the place it was clicked. */
type Selection = { slotId: string; index: number };

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

function blankFrame(): Frame {
  return { url: '', alt: '', focus: '', zoom: ZOOM_MIN, mobileFocus: '', mobileZoom: undefined };
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

/** Every slot on every page, once each — the state below is keyed by slot, so
 *  a frame used twice is one record and editing it from either place moves
 *  both, exactly as the storefront does. */
function allSlots(pages: MediaPageView[]): MediaSlotView[] {
  const seen = new Map<string, MediaSlotView>();

  for (const page of pages) {
    for (const section of page.sections) {
      for (const slot of section.slots) {
        if (!seen.has(slot.slotId)) seen.set(slot.slotId, slot);
      }
    }
  }

  return [...seen.values()];
}

/* --------------------------------------------------------------------------
   One photograph on the canvas
   -------------------------------------------------------------------------- */

/**
 * A frame as the page renders it, at the shape the chosen viewport gives it
 * and with the crop that viewport actually uses.
 *
 * Not `next/image`: the source changes as the admin replaces it, and this is a
 * rehearsal of a layout rather than a rendered page.
 */
function CanvasFrame({
  frame,
  ratio,
  viewport,
  label,
  selected,
  edited,
  onSelect,
}: {
  frame: Frame;
  ratio: Ratio;
  viewport: Viewport;
  label: string;
  selected: boolean;
  edited: boolean;
  onSelect: () => void;
}) {
  const view = viewport === 'mobile' ? mobileView(frame) : desktopView(frame);

  return (
    <button
      type="button"
      className={`canvasframe${selected ? ' canvasframe--on' : ''}`}
      style={{ aspectRatio: ratioValue(ratio) }}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Edit the photograph in ${label}`}
    >
      {frame.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sizedImageUrl(frame.url, 'w_900,q_auto,f_auto')} alt="" style={viewStyle(view)} />
      ) : (
        <span className="canvasframe__empty">No image yet</span>
      )}

      <span className="canvasframe__veil" aria-hidden="true">
        <span className="canvasframe__action">{selected ? 'Editing' : 'Edit'}</span>
      </span>

      <span className="canvasframe__name" aria-hidden="true">
        {label}
        {edited ? <em className="canvasframe__dot" /> : null}
      </span>
    </button>
  );
}

/* --------------------------------------------------------------------------
   The page canvas
   -------------------------------------------------------------------------- */

function Canvas({
  page,
  viewport,
  drafts,
  saved,
  selection,
  onSelect,
}: {
  page: MediaPageView;
  viewport: Viewport;
  drafts: Record<string, Frame[]>;
  saved: Record<string, Frame[]>;
  selection: Selection | null;
  onSelect: (selection: Selection) => void;
}) {
  return (
    <div className={`canvas canvas--${viewport}`}>
      <div className="canvas__device">
        {page.sections.map((section) => (
          <section key={section.id} className={`canvasrow canvasrow--${section.kind}`}>
            <header className="canvasrow__head">
              <h3 className="canvasrow__title">{section.label}</h3>
              <p className="canvasrow__note">{section.note}</p>
            </header>

            <div className="canvasrow__frames">
              {section.slots.flatMap((slot) =>
                (drafts[slot.slotId] ?? []).map((frame, index) => (
                  <CanvasFrame
                    key={`${slot.slotId}:${index}`}
                    frame={frame}
                    ratio={slot.ratios[viewport]}
                    viewport={viewport}
                    label={
                      (drafts[slot.slotId] ?? []).length > 1
                        ? `${slot.label} ${index + 1}`
                        : slot.label
                    }
                    selected={selection?.slotId === slot.slotId && selection.index === index}
                    edited={!sameFrames(drafts[slot.slotId] ?? [], saved[slot.slotId] ?? [])}
                    onSelect={() => onSelect({ slotId: slot.slotId, index })}
                  />
                )),
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The contextual panel
   -------------------------------------------------------------------------- */

function Inspector({
  slot,
  frames,
  savedFrames,
  overridden,
  index,
  viewport,
  isHero,
  onChange,
  onSelectFrame,
  onSaved,
  onRestored,
  onClose,
}: {
  slot: MediaSlotView;
  frames: Frame[];
  savedFrames: Frame[];
  overridden: boolean;
  index: number;
  viewport: Viewport;
  isHero: boolean;
  onChange: (frames: Frame[]) => void;
  onSelectFrame: (index: number) => void;
  onSaved: (frames: Frame[]) => void;
  onRestored: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const frame = frames[index] ?? frames[0];
  const edited = !sameFrames(frames, savedFrames);

  function patch(change: Partial<Frame>) {
    setMessage('');
    onChange(frames.map((existing, i) => (i === index ? { ...existing, ...change } : existing)));
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setBusy(true);
    setError('');

    try {
      patch({ url: await upload(file) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  /** Order is the campaign's running order, so moving a frame is how it is set. */
  function move(by: number) {
    const target = index + by;
    if (target < 0 || target >= frames.length) return;

    const next = [...frames];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    onSelectFrame(target);
  }

  function add() {
    if (frames.length >= HERO_MAX) return;
    onChange([...frames, blankFrame()]);
    onSelectFrame(frames.length);
  }

  function remove() {
    if (frames.length <= HERO_MIN) return;
    onChange(frames.filter((_, i) => i !== index));
    onSelectFrame(Math.max(0, index - 1));
  }

  function save() {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = isHero
        ? await saveHeroFramesAction({ frames })
        : await saveMediaSlotAction({ slotId: slot.slotId, frame: frames[0] });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onSaved(frames);
      setMessage('Saved. The storefront is updated.');
    });
  }

  /** Undoes the edits on this photograph. Nothing is sent, and nothing already
   *  saved is touched. */
  function undo() {
    setError('');
    onChange(savedFrames);
    setMessage('Changes undone. Back to the saved photograph.');
  }

  /** Forgets the override, so the slot falls back to the frame the site
   *  shipped with. The server is the only place that knows what that is, so
   *  the panel reloads rather than guessing. */
  function restore() {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await resetMediaSlotAction({ slotId: slot.slotId });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onRestored();
    });
  }

  return (
    <aside className="panel inspector" aria-label={`${slot.label} media`}>
      <header className="inspector__head">
        <div>
          <h3 className="inspector__title">{slot.label}</h3>
          <p className="inspector__where">{slot.where}</p>
        </div>

        <button
          type="button"
          className="abtn abtn--quiet abtn--sm inspector__close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </header>

      <p className="inspector__meta">
        <span className={`mediaslot__state${overridden ? ' mediaslot__state--on' : ''}`}>
          {overridden ? 'Changed' : 'Original'}
        </span>
        <span className="inspector__ratio">
          {viewport === 'mobile' ? 'Mobile' : 'Desktop'} — {slot.ratios[viewport].w}:
          {slot.ratios[viewport].h}
        </span>
      </p>

      {isHero ? (
        <div className="inspector__frames">
          <span className="inspector__framelabel">
            Frame {index + 1} of {frames.length}
          </span>

          <span className="inspector__framebuttons">
            <button
              type="button"
              className="abtn abtn--quiet abtn--sm"
              onClick={() => move(-1)}
              disabled={index === 0}
              aria-label="Move this frame earlier"
            >
              ↑
            </button>
            <button
              type="button"
              className="abtn abtn--quiet abtn--sm"
              onClick={() => move(1)}
              disabled={index === frames.length - 1}
              aria-label="Move this frame later"
            >
              ↓
            </button>
            <button
              type="button"
              className="abtn abtn--quiet abtn--sm"
              onClick={add}
              disabled={frames.length >= HERO_MAX}
            >
              Add
            </button>
            <button
              type="button"
              className="abtn abtn--quiet abtn--sm"
              onClick={remove}
              disabled={frames.length <= HERO_MIN}
            >
              Remove
            </button>
          </span>
        </div>
      ) : null}

      <div className="inspector__body">
        <label className="adfield">
          Image
          <input
            value={frame.url}
            onChange={(event) => patch({ url: event.target.value })}
            placeholder="https://… or a Cloudinary id"
            spellCheck={false}
          />
        </label>

        <label className="abtn abtn--ghost abtn--sm mediaslot__upload">
          {busy ? 'Uploading…' : 'Replace with a file'}
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
            onChange={(event) => patch({ alt: event.target.value })}
            maxLength={200}
            required
          />
          <small>Describe what is in the picture. Screen readers read this.</small>
        </label>

        {/* One stage, the viewport the canvas is showing. The other placement
            is untouched by anything done here, so desktop and mobile stay the
            independent pair the storefront renders. */}
        <ImageCropField
          url={frame.url}
          alt={frame.alt}
          crop={frame}
          ratios={slot.ratios}
          only={viewport}
          onChange={(crop) =>
            patch({
              focus: crop.focus ?? '',
              zoom: crop.zoom ?? ZOOM_MIN,
              mobileFocus: crop.mobileFocus ?? '',
              mobileZoom: crop.mobileZoom,
            })
          }
        />
      </div>

      <footer className="inspector__foot">
        <button type="button" className="abtn abtn--sm" onClick={save} disabled={pending}>
          {pending ? 'Saving…' : isHero ? 'Save carousel' : 'Save'}
        </button>

        {edited ? (
          <button
            type="button"
            className="abtn abtn--quiet abtn--sm"
            onClick={undo}
            disabled={pending}
          >
            Reset changes
          </button>
        ) : null}

        {overridden ? (
          <button
            type="button"
            className="abtn abtn--quiet abtn--sm"
            onClick={restore}
            disabled={pending}
          >
            Restore original
          </button>
        ) : null}

        {error ? <p className="anotice anotice--error">{error}</p> : null}
        {!error && message ? <p className="anotice">{message}</p> : null}
      </footer>
    </aside>
  );
}

/* --------------------------------------------------------------------------
   The tab
   -------------------------------------------------------------------------- */

function Builder({ pages, onRestored }: { pages: MediaPageView[]; onRestored: () => void }) {
  const slots = useMemo(() => allSlots(pages), [pages]);
  const byId = useMemo(
    () => new Map(slots.map((slot) => [slot.slotId, slot])),
    [slots],
  );

  /* What the storefront is serving right now — the last save, or the shipped
     frame if there has never been one. `Reset changes` returns to this and no
     further: it undoes the edit in front of you, it does not throw away work
     that is already live. */
  const [saved, setSaved] = useState<Record<string, Frame[]>>(() =>
    Object.fromEntries(slots.map((slot) => [slot.slotId, toFrames(slot)])),
  );
  const [drafts, setDrafts] = useState<Record<string, Frame[]>>(saved);
  const [overridden, setOverridden] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(slots.map((slot) => [slot.slotId, slot.overridden])),
  );

  const [pageId, setPageId] = useState(pages[0]?.id ?? '');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [selection, setSelection] = useState<Selection | null>(null);

  const page = pages.find((candidate) => candidate.id === pageId) ?? pages[0];
  const selected = selection ? byId.get(selection.slotId) : undefined;

  function choosePage(next: string) {
    setPageId(next);
    setSelection(null);
  }

  return (
    <div className="mediabuild">
      <header className="mediabuild__bar">
        <label className="adfield adfield--inline mediabuild__page">
          Current page
          <select value={page?.id ?? ''} onChange={(event) => choosePage(event.target.value)}>
            {pages.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>

        <div className="viewtoggle" role="group" aria-label="Viewport">
          {(['desktop', 'mobile'] as Viewport[]).map((value) => (
            <button
              key={value}
              type="button"
              className={`viewtoggle__btn${viewport === value ? ' viewtoggle__btn--on' : ''}`}
              onClick={() => setViewport(value)}
              aria-pressed={viewport === value}
            >
              {value === 'desktop' ? 'Desktop' : 'Mobile'}
            </button>
          ))}
        </div>

        <p className="mediabuild__hint">
          Click a photograph to replace or re-crop it. Desktop and mobile keep
          their own crops.
        </p>
      </header>

      <div className={`mediabuild__stage${selected ? ' mediabuild__stage--open' : ''}`}>
        {page ? (
          <Canvas
            page={page}
            viewport={viewport}
            drafts={drafts}
            saved={saved}
            selection={selection}
            onSelect={setSelection}
          />
        ) : null}

        {selected && selection ? (
          <Inspector
            key={`${selected.slotId}:${viewport}`}
            slot={selected}
            frames={drafts[selected.slotId] ?? []}
            savedFrames={saved[selected.slotId] ?? []}
            overridden={overridden[selected.slotId] ?? false}
            index={Math.max(0, Math.min(selection.index, (drafts[selected.slotId] ?? []).length - 1))}
            viewport={viewport}
            isHero={selected.slotId === 'hero'}
            onChange={(frames) =>
              setDrafts((current) => ({ ...current, [selected.slotId]: frames }))
            }
            onSelectFrame={(index) => setSelection({ slotId: selected.slotId, index })}
            onSaved={(frames) => {
              setSaved((current) => ({ ...current, [selected.slotId]: frames }));
              setOverridden((current) => ({ ...current, [selected.slotId]: true }));
            }}
            onRestored={onRestored}
            onClose={() => setSelection(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * The storefront's photography, edited on the page it appears on.
 *
 * A restore deletes the override, and only the server knows what the site
 * shipped with — so that one action refreshes and remounts the builder, and
 * the drafts start again from what came back. Saving does not: the panel
 * already knows what it just wrote, and remounting there would close the
 * photograph the admin is still working on.
 */
export function MediaManager({ pages }: { pages: MediaPageView[] }) {
  const router = useRouter();
  const [version, setVersion] = useState(0);

  return (
    <Builder
      key={version}
      pages={pages}
      onRestored={() => {
        router.refresh();
        setVersion((current) => current + 1);
      }}
    />
  );
}
