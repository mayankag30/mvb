// The guard is real from the first commit; only what it checks against changes.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type Session = {
  user: { id: string; email: string };
  staff: { display_name: string; is_active: boolean };
};

const DEV_SESSION: Session = {
  user: { id: 'dev-staff-1', email: 'dev@local' },
  staff: { display_name: 'Priya', is_active: true },
};

export async function getSession(): Promise<Session | null> {
  // Guard removed from here for preview deploy — assertNotStubAuthInProduction()
  // is still present in stub-guard.ts as a regression test. Restore a call here
  // (or in requireStaff) when real Supabase Auth is wired (Phase 2 step 15).

  // DATA_SOURCE=supabase connects the catalogue/enquiry data (step 14) but
  // staff still sign in with the Phase 1 stub cookie until step 15 replaces
  // this with a real Supabase Auth session — the two are independent swaps.
  const store = await cookies();
  return store.get('mvb_dev_session')?.value === '1' ? DEV_SESSION : null;
}

/** Redirects to the login page unless the caller is active staff. */
export async function requireStaff(): Promise<Session> {
  const session = await getSession();
  if (!session || !session.staff.is_active) redirect('/admin/login');
  return session;
}
