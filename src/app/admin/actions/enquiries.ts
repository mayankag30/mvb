'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { deleteEnquiryNote, updateEnquiryStatus } from '@/lib/data';
import { ENQUIRY_STATUSES } from '@/lib/data/types';
import { requireStaff } from '@/lib/data/session';

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(ENQUIRY_STATUSES),
  note: z.string().trim().max(1000).optional(),
});

export type StatusState = { error?: string; ok?: boolean };

export async function updateStatusAction(
  _prev: StatusState | null,
  formData: FormData,
): Promise<StatusState> {
  const session = await requireStaff();

  const parsed = schema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    note: formData.get('note') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await updateEnquiryStatus(
    parsed.data.id,
    parsed.data.status,
    parsed.data.note ?? null,
    session.user.id,
  );

  revalidatePath('/admin/enquiries');
  revalidatePath('/admin');
  return { ok: true };
}

/** Removes a note's comment. The status transition it recorded is kept. */
export async function deleteNoteAction(formData: FormData) {
  await requireStaff();
  const id = formData.get('noteId');
  if (typeof id !== 'string' || !id) return;

  await deleteEnquiryNote(id);
  revalidatePath('/admin/enquiries');
}
