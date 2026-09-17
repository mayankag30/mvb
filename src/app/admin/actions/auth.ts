'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/data/supabase-server';
import { getServiceClient } from '@/lib/data/supabase-client';

const schema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginState = { error?: string };

/**
 * Staff sign in by username, but Supabase Auth signs in by email — resolve
 * one to the other via the staff table, using the service-role client since
 * staff has no read policy for a caller who isn't signed in yet.
 */
async function emailForUsername(username: string): Promise<string | null> {
  const client = getServiceClient();
  const { data: staff, error: staffErr } = await client
    .from('staff')
    .select('id')
    .ilike('username', username)
    .maybeSingle();
  if (staffErr) throw new Error(staffErr.message);
  if (!staff) return null;

  const { data, error } = await client.auth.admin.getUserById(staff.id);
  if (error) throw new Error(error.message);
  return data.user?.email ?? null;
}

export async function login(
  _prev: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const email = await emailForUsername(parsed.data.username);
  if (!email) {
    // deliberately does not say which field was wrong
    return { error: 'Those details did not match. Please try again.' };
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (error) {
    return { error: 'Those details did not match. Please try again.' };
  }

  const next = formData.get('next');
  redirect(typeof next === 'string' && next.startsWith('/admin') ? next : '/admin');
}

export async function logout() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
