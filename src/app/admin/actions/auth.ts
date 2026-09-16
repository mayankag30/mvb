'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertNotStubAuthInProduction } from '@/lib/data/stub-guard';

const schema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginState = { error?: string };

// Phase 1 only. Phase 2 replaces this with supabase.auth.signInWithPassword —
// no password is ever stored or compared by this application (SPEC.md §6).
const DEV_USERS: Record<string, string> = {
  priya: 'mvb-dev-priya-2026',
  mahesh: 'mvb-dev-mahesh-2026',
};

export async function login(
  _prev: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  // a Server Action can be POSTed directly, so the guard cannot live only in
  // the page — this is the call that would otherwise set the session cookie
  assertNotStubAuthInProduction();

  const parsed = schema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (process.env.DATA_SOURCE === 'supabase') {
    return { error: 'Supabase auth not wired yet (Phase 2, SPEC.md step 13).' };
  }

  const expected = DEV_USERS[parsed.data.username.toLowerCase()];
  if (!expected || expected !== parsed.data.password) {
    // deliberately does not say which field was wrong
    return { error: 'Those details did not match. Please try again.' };
  }

  const store = await cookies();
  store.set('mvb_dev_session', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  const next = formData.get('next');
  redirect(typeof next === 'string' && next.startsWith('/admin') ? next : '/admin');
}

export async function logout() {
  const store = await cookies();
  store.delete('mvb_dev_session');
  redirect('/admin/login');
}
