'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createBrand,
  deleteBrand,
  getBrandItemCount,
  renameBrand,
} from '@/lib/data';

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Brand name is required')
  .max(80, 'Keep it under 80 characters');

export type BrandFormState = { error?: string } | null;

export async function createBrandAction(
  _prev: BrandFormState,
  fd: FormData,
): Promise<BrandFormState> {
  const parse = nameSchema.safeParse(fd.get('name'));
  if (!parse.success) return { error: parse.error.issues[0].message };
  await createBrand(parse.data);
  revalidatePath('/admin/brands');
  return null;
}

export async function renameBrandAction(fd: FormData): Promise<BrandFormState> {
  const oldName = z.string().trim().min(1).safeParse(fd.get('old'));
  const newName = nameSchema.safeParse(fd.get('name'));
  if (!oldName.success || !newName.success) return { error: 'Invalid name' };
  await renameBrand(oldName.data, newName.data);
  revalidatePath('/admin/brands');
  revalidatePath('/admin/inventory');
  return null;
}

export async function deleteBrandAction(
  _prev: BrandFormState,
  fd: FormData,
): Promise<BrandFormState> {
  const name = z.string().trim().min(1).safeParse(fd.get('name'));
  if (!name.success) return { error: 'Invalid brand' };
  await deleteBrand(name.data);
  revalidatePath('/admin/brands');
  revalidatePath('/admin/inventory');
  return null;
}
