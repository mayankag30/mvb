'use server';

import { z } from 'zod';
import { uploadMedia } from '@/lib/data';
import { requireStaff } from '@/lib/data/session';

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  kind: z.enum(['image', 'video']),
});

/**
 * Phase 1: returns a placeholder URL. Phase 2: the client gets a signature from
 * /api/cloudinary-sign and uploads directly, then reports public_id here.
 */
export async function uploadMediaAction(input: {
  name: string;
  kind: 'image' | 'video';
}): Promise<{ public_id: string; url: string }> {
  await requireStaff();
  const parsed = schema.parse(input);
  return uploadMedia(parsed);
}
