import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/data/session';

/**
 * Returns a signed Cloudinary upload payload so the browser can upload
 * directly to Cloudinary without exposing the API secret.
 *
 * Phase 1: returns 503 when credentials are absent — the MediaUploader
 * falls back to the mock uploadMedia() which returns a placeholder URL.
 *
 * Phase 2 (when CLOUDINARY_* env vars are set):
 *   1. Staff session is verified server-side (requireStaff)
 *   2. A timestamp + signature are computed with CLOUDINARY_API_SECRET
 *   3. Browser uploads directly to Cloudinary with the signed params
 *   4. Cloudinary returns public_id + secure_url which are saved on the item
 *
 * Only signed uploads are accepted — the unsigned preset must not exist.
 * SPEC.md §7.
 */
export async function POST(request: Request) {
  await requireStaff();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Cloudinary credentials not configured (Phase 2, SPEC.md §7).' },
      { status: 503 },
    );
  }

  const { folder = 'mvb' } = await request.json().catch(() => ({}));

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

  // Dynamic import keeps the crypto dep out of the client bundle
  const { createHash } = await import('crypto');
  const signature = createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder });
}
