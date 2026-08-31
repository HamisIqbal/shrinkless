'use client';

import { useCallback, useRef, useState } from 'react';
import { imageUrl } from '@/lib/images';
import {
  CENTRE,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  cropStyle,
  focusToPair,
  normaliseZoom,
  pairToFocus,
  ratioValue,
  type Crop,
  type Ratio,
  type ViewRatios,
} from '@/lib/media/crop';

type Props = {
  url: string;
  alt: string;
  crop: Crop;
  /** The two shapes this photograph is actually seen in. The desktop one is
   *  the stage's own shape, so the holder is the frame being filled. */
  ratios: ViewRatios;
  onChange: (crop: Crop) => void;
};

/** How much one arrow key press moves the photograph, as a fraction of the
 *  overflow. Small enough to place a face, large enough to cross the frame. */
const NUDGE = 0.02;

/** What the stage asks Cloudinary for. A scale, never a crop: the whole
 *  photograph has to be here for there to be anything to drag. Ignored for the
 *  `https://` frames, which `imageUrl` passes through untouched. */
const STAGE = 'w_1200,q_auto,f_auto';

/* --------------------------------------------------------------------------
   One rendered frame — the stage and both previews are this
   -------------------------------------------------------------------------- */

function CropFrame({
  url,
  alt,
  crop,
  ratio,
}: {
  url: string;
  alt: string;
  crop: Crop;
  ratio: Ratio;
}) {
  return (
    <div className="cropframe" style={{ aspectRatio: ratioValue(ratio) }}>
      {/* Not next/image: the source changes as the admin types or uploads, and
          this is a rehearsal of a crop rather than a rendered page. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl(url, STAGE)} alt={alt} style={cropStyle(crop)} draggable={false} />
    </div>
  );
}

/* --------------------------------------------------------------------------
   The field
   -------------------------------------------------------------------------- */

/**
 * A fixed-ratio holder the admin drags the photograph inside, and the two
 * views it will be seen in.
 *
 * The stage is the slot's desktop shape at the slot's own aspect ratio, so
 * what is inside the holder is what the storefront renders — the previews use
 * the identical style helper, only at a different shape. Nothing is cut from
 * the file: dragging writes an `object-position`, the slider writes a scale,
 * and both are stored with the image. See `lib/media/crop.ts` for why the two
 * agree geometrically.
 */
export function ImageCropField({ url, alt, crop, ratios, onChange }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const focus = crop.focus || CENTRE;
  const zoom = normaliseZoom(crop.zoom);

  /**
   * How far the photograph can travel inside the frame, in pixels, per axis.
   *
   * `cover` scales the source until it covers the frame; the zoom scales it
   * again. What is left over on each axis is the whole range a drag has to
   * work with — and dividing by it is what makes the photograph keep pace
   * with the pointer instead of sliding faster or slower than it.
   */
  const overflow = useCallback((): [number, number] => {
    const frame = stage.current?.getBoundingClientRect();
    const img = image.current;

    if (!frame || !img?.naturalWidth || !img.naturalHeight) return [0, 0];

    const cover = Math.max(frame.width / img.naturalWidth, frame.height / img.naturalHeight);

    return [
      img.naturalWidth * cover * zoom - frame.width,
      img.naturalHeight * cover * zoom - frame.height,
    ];
  }, [zoom]);

  const nudge = useCallback(
    (dx: number, dy: number) => {
      const [overflowX, overflowY] = overflow();
      const [x, y] = focusToPair(focus);

      onChange({
        focus: pairToFocus(
          overflowX > 0 ? x - dx / overflowX : x,
          overflowY > 0 ? y - dy / overflowY : y,
        ),
        zoom,
      });
    },
    [focus, onChange, overflow, zoom],
  );

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!url) return;

    drag.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;

    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;

    // Only bank the movement that was actually applied, so a drag against a
    // stop does not accumulate a debt that has to be dragged back out.
    drag.current = { x: event.clientX, y: event.clientY };
    nudge(dx, dy);
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;

    drag.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const [overflowX, overflowY] = overflow();

    const step: Record<string, [number, number]> = {
      ArrowLeft: [overflowX * NUDGE, 0],
      ArrowRight: [-overflowX * NUDGE, 0],
      ArrowUp: [0, overflowY * NUDGE],
      ArrowDown: [0, -overflowY * NUDGE],
    };

    const move = step[event.key];
    if (!move) return;

    event.preventDefault();
    nudge(move[0], move[1]);
  }

  if (!url) {
    return (
      <div className="cropfield cropfield--empty">
        <div className="cropframe" style={{ aspectRatio: ratioValue(ratios.desktop) }}>
          <span className="cropframe__empty">No image yet</span>
        </div>
        <p className="cropfield__note">
          Add a photograph and the crop holder appears here, in the shape this
          frame is actually seen in.
        </p>
      </div>
    );
  }

  return (
    <div className="cropfield">
      <div className="cropfield__head">
        <span className="cropfield__label">
          Crop · {ratios.desktop.w}:{ratios.desktop.h}
        </span>
        <span className="cropfield__hint">Drag the photograph. Arrow keys nudge it.</span>
      </div>

      <div
        ref={stage}
        className={`cropstage${dragging ? ' cropstage--drag' : ''}`}
        style={{ aspectRatio: ratioValue(ratios.desktop) }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="group"
        aria-label="Crop. Drag the photograph, or use the arrow keys, to choose what the frame keeps."
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={image}
          src={imageUrl(url, STAGE)}
          alt=""
          style={cropStyle({ focus, zoom })}
          draggable={false}
        />

        {/* Thirds. The holder is the frame, so the guides are for placing a
            subject inside it, not for showing where it ends. */}
        <span className="cropstage__guides" aria-hidden="true" />
      </div>

      <div className="cropfield__controls">
        <label className="cropfield__zoom">
          <span>Zoom</span>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(event) => onChange({ focus, zoom: Number(event.target.value) })}
          />
          <span className="cropfield__zoomvalue">{zoom.toFixed(2)}×</span>
        </label>

        <button
          type="button"
          className="abtn abtn--quiet abtn--sm"
          onClick={() => onChange({ focus: CENTRE, zoom: ZOOM_MIN })}
          disabled={focus === CENTRE && zoom === ZOOM_MIN}
        >
          Reset crop
        </button>
      </div>

      <div className="cropviews">
        <figure className="cropviews__view cropviews__view--desktop">
          <CropFrame url={url} alt={alt} crop={{ focus, zoom }} ratio={ratios.desktop} />
          <figcaption>
            Desktop · {ratios.desktop.w}:{ratios.desktop.h}
          </figcaption>
        </figure>

        <figure className="cropviews__view cropviews__view--mobile">
          <CropFrame url={url} alt={alt} crop={{ focus, zoom }} ratio={ratios.mobile} />
          <figcaption>
            Mobile · {ratios.mobile.w}:{ratios.mobile.h}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
