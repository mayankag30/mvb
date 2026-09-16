'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { updateShopSettings } from '@/lib/data';
import { requireStaff } from '@/lib/data/session';

const schema = z.object({
  name: z.string().trim().min(1, 'Shop name is required').max(120),
  address: z.string().trim().min(1, 'Address is required').max(400),
  whatsapp: z
    .string()
    .trim()
    .min(8, 'WhatsApp number looks too short')
    .max(20)
    .regex(/^[+\d][\d\s-]{7,19}$/, 'Digits, spaces and a leading + only'),
  phone: z.string().trim().max(20).optional(),
  email: z
    .string()
    .trim()
    .email('That email does not look right')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  hours: z.string().trim().max(200).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type ShopState = { error?: string; ok?: boolean };

export async function updateShopAction(
  _prev: ShopState | null,
  formData: FormData,
): Promise<ShopState> {
  await requireStaff();

  const parsed = schema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    whatsapp: formData.get('whatsapp'),
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    hours: formData.get('hours') || undefined,
    lat: formData.get('lat'),
    lng: formData.get('lng'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await updateShopSettings({
    ...parsed.data,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    hours: parsed.data.hours ?? null,
  });

  revalidatePath('/admin/shop');
  revalidatePath('/');
  return { ok: true };
}
