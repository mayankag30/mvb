'use client';

import { useRef, useState } from 'react';
import type { MediaKind } from '@/lib/data/types';

export type DraftMedia = {
  public_id: string;
  url: string;
  kind: MediaKind;
  is_cover: boolean;
  /** local blob preview while the upload is in flight */
  preview?: string;
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 40 * 1024 * 1024;

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  error?: string;
};

/**
 * Uploads straight from the browser to Cloudinary using a short-lived signed
 * payload from /api/cloudinary-sign — the API secret never reaches the
 * client, and the file itself never has to round-trip through our server.
 */
async function uploadToCloudinary(file: File): Promise<{ public_id: string; url: string }> {
  const signRes = await fetch('/api/cloudinary-sign', { method: 'POST' });
  const sign: SignResponse = await signRes.json();
  if (!signRes.ok) {
    throw new Error(sign.error ?? 'Could not get an upload signature.');
  }

  const isVideo = file.type === 'video/mp4';
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sign.apiKey);
  form.append('timestamp', String(sign.timestamp));
  form.append('signature', sign.signature);
  form.append('folder', sign.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/${isVideo ? 'video' : 'image'}/upload`,
    { method: 'POST', body: form },
  );
  const uploaded = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(uploaded.error?.message ?? 'Upload to Cloudinary failed.');
  }

  return { public_id: uploaded.public_id, url: uploaded.secure_url };
}

/**
 * Interface unchanged from Phase 1 — only the upload implementation moved
 * from a mock placeholder to a real signed Cloudinary upload.
 */
export default function MediaUploader({
  initial,
  onBusyChange,
}: {
  initial: DraftMedia[];
  /** lets the parent form disable Save while an upload is still in flight */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [media, setMedia] = useState<DraftMedia[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusyState] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setBusy = (value: boolean) => {
    setBusyState(value);
    onBusyChange?.(value);
  };

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);

    const added: DraftMedia[] = [];
    for (const file of Array.from(files)) {
      const isImage = IMAGE_TYPES.includes(file.type);
      const isVideo = file.type === 'video/mp4';

      if (!isImage && !isVideo) {
        setError('Images must be JPEG, PNG or WebP. Video must be MP4.');
        continue;
      }
      if (isImage && file.size > MAX_IMAGE) {
        setError(`${file.name} is over the 5 MB image limit.`);
        continue;
      }
      if (isVideo && file.size > MAX_VIDEO) {
        setError(`${file.name} is over the 40 MB video limit.`);
        continue;
      }

      const kind: MediaKind = isImage ? 'image' : 'video';
      try {
        const uploaded = await uploadToCloudinary(file);
        added.push({
          ...uploaded,
          kind,
          is_cover: false,
          preview: URL.createObjectURL(file),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed.');
      }
    }

    setMedia((prev) => {
      const next = [...prev, ...added];
      // first image becomes the cover if none is set
      if (!next.some((m) => m.is_cover)) {
        const firstImage = next.find((m) => m.kind === 'image');
        if (firstImage) firstImage.is_cover = true;
      }
      return next;
    });
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  const setCover = (publicId: string) =>
    setMedia((prev) =>
      prev.map((m) => ({ ...m, is_cover: m.public_id === publicId })),
    );

  const remove = (publicId: string) =>
    setMedia((prev) => prev.filter((m) => m.public_id !== publicId));

  return (
    <div>
      <label className="sr-only" htmlFor="media-input">
        Photos and video
      </label>

      <div className="drop">
        <input
          ref={inputRef}
          id="media-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          multiple
          onChange={(e) => onPick(e.target.files)}
          disabled={busy}
        />
        <p style={{ margin: '10px 0 0', fontSize: 12 }}>
          JPG or PNG · first photo becomes the cover · MP4 up to 30 seconds
        </p>
      </div>

      {error && <p className="note" style={{ color: '#9B1F45' }}>{error}</p>}
      {busy && <p className="note">Uploading…</p>}

      {media.length > 0 && (
        <div className="chips" style={{ marginTop: 12 }}>
          {media.map((m) => (
            <div key={m.public_id} style={{ border: '1px solid var(--line)', borderRadius: 3, overflow: 'hidden', width: 96 }}>
              {m.kind === 'image' ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={m.preview ?? m.url} alt="" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
              ) : (
                <video src={m.preview ?? m.url} muted playsInline style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, padding: '5px 7px', fontSize: 11, borderTop: '1px solid var(--line)' }}>
                {m.is_cover ? (
                  <span style={{ color: '#1B6B3E' }}>Cover</span>
                ) : (
                  <button className="lk" type="button" onClick={() => setCover(m.public_id)}>
                    Set cover
                  </button>
                )}
                <button className="lk del" type="button" onClick={() => remove(m.public_id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        type="hidden"
        name="media_json"
        value={JSON.stringify(
          media.map(({ public_id, url, kind, is_cover }) => ({
            public_id,
            url,
            kind,
            is_cover,
          })),
        )}
      />
    </div>
  );
}
