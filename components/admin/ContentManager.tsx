'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  resetContentFieldAction,
  saveContentFieldAction,
} from '@/app/actions/admin/content';
import type {
  ContentFieldView,
  ContentKind,
  ContentPageView,
  ContentSectionView,
} from '@/lib/services/site-content';

type Viewport = 'desktop' | 'mobile';

/** Every field on every page, once each — the state below is keyed by field,
 *  so a page listed twice would still be one record. */
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

/** Which kinds are written in a box rather than on a line. A heading that
 *  wraps is still a heading; a paragraph typed into a single-line input is a
 *  paragraph nobody can read while writing it. */
function isLong(kind: ContentKind): boolean {
  return kind === 'body' || kind === 'answer' || kind === 'lede';
}

/* --------------------------------------------------------------------------
   One line of type on the canvas
   -------------------------------------------------------------------------- */

/**
 * A field as the page sets it — at the weight and scale the storefront gives
 * that kind of writing, and clickable.
 *
 * The text itself is the hit area. A pencil in the margin would be a smaller
 * target than the sentence it edits, and the sentence is the thing being
 * talked about.
 */
function CanvasText({
  field,
  value,
  selected,
  edited,
  onSelect,
}: {
  field: ContentFieldView;
  value: string;
  selected: boolean;
  edited: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`ctext ctext--${field.kind}${selected ? ' ctext--on' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Edit ${field.label}`}
    >
      <span className="ctext__value">{value || 'Empty'}</span>

      <span className="ctext__tag" aria-hidden="true">
        {field.label}
        {edited ? <em className="ctext__dot" /> : null}
      </span>
    </button>
  );
}

/* --------------------------------------------------------------------------
   The page canvas
   -------------------------------------------------------------------------- */

/** The section's fields, split into the clusters the page draws side by side.
 *  Ungrouped fields come first and run the full width — they are the
 *  section's own heading, not part of any tile. */
function clusters(section: ContentSectionView): {
  lead: ContentFieldView[];
  groups: ContentFieldView[][];
} {
  const lead: ContentFieldView[] = [];
  const groups = new Map<string, ContentFieldView[]>();

  for (const field of section.fields) {
    if (!field.group) {
      lead.push(field);
      continue;
    }

    const existing = groups.get(field.group);
    if (existing) existing.push(field);
    else groups.set(field.group, [field]);
  }

  return { lead, groups: [...groups.values()] };
}

function Canvas({
  page,
  viewport,
  drafts,
  saved,
  selected,
  onSelect,
}: {
  page: ContentPageView;
  viewport: Viewport;
  drafts: Record<string, string>;
  saved: Record<string, string>;
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className={`canvas canvas--${viewport}`}>
      <div className="canvas__device">
        {page.sections.map((section) => {
          const { lead, groups } = clusters(section);

          const render = (field: ContentFieldView) => (
            <CanvasText
              key={field.key}
              field={field}
              value={drafts[field.key] ?? field.value}
              selected={selected === field.key}
              edited={(drafts[field.key] ?? '') !== (saved[field.key] ?? '')}
              onSelect={() => onSelect(field.key)}
            />
          );

          return (
            <section
              key={section.id}
              className={`contentrow contentrow--${section.tone}`}
            >
              <header className="canvasrow__head">
                <h3 className="canvasrow__title">{section.label}</h3>
                <p className="canvasrow__note">{section.note}</p>
              </header>

              <div className="contentrow__page">
                {lead.length ? <div className="contentrow__lead">{lead.map(render)}</div> : null}

                {groups.length ? (
                  <div
                    className="contentrow__groups"
                    style={
                      section.columns && viewport === 'desktop'
                        ? {
                            gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))`,
                          }
                        : undefined
                    }
                  >
                    {groups.map((group) => (
                      <div key={group[0].key} className="contentrow__group">
                        {group.map(render)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The contextual panel
   -------------------------------------------------------------------------- */

function Inspector({
  field,
  page,
  value,
  savedValue,
  overridden,
  onChange,
  onSaved,
  onRestored,
  onClose,
}: {
  field: ContentFieldView;
  page: ContentPageView;
  value: string;
  savedValue: string;
  overridden: boolean;
  onChange: (value: string) => void;
  onSaved: (value: string) => void;
  onRestored: () => void;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const edited = value !== savedValue;
  const long = isLong(field.kind);

  function save() {
    setError('');
    setMessage('');

    startTransition(async () => {
      const result = await saveContentFieldAction({ key: field.key, value });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onSaved(value.trim());
      setMessage('Saved. The storefront is updated.');
    });
  }

  /** Undoes the edit in front of you. Nothing is sent, and nothing already
   *  saved is touched. */
  function undo() {
    setError('');
    onChange(savedValue);
    setMessage('Changes undone. Back to the saved wording.');
  }

  /** Forgets the override, so the field falls back to the wording the site
   *  shipped with. The server is the only place that knows what that is, so
   *  the panel reloads rather than guessing. */
  function restore() {
    setError('');
    setMessage('');

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
    <aside className="panel inspector" aria-label={`${field.label} wording`}>
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
        <span className="inspector__ratio">
          {value.trim().length} / {field.maxLength}
        </span>
      </p>

      <div className="inspector__body">
        <label className="adfield">
          Wording
          {long ? (
            <textarea
              value={value}
              onChange={(event) => {
                setMessage('');
                onChange(event.target.value);
              }}
              maxLength={field.maxLength}
              rows={8}
              required
            />
          ) : (
            <input
              value={value}
              onChange={(event) => {
                setMessage('');
                onChange(event.target.value);
              }}
              maxLength={field.maxLength}
              required
            />
          )}
          <small>
            {field.kind === 'button'
              ? 'The label only. Where the button goes is set by the page.'
              : 'Plain text. The page supplies the typography.'}
          </small>
        </label>
      </div>

      <footer className="inspector__foot">
        <button
          type="button"
          className="abtn abtn--sm"
          onClick={save}
          disabled={pending || !value.trim() || !edited}
        >
          {pending ? 'Saving…' : 'Save'}
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

function Builder({ pages, onRestored }: { pages: ContentPageView[]; onRestored: () => void }) {
  const fields = useMemo(() => allFields(pages), [pages]);
  const byKey = useMemo(
    () => new Map(fields.map((field) => [field.key, field])),
    [fields],
  );

  /* What the storefront is serving right now — the last save, or the shipped
     wording if there has never been one. `Reset changes` returns to this and
     no further: it undoes the edit in front of you, it does not throw away
     work that is already live. */
  const [saved, setSaved] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.value])),
  );
  const [drafts, setDrafts] = useState<Record<string, string>>(saved);
  const [overridden, setOverridden] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.overridden])),
  );

  const [pageId, setPageId] = useState(pages[0]?.id ?? '');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [selected, setSelected] = useState<string | null>(null);

  const page = pages.find((candidate) => candidate.id === pageId) ?? pages[0];
  const field = selected ? byKey.get(selected) : undefined;

  function choosePage(next: string) {
    setPageId(next);
    setSelected(null);
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

        <p className="contentbuild__hint">
          Click a line to rewrite it. The storefront sets the same words at both
          widths, so the toggle changes how the page stacks, not what it says.
        </p>
      </header>

      <div className={`contentbuild__stage${field ? ' contentbuild__stage--open' : ''}`}>
        {page ? (
          <Canvas
            page={page}
            viewport={viewport}
            drafts={drafts}
            saved={saved}
            selected={selected}
            onSelect={setSelected}
          />
        ) : null}

        {field && page ? (
          <Inspector
            key={field.key}
            field={field}
            page={page}
            value={drafts[field.key] ?? field.value}
            savedValue={saved[field.key] ?? field.value}
            overridden={overridden[field.key] ?? false}
            onChange={(value) => setDrafts((current) => ({ ...current, [field.key]: value }))}
            onSaved={(value) => {
              setDrafts((current) => ({ ...current, [field.key]: value }));
              setSaved((current) => ({ ...current, [field.key]: value }));
              setOverridden((current) => ({ ...current, [field.key]: true }));
            }}
            onRestored={onRestored}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * The storefront's writing, edited on the page it appears on.
 *
 * A restore deletes the override, and only the server knows what the site
 * shipped with — so that one action refreshes and remounts the builder, and
 * the drafts start again from what came back. Saving does not: the panel
 * already knows what it just wrote, and remounting there would close the line
 * the admin is still working on.
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
