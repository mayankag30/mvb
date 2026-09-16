// The guard is real from the first commit; only what it checks against changes.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { assertNotStubAuthInProduction } from './stub-guard';

export type Session = {
  user: { id: string; email: string };
  staff: { display_name: string; is_active: boolean };
};

const DEV_SESSION: Session = {
  user: { id: 'dev-staff-1', email: 'dev@local' },
  staff: { display_name: 'Priya', is_active: true },
};

export async function getSession(): Promise<Session | null> {
  // never let the unsigned Phase 1 cookie authorise a production request
  assertNotStubAuthInProduction();

  if (process.env.DATA_SOURCE === 'supabase') {
    const { getSupabaseSession } = await import('./session-supabase');
    return getSupabaseSession();
  }
  // Phase 1: the login action sets this cookie. Without it there is no session,
  // so the guard below actually guards.
  const store = await cookies();
  return store.get('mvb_dev_session')?.value === '1' ? DEV_SESSION : null;
}

/** Redirects to the login page unless the caller is active staff. */
export async function requireStaff(): Promise<Session> {
  const session = await getSession();
  if (!session || !session.staff.is_active) redirect('/admin/login');
  return session;
}
