import { redirect } from 'next/navigation';
import type { StaffRole } from './types';

export type Session = {
  user: { id: string; email: string };
  staff: { display_name: string; is_active: boolean; role: StaffRole };
};

export async function getSession(): Promise<Session | null> {
  const { getSupabaseSession } = await import('./session-supabase');
  return getSupabaseSession();
}

/** Redirects to login unless the caller is active staff (any role). */
export async function requireStaff(): Promise<Session> {
  const session = await getSession();
  if (!session || !session.staff.is_active) redirect('/admin/login');
  return session;
}

/** Redirects to login unless the caller is an editor or super. */
export async function requireEditor(): Promise<Session> {
  const session = await requireStaff();
  if (session.staff.role === 'viewer') redirect('/admin');
  return session;
}

/** Redirects to login unless the caller is the super user. */
export async function requireSuper(): Promise<Session> {
  const session = await requireStaff();
  if (session.staff.role !== 'super') redirect('/admin');
  return session;
}
