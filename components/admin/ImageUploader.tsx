'use client';

import { useState } from 'react';
import { createUploadSignatureAction } from '@/app/actions/admin/products';
import { uploadEndpoint } from '@/lib/cloudinary/config';
import { cloudinaryUrl } from '@/lib/cloudinary/url';
import type { ImageDTO } from '@/types/dto';

type Props = {
  images: ImageDTO[];
  onChange: (images: ImageDTO[]) => void;
};

export function ImageUploader({ images, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setBusy(true);
    setError('');

    try {
      const signed = await createUploadSignatureAction();
      if (!signed.ok) throw new Error(signed.error);

      const body = new FormData();
      body.set('file', file);
      body.set('api_key', signed.apiKey);
      body.set('timestamp', String(signed.timestamp));
      body.set('folder', signed.folder);
      body.set('signature', signed.signature);

      const response = await fetch(uploadEndpoint(signed.cloudName), { method: 'POST', body });
      if (!response.ok) throw new Error('Cloudinary rejected the upload.');

      const uploaded = (await response.json()) as {
        public_id: string; width: number; height: number;
      };

      onChange([
        ...images,
        { publicId: uploaded.public_id, width: uploaded.width, height: uploaded.height, alt: '' },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  /** Order is meaning here: position one is the featured image everywhere in
   *  the store, so moving an image is how that choice is made. */
  function move(index: number, by: number) {
    const target = index + by;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="uploader">
      {images.length ? (
        <ul className="uploader__grid">
          {images.map((image, index) => (
            <li key={image.publicId}>
              <div className="uploader__item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cloudinaryUrl(image.publicId, 'w_320,h_400,c_fill,q_auto,f_auto')}
                  alt={image.alt}
                  width={160}
                  height={200}
                />

                {index === 0 ? <span className="uploader__badge">Featured</span> : null}

                <div className="uploader__tools">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move image earlier"
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label="Move image later"
                  >
                    &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(images.filter((_, i) => i !== index))}
                    aria-label="Remove image"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <label className="field" style={{ marginTop: '0.5rem' }}>
                <span className="visually-hidden">Alt text</span>
                <input
                  value={image.alt}
                  placeholder="Alt text"
                  onChange={(event) =>
                    onChange(
                      images.map((current, i) =>
                        i === index ? { ...current, alt: event.target.value } : current,
                      ),
                    )
                  }
                />
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="aquiet" style={{ marginBottom: 'var(--ad-s-3)' }}>
          No photography yet. The first image you add becomes the featured one.
        </p>
      )}

      <label className="field">
        Add image
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = '';
          }}
        />
      </label>

      {busy ? <p className="anotice">Uploading</p> : null}
      {error ? <p role="alert" className="anotice anotice--error">{error}</p> : null}
    </div>
  );
}
