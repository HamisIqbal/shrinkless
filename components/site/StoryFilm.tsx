'use client';

import { useRef, type ReactNode, type SyntheticEvent } from 'react';

/**
 * The Our Story film. The frame is sized from the video's own proportions —
 * measured once the metadata arrives — so the whole picture is visible at any
 * width without cropping, letterboxing or a single-axis stretch. The overlay
 * copy can then sit exactly on the picture rather than on a padded box.
 *
 * `--film-ar` starts at a landscape guess and is corrected in place; nothing
 * about the rendered markup depends on it, so there is nothing to hydrate.
 */
export function StoryFilm({ src, label, children }: { src: string; label: string; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);

  function measure(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    if (!video.videoWidth || !video.videoHeight) return;
    stage.current?.style.setProperty('--film-ar', String(video.videoWidth / video.videoHeight));
  }

  return (
    <div className="storyfilm__stage" ref={stage}>
      <div className="storyfilm__media">
        <video
          className="storyfilm__video"
          src={src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label={label}
          onLoadedMetadata={measure}
        />
        {children}
      </div>
    </div>
  );
}
