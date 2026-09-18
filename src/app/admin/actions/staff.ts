'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireStaff, requireSuper } from '@/lib/data/session';
import { getServiceClient } from '@/lib/data/supabase-client';
import { getServerSupabase } from '@/lib/data/supabase-server';
import type { StaffRole } from '@/lib/data/types';

export type StaffActionState = { error?: string; ok?: boolean } | null;

// ── Create staff user (super only) ──────────────────────────────────────────

const createSchema = z.object({
  username: z.string().trim().min(2, 'Username must be at least 2 characters').max(40)
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers and underscores only'),
  display_name: z.string().trim().min(1, 'Display name is required').max(80),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['editor', 'viewer']),
});

export async function createStaffAction(
  _prev: StaffActionState,
  fd: FormData,
): Promise<StaffActionState> {
  await requireSuper();

  const parsed = createSchema.safeParse({
    username: fd.get('username'),
    display_name: fd.get('display_name'),
    email: fd.get('email'),
    password: fd.get('password'),
    role: fd.get('role'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const client = getServiceClient();

  // Check username uniqueness
  const { data: existing } = await client
    .from('staff')
    .select('id')
    .ilike('username', parsed.data.username)
    .maybeSingle();
  if (existing) return { error: 'That username is already taken.' };

  // Create auth user
  const { data: authData, error: authErr } = await client.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (authErr) return { error: authErr.message };

  // Insert staff row
  const { error: staffErr } = await client.from('staff').insert({
    id: authData.user.id,
    username: parsed.data.username,
    display_name: parsed.data.display_name,
    role: parsed.data.role,
    is_active: true,
  });
  if (staffErr) {
    // Roll back auth user if staff insert fails
    await client.auth.admin.deleteUser(authData.user.id);
    return { error: staffErr.message };
  }

  revalidatePath('/admin/staff');
  return { ok: true };
}

// ── Update role (super only, cannot set role to super) ───────────────────────

export async function updateStaffRoleAction(fd: FormData): Promise<StaffActionState> {
  await requireSuper();

  const id = z.string().uuid().safeParse(fd.get('id'));
  const role = z.enum(['editor', 'viewer']).safeParse(fd.get('role'));
  if (!id.success || !role.success) return { error: 'Invalid input.' };

  // Prevent changing super user's role
  const { data: target } = await getServiceClient()
    .from('staff').select('role').eq('id', id.data).maybeSingle();
  if (target?.role === 'super') return { error: 'Cannot change the super user role.' };

  await getServiceClient()
    .from('staff').update({ role: role.data as StaffRole }).eq('id', id.data);

  revalidatePath('/admin/staff');
  return { ok: true };
}

// ── Toggle active status (super only, cannot deactivate self) ────────────────

export async function toggleStaffActiveAction(fd: FormData): Promise<StaffActionState> {
  const session = await requireSuper();

  const id = z.string().uuid().safeParse(fd.get('id'));
  if (!id.success) return { error: 'Invalid input.' };
  if (id.data === session.user.id) return { error: 'You cannot deactivate your own account.' };

  const { data: target } = await getServiceClient()
    .from('staff').select('is_active, role').eq('id', id.data).maybeSingle();
  if (!target) return { error: 'Staff member not found.' };
  if (target.role === 'super') return { error: 'Cannot deactivate the super user.' };

  await getServiceClient()
    .from('staff').update({ is_active: !target.is_active }).eq('id', id.data);

  revalidatePath('/admin/staff');
  return { ok: true };
}

// ── Change own password (any active staff) ───────────────────────────────────

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Enter your current password'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export async function changePasswordAction(
  _prev: StaffActionState,
  fd: FormData,
): Promise<StaffActionState> {
  const session = await requireStaff();

  const parsed = passwordSchema.safeParse({
    current_password: fd.get('current_password'),
    new_password: fd.get('new_password'),
    confirm_password: fd.get('confirm_password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Verify current password by re-signing in
  const supabase = await getServerSupabase();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: session.user.email,
    password: parsed.data.current_password,
  });
  if (signInErr) return { error: 'Current password is incorrect.' };

  // Update password
  const { error: updateErr } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });
  if (updateErr) return { error: updateErr.message };

  return { ok: true };
}
