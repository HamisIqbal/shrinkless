'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resetContentFieldAction, saveContentPageAction } from '@/app/actions/admin/content';
import { CONTENT_WEIGHTS, type ContentStyle, type ContentStyleSet } from '@/lib/content/style';
import type { ContentFieldView, ContentKind, ContentPageView } from '@/lib/services/site-content';

type Viewport = 'desktop' | 'mobile';

/** Same stamp the page's own editor bridge uses. Anything else on the message
 *  channel is somebody else's business. */
const CHANNEL = 'shrinkless-content';

/** One field as the editor holds it while nothing has been saved. */
type Draft = { value: string; style: ContentStyleSet };

/** Every field on every page, once each — the drafts below are keyed by field,
 *  so a field shown on two pages is still one record. */
function allFields(pages: ContentPageView[]): ContentFieldView[] {
  const seen = new Map<string, ContentFieldView>();

  for (const page of pages) {
    for (const section of page.sections) {
      for (const field of section.fields) {
        if (!seen.has(field.key)) seen.set(field.key, field);
      }
    }
  }

  return [...seen.values()];
}

function pageFields(page: ContentPageView): ContentFieldView[] {
  return page.sections.flatMap((section) => section.fields);
}

/** Which kinds are written in a box rather than on a line. A heading that
 *  wraps is still a heading; a paragraph typed into a single-line input is a
 *  paragraph nobody can read while writing it. */
function isLong(kind: ContentKind): boolean {
  return kind === 'body' || kind === 'answer' || kind === 'lede';
}

function sameStyle(a: ContentStyleSet, b: ContentStyleSet): boolean {
  return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
}

function sameDraft(a: Draft, b: Draft): boolean {
  return a.value === b.value && sameStyle(a.style, b.style);
}

/* --------------------------------------------------------------------------
   The controls

   Every setting is a bounded one. There is no free CSS box here on purpose:
   the admin is composing a page that has to keep working, so what is offered
   is a range with ends, or a handful of named values, and "unset" is always
   one of them — a field nobody has touched is drawn the way the page draws it,
   and clearing a setting gives that back rather than freezing today's number.
   -------------------------------------------------------------------------- */

function Row({
  label,
  set,
  onClear,
  children,
}: {
  label: string;
  set: boolean;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`ctl${set ? ' ctl--set' : ''}`}>
      <div className="ctl__head">
        <span className="ctl__label">{label}</span>
        {set ? (
          <button
            type="button"
            className="ctl__clear"
            onClick={onClear}
            title="Back to the page's own setting"
          >
            Clear
          </button>
        ) : (
          <span className="ctl__auto">Page</span>
        )}
      </div>
      <div className="ctl__body">{children}</div>
    </div>
  );
}

function NumberRow({
  label,
  value,
  fallback,
  min,
  max,
  step = 1,
  suffix,
  onChange,
  onClear,
}: {
  label: string;
  value: number | undefined;
  /** What the slider rests on before anybody has set anything. */
  fallback: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  onClear: () => void;
}) {
  const current = value ?? fallback;

  return (
    <Row label={label} set={value !== undefined} onClear={onClear}>
      <div className="ctl__slide">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={label}
        />
        <input
          type="number"
          className="ctl__num"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={`${label} value`}
        />
        {suffix ? <span className="ctl__unit">{suffix}</span> : null}
      </div>
    </Row>
  );
}

function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
  onClear,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  onClear: () => void;
}) {
  return (
    <Row label={label} set={value !== undefined} onClear={onClear}>
      <div className="ctl__choices" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`ctl__choice${value === option.value ? ' ctl__choice--on' : ''}`}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Row>
  );
}

/* --------------------------------------------------------------------------
   The style panel
   -------------------------------------------------------------------------- */

function StyleControls({
  style,
  viewport,
  onChange,
}: {
  style: ContentStyle;
  viewport: Viewport;
  onChange: (next: ContentStyle) => void;
}) {
  const set = <K extends keyof ContentStyle>(name: K, value: ContentStyle[K]) =>
    onChange({ ...style, [name]: value });

  const clear = (name: keyof ContentStyle) => {
    const next = { ...style };
    delete next[name];
    onChange(next);
  };

  return (
    <div className="ctls">
      <p className="ctls__scope">
        Setting the <strong>{viewport === 'desktop' ? 'desktop' : 'mobile'}</strong> value. The
        other width keeps whatever it already has.
      </p>

      <h4 className="ctls__head">Type</h4>

      <ChoiceRow
        label="Font"
        value={style.font}
        options={[
          { value: 'sans', label: 'Inter Tight' },
          { value: 'serif', label: 'Cormorant' },
        ]}
        onChange={(value) => set('font', value)}
        onClear={() => clear('font')}
      />

      <NumberRow
        label="Size"
        value={style.size}
        fallback={viewport === 'desktop' ? 32 : 24}
        min={8}
        max={160}
        suffix="px"
        onChange={(value) => set('size', value)}
        onClear={() => clear('size')}
      />

      <Row label="Weight" set={style.weight !== undefined} onClear={() => clear('weight')}>
        <div className="ctl__choices" role="group" aria-label="Weight">
          {CONTENT_WEIGHTS.map((weight) => (
            <button
              key={weight}
              type="button"
              className={`ctl__choice${style.weight === weight ? ' ctl__choice--on' : ''}`}
              onClick={() => set('weight', weight)}
              aria-pressed={style.weight === weight}
            >
              {weight}
            </button>
          ))}
        </div>
      </Row>

      <Row
        label="Bold and italic"
        set={style.weight !== undefined || style.italic !== undefined}
        onClear={() => {
          const next = { ...style };
          delete next.weight;
          delete next.italic;
          onChange(next);
        }}
      >
        <div className="ctl__choices">
          <button
            type="button"
            className={`ctl__choice${(style.weight ?? 0) >= 700 ? ' ctl__choice--on' : ''}`}
            onClick={() => set('weight', (style.weight ?? 0) >= 700 ? 400 : 700)}
            aria-pressed={(style.weight ?? 0) >= 700}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`ctl__choice${style.italic ? ' ctl__choice--on' : ''}`}
            onClick={() => set('italic', !style.italic)}
            aria-pressed={Boolean(style.italic)}
          >
            <em>I</em>
          </button>
        </div>
      </Row>

      <Row label="Colour" set={style.color !== undefined} onClear={() => clear('color')}>
        <div className="ctl__slide">
          <input
            type="color"
            className="ctl__colour"
            value={style.color ?? '#111111'}
            onChange={(event) => set('color', event.target.value)}
            aria-label="Colour"
          />
          <span className="ctl__unit">{style.color ?? 'as the page sets it'}</span>
        </div>
      </Row>

      <NumberRow
        label="Opacity"
        value={style.opacity}
        fallback={100}
        min={0}
        max={100}
        suffix="%"
        onChange={(value) => set('opacity', value)}
        onClear={() => clear('opacity')}
      />

      <NumberRow
        label="Line height"
        value={style.lineHeight}
        fallback={1.3}
        min={0.7}
        max={3}
        step={0.05}
        onChange={(value) => set('lineHeight', value)}
        onClear={() => clear('lineHeight')}
      />

      <NumberRow
        label="Letter spacing"
        value={style.letterSpacing}
        fallback={0}
        min={-0.1}
        max={0.6}
        step={0.005}
        suffix="em"
        onChange={(value) => set('letterSpacing', value)}
        onClear={() => clear('letterSpacing')}
      />

      <ChoiceRow
        label="Alignment"
        value={style.align}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Centre' },
          { value: 'right', label: 'Right' },
        ]}
        onChange={(value) => set('align', value)}
        onClear={() => clear('align')}
      />

      <ChoiceRow
        label="Case"
        value={style.transform}
        options={[
          { value: 'none', label: 'As typed' },
          { value: 'uppercase', label: 'CAPS' },
          { value: 'lowercase', label: 'lower' },
          { value: 'capitalize', label: 'Title' },
        ]}
        onChange={(value) => set('transform', value)}
        onClear={() => clear('transform')}
      />

      <ChoiceRow
        label="Underline"
        value={style.decoration}
        options={[
          { value: 'none', label: 'None' },
          { value: 'underline', label: 'Underline' },
          { value: 'line-through', label: 'Struck' },
        ]}
        onChange={(value) => set('decoration', value)}
        onClear={() => clear('decoration')}
      />

      <h4 className="ctls__head">Placement</h4>

      <NumberRow
        label="Width"
        value={style.width}
        fallback={100}
        min={10}
        max={100}
        suffix="%"
        onChange={(value) => set('width', value)}
        onClear={() => clear('width')}
      />

      <NumberRow
        label="Measure"
        value={style.maxWidth}
        fallback={720}
        min={0}
        max={1600}
        step={10}
        suffix="px"
        onChange={(value) => set('maxWidth', value)}
        onClear={() => clear('maxWidth')}
      />

      <ChoiceRow
        label="Sits"
        value={style.place}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Centred' },
          { value: 'right', label: 'Right' },
        ]}
        onChange={(value) => set('place', value)}
        onClear={() => clear('place')}
      />

      <NumberRow
        label="Space above"
        value={style.marginTop}
        fallback={0}
        min={-120}
        max={240}
        suffix="px"
        onChange={(value) => set('marginTop', value)}
        onClear={() => clear('marginTop')}
      />

      <NumberRow
        label="Space below"
        value={style.marginBottom}
        fallback={0}
        min={-120}
        max={240}
        suffix="px"
        onChange={(value) => set('marginBottom', value)}
        onClear={() => clear('marginBottom')}
      />

      <NumberRow
        label="Padding, sides"
        value={style.padX}
        fallback={0}
        min={0}
        max={160}
        suffix="px"
        onChange={(value) => set('padX', value)}
        onClear={() => clear('padX')}
      />

      <NumberRow
        label="Padding, top and bottom"
        value={style.padY}
        fallback={0}
        min={0}
        max={160}
        suffix="px"
        onChange={(value) => set('padY', value)}
        onClear={() => clear('padY')}
      />
    </div>
  );
}

/* --------------------------------------------------------------------------
   The contextual panel
   -------------------------------------------------------------------------- */

function Inspector({
  field,
  page,
  draft,
  savedDraft,
  overridden,
  viewport,
  placeable,
  onChange,
  onReset,
  onRestored,
  onClose,
}: {
  field: ContentFieldView;
  page: ContentPageView;
  draft: Draft;
  savedDraft: Draft;
  overridden: boolean;
  viewport: Viewport;
  /** False when the page did not hand back a place for this line — its words
   *  can still be rewritten, but there is nothing to hang a rule on. */
  placeable: boolean;
  onChange: (draft: Draft) => void;
  onReset: () => void;
  onRestored: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'text' | 'style'>('text');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const edited = !sameDraft(draft, savedDraft);
  const long = isLong(field.kind);
  const style = draft.style[viewport] ?? {};

  /** Forgets the override, so the field falls back to the wording the site
   *  shipped with. The server is the only place that knows what that is, so
   *  the panel reloads rather than guessing. */
  function restore() {
    setError('');

    startTransition(async () => {
      const result = await resetContentFieldAction({ key: field.key });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onRestored();
    });
  }

  return (
    <aside className="panel inspector" aria-label={`${field.label} settings`}>
      <header className="inspector__head">
        <div>
          <h3 className="inspector__title">{field.label}</h3>
          <p className="inspector__where">
            {page.label} — {page.path}
          </p>
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
        {edited ? <span className="inspector__ratio">Unsaved</span> : null}
      </p>

      <div className="viewtoggle ctabs" role="group" aria-label="What to edit">
        <button
          type="button"
          className={`viewtoggle__btn${tab === 'text' ? ' viewtoggle__btn--on' : ''}`}
          onClick={() => setTab('text')}
          aria-pressed={tab === 'text'}
        >
          Text
        </button>
        <button
          type="button"
          className={`viewtoggle__btn${tab === 'style' ? ' viewtoggle__btn--on' : ''}`}
          onClick={() => setTab('style')}
          aria-pressed={tab === 'style'}
        >
          Style
        </button>
      </div>

      <div className="inspector__body">
        {tab === 'text' ? (
          <label className="adfield">
            Wording
            {long ? (
              <textarea
                value={draft.value}
                onChange={(event) => onChange({ ...draft, value: event.target.value })}
                maxLength={field.maxLength}
                rows={8}
                required
              />
            ) : (
              <input
                value={draft.value}
                onChange={(event) => onChange({ ...draft, value: event.target.value })}
                maxLength={field.maxLength}
                required
              />
            )}
            <small>
              {draft.value.trim().length} / {field.maxLength} —{' '}
              {field.kind === 'button'
                ? 'the label only. Where the button goes is set by the page.'
                : 'plain text. Nothing here is markup.'}
            </small>
          </label>
        ) : placeable ? (
          <StyleControls
            style={style}
            viewport={viewport}
            onChange={(next) =>
              onChange({
                ...draft,
                style: {
                  ...draft.style,
                  [viewport]: Object.keys(next).length ? next : undefined,
                },
              })
            }
          />
        ) : (
          <p className="anotice">
            This line was not found in the page as it rendered — an answer inside a closed question,
            or copy the page only shows in some states. The wording is still yours to change; how it
            is set is not.
          </p>
        )}
      </div>

      <footer className="inspector__foot">
        <button
          type="button"
          className="abtn abtn--quiet abtn--sm"
          onClick={onReset}
          disabled={pending || !edited}
        >
          Reset this line
        </button>

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
      </footer>
    </aside>
  );
}

/* --------------------------------------------------------------------------
   The stage — the storefront itself, in a frame
   -------------------------------------------------------------------------- */

function Stage({
  path,
  viewport,
  version,
  onReady,
  onSelect,
  frame,
}: {
  path: string;
  viewport: Viewport;
  version: number;
  onReady: (keys: string[], selectors: Record<string, string>) => void;
  onSelect: (key: string) => void;
  frame: React.RefObject<HTMLIFrameElement | null>;
}) {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      const data = event.data as {
        channel?: string;
        type?: string;
        keys?: string[];
        selectors?: Record<string, string>;
        key?: string;
      };

      if (data?.channel !== CHANNEL) return;

      if (data.type === 'ready') onReady(data.keys ?? [], data.selectors ?? {});
      if (data.type === 'select' && data.key) onSelect(data.key);
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onReady, onSelect]);

  return (
    <div className={`stage stage--${viewport}`}>
      <iframe
        key={`${path}-${version}`}
        ref={frame}
        className="stage__frame"
        src={`${path}${path.includes('?') ? '&' : '?'}ckedit=1`}
        title="The page as visitors see it"
      />
    </div>
  );
}

/* --------------------------------------------------------------------------
   The tab
   -------------------------------------------------------------------------- */

function Builder({ pages, onRestored }: { pages: ContentPageView[]; onRestored: () => void }) {
  const fields = useMemo(() => allFields(pages), [pages]);
  const byKey = useMemo(() => new Map(fields.map((field) => [field.key, field])), [fields]);

  /* What the storefront is serving right now — the last save, or the shipped
     wording if there has never been one. Everything the admin does lives in
     `drafts` until Save, and Cancel is simply this record copied back. */
  const saved = useMemo<Record<string, Draft>>(
    () =>
      Object.fromEntries(
        fields.map((field) => [field.key, { value: field.value, style: field.style ?? {} }]),
      ),
    [fields],
  );

  const [drafts, setDrafts] = useState<Record<string, Draft>>(saved);
  const [overridden, setOverridden] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.overridden])),
  );

  const [pageId, setPageId] = useState(pages[0]?.id ?? '');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [selected, setSelected] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [selectors, setSelectors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const frame = useRef<HTMLIFrameElement | null>(null);

  const page = pages.find((candidate) => candidate.id === pageId) ?? pages[0];
  const field = selected ? byKey.get(selected) : undefined;
  const here = useMemo(() => (page ? pageFields(page) : []), [page]);

  const dirty = here.filter((candidate) => !sameDraft(drafts[candidate.key], saved[candidate.key]));

  /** Hands the frame everything it needs to draw itself as it would be if
   *  Save were pressed. Sent on every change, which is what makes the preview
   *  immediate — and sent to the page, never to the database. */
  const push = useCallback(() => {
    const window_ = frame.current?.contentWindow;
    if (!window_) return;

    const payload: Record<string, Draft> = {};
    for (const candidate of here) payload[candidate.key] = drafts[candidate.key];

    window_.postMessage({ channel: CHANNEL, type: 'apply', drafts: payload }, location.origin);
  }, [drafts, here]);

  useEffect(() => {
    push();
  }, [push]);

  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { channel: CHANNEL, type: 'select', key: selected },
      location.origin,
    );
  }, [selected]);

  const onReady = useCallback(
    (keys: string[], next: Record<string, string>) => {
      setFound(keys);
      setSelectors((current) => ({ ...current, ...next }));
      push();
    },
    [push],
  );

  function choosePage(next: string) {
    setPageId(next);
    setSelected(null);
    setFound([]);
    setMessage('');
  }

  function edit(key: string, draft: Draft) {
    setMessage('');
    setDrafts((current) => ({ ...current, [key]: draft }));
  }

  /** Everything changed on this page, in one write. Nothing before now has
   *  touched the storefront. */
  function save() {
    setError('');
    setMessage('');

    const entries = dirty.map((candidate) => ({
      key: candidate.key,
      value: drafts[candidate.key].value,
      style: drafts[candidate.key].style,
      selector: selectors[candidate.key] ?? candidate.selector,
    }));

    startTransition(async () => {
      const result = await saveContentPageAction({ entries });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOverridden((current) => {
        const next = { ...current };
        for (const entry of entries) next[entry.key] = true;
        return next;
      });

      setMessage('Saved. The storefront is serving this now.');
      onRestored();
    });
  }

  /** Throws the session away and puts the frame back to what is live. */
  function cancel() {
    setError('');
    setMessage('');
    setDrafts(saved);
    setVersion((current) => current + 1);
  }

  return (
    <div className="contentbuild">
      <header className="contentbuild__bar">
        <label className="adfield adfield--inline contentbuild__page">
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

        <div className="contentbuild__acts">
          <button
            type="button"
            className="abtn abtn--sm"
            onClick={save}
            disabled={pending || !dirty.length}
          >
            {pending ? 'Saving…' : `Save${dirty.length ? ` (${dirty.length})` : ''}`}
          </button>

          <button
            type="button"
            className="abtn abtn--quiet abtn--sm"
            onClick={cancel}
            disabled={pending || !dirty.length}
          >
            Cancel
          </button>
        </div>

        <p className="contentbuild__hint">
          Click any line on the page to edit what it says and how it is set. Nothing reaches the
          shop until Save.
        </p>

        {error ? <p className="anotice anotice--error">{error}</p> : null}
        {!error && message ? <p className="anotice">{message}</p> : null}
      </header>

      <div className={`contentbuild__stage${field ? ' contentbuild__stage--open' : ''}`}>
        {page ? (
          <Stage
            path={page.path}
            viewport={viewport}
            version={version}
            frame={frame}
            onReady={onReady}
            onSelect={setSelected}
          />
        ) : null}

        {field && page ? (
          <Inspector
            key={field.key}
            field={field}
            page={page}
            draft={drafts[field.key]}
            savedDraft={saved[field.key]}
            overridden={overridden[field.key] ?? false}
            viewport={viewport}
            placeable={found.includes(field.key) || Boolean(selectors[field.key])}
            onChange={(draft) => edit(field.key, draft)}
            onReset={() => edit(field.key, saved[field.key])}
            onRestored={onRestored}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </div>

      {/* Anything the page did not hand back — an answer inside a closed
          question, a line that only appears in some states — is still reachable
          here, so no field on the page is unreachable because of how it renders. */}
      {here.length ? (
        <footer className="contentbuild__index">
          <h4 className="contentbuild__indexhead">Every line on this page</h4>
          <div className="contentbuild__chips">
            {here.map((candidate) => (
              <button
                key={candidate.key}
                type="button"
                className={`ckchip${selected === candidate.key ? ' ckchip--on' : ''}${
                  sameDraft(drafts[candidate.key], saved[candidate.key]) ? '' : ' ckchip--edited'
                }`}
                onClick={() => setSelected(candidate.key)}
              >
                {candidate.label}
              </button>
            ))}
          </div>
        </footer>
      ) : null}
    </div>
  );
}

/**
 * The storefront's writing, edited on the page it appears on.
 *
 * The preview is not a drawing of the page — it is the page, in a frame,
 * rendered by the same components and the same stylesheets a visitor gets. The
 * panel talks to it over `postMessage`: the page reports what was clicked, and
 * the panel sends back the drafts it is holding, so a size or a colour is on
 * screen the moment it changes and nowhere else until Save.
 *
 * A save or a restore both change what the server would send, so both refresh
 * and remount the builder: the drafts start again from what came back.
 */
export function ContentManager({ pages }: { pages: ContentPageView[] }) {
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
