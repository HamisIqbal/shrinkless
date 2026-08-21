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

  return (
    <fieldset>
      <legend>Images</legend>

      <ul>
        {images.map((image, index) => (
          <li key={image.publicId}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryUrl(image.publicId, 'w_120,h_150,c_fill')}
              alt={image.alt}
              width={120}
              height={150}
            />
            <label>Alt text
              <input
                value={image.alt}
                onChange={(event) => onChange(images.map((current, i) =>
                  i === index ? { ...current, alt: event.target.value } : current,
                ))}
              />
            </label>
            <button type="button" onClick={() => onChange(images.filter((_, i) => i !== index))}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <label>Add image
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

      {busy ? <p>Uploading…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </fieldset>
  );
}
