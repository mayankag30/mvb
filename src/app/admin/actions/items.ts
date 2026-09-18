'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  createItem,
  deleteItem,
  setItemVisibility,
  updateItem,
} from '@/lib/data';
import { requireEditor } from '@/lib/data/session';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a 6-digit hex colour');

const itemSchema = z.object({
  collection_id: z.string().min(1, 'Pick a collection'),
  name: z.string().trim().min(1, 'Name is required').max(120),
  brand: z.string().trim().max(80).optional(),
  base_price: z.coerce.number().min(0, 'Price cannot be negative'),
  base_color: hex,
  badge: z.string().trim().max(24).optional(),
  description: z.string().trim().max(2000).optional(),
  is_visible: z.boolean(),
  display_order: z.coerce.number().int().min(0),
  stock_qty: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  low_stock_at: z.coerce.number().int().min(0, 'Threshold cannot be negative'),
});

export type ItemFormState = { error?: string };

function parseColors(formData: FormData) {
  const names = formData.getAll('color_name').map(String);
  const hexes = formData.getAll('color_hex').map(String);
  return names
    .map((name, i) => ({
      name: name.trim(),
      hex: (hexes[i] ?? '').trim(),
      display_order: i + 1,
    }))
    .filter((c) => c.name && /^#[0-9A-Fa-f]{6}$/.test(c.hex));
}

function parseMedia(formData: FormData) {
  const raw = formData.get('media_json');
  if (typeof raw !== 'string' || !raw) return [];
  const shape = z.array(
    z.object({
      public_id: z.string(),
      url: z.string(),
      kind: z.enum(['image', 'video']),
      is_cover: z.boolean(),
    }),
  );
  const parsed = shape.safeParse(JSON.parse(raw));
  if (!parsed.success) return [];

  let coverSeen = false;
  return parsed.data.map((m, i) => {
    // the unique index allows at most one cover per item
    const is_cover = m.is_cover && !coverSeen;
    if (is_cover) coverSeen = true;
    return { ...m, is_cover, display_order: i + 1 };
  });
}

function readForm(formData: FormData) {
  return itemSchema.safeParse({
    collection_id: formData.get('collection_id'),
    name: formData.get('name'),
    brand: formData.get('brand') || undefined,
    base_price: formData.get('base_price'),
    base_color: formData.get('base_color'),
    badge: formData.get('badge') || undefined,
    description: formData.get('description') || undefined,
    is_visible: formData.get('is_visible') === 'on',
    display_order: formData.get('display_order') || 0,
    stock_qty: formData.get('stock_qty') || 0,
    low_stock_at: formData.get('low_stock_at') || 3,
  });
}

export async function createItemAction(
  _prev: ItemFormState | null,
  formData: FormData,
): Promise<ItemFormState> {
  await requireEditor();

  const parsed = readForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await createItem({
    ...parsed.data,
    brand: parsed.data.brand ?? null,
    badge: parsed.data.badge ?? null,
    description: parsed.data.description ?? null,
    colors: parseColors(formData),
    media: parseMedia(formData),
  });

  revalidatePath('/admin/inventory');
  revalidatePath('/');
  redirect('/admin/inventory');
}

export async function updateItemAction(
  _prev: ItemFormState | null,
  formData: FormData,
): Promise<ItemFormState> {
  await requireEditor();

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { error: 'Missing item id' };

  const parsed = readForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await updateItem(id, {
    ...parsed.data,
    brand: parsed.data.brand ?? null,
    badge: parsed.data.badge ?? null,
    description: parsed.data.description ?? null,
    colors: parseColors(formData),
    media: parseMedia(formData),
  });

  revalidatePath('/admin/inventory');
  revalidatePath('/');
  redirect('/admin/inventory');
}

export async function toggleVisibilityAction(formData: FormData) {
  await requireEditor();
  const id = formData.get('id');
  const next = formData.get('next');
  if (typeof id !== 'string') return;

  await setItemVisibility(id, next === 'true');
  revalidatePath('/admin/inventory');
  revalidatePath('/');
}

export async function deleteItemAction(formData: FormData) {
  await requireEditor();
  const id = formData.get('id');
  if (typeof id !== 'string') return;

  await deleteItem(id);
  revalidatePath('/admin/inventory');
  revalidatePath('/');
}
