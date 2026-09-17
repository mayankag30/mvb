import { redirect } from 'next/navigation';

export type Session = {
  user: { id: string; email: string };
  staff: { display_name: string; is_active: boolean };
};

export async function getSession(): Promise<Session | null> {
  const { getSupabaseSession } = await import('./session-supabase');
  return getSupabaseSession();
}

/** Redirects to the login page unless the caller is active staff. */
export async function requireStaff(): Promise<Session> {
  const session = await getSession();
  if (!session || !session.staff.is_active) redirect('/admin/login');
  return session;
}
