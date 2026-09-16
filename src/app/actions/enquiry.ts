'use server';

import { z } from 'zod';
import { createEnquiry } from '@/lib/data';
import { verifyTurnstile } from '@/lib/turnstile';

// Mirrors the CHECK constraints in 0001_init.sql.
const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z
    .string()
    .trim()
    .email('That email does not look right')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  whatsapp: z
    .string()
    .trim()
    .min(8, 'Please enter a valid WhatsApp number')
    .max(20)
    .regex(/^[+\d][\d\s-]{7,19}$/, 'Digits, spaces and a leading + only'),
  interest: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  message: z
    .string()
    .trim()
    .max(1000, 'Please keep it under 1000 characters')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  item_id: z
    .string()
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type EnquiryState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitEnquiry(
  _prev: EnquiryState | null,
  formData: FormData,
): Promise<EnquiryState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    whatsapp: formData.get('whatsapp'),
    interest: formData.get('interest'),
    message: formData.get('message'),
    item_id: formData.get('item_id'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: 'Please check the highlighted fields.', fieldErrors };
  }

  const token = formData.get('cf-turnstile-response');
  const human = await verifyTurnstile(typeof token === 'string' ? token : null);
  if (!human) {
    return { ok: false, error: 'Could not verify that you are human. Please retry.' };
  }

  // status and id are never read from the form
  try {
    await createEnquiry({
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      whatsapp: parsed.data.whatsapp,
      interest: parsed.data.interest ?? null,
      message: parsed.data.message ?? null,
      item_id: parsed.data.item_id ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Something went wrong.';
    return { ok: false, error: msg };
  }

  return { ok: true };
}
