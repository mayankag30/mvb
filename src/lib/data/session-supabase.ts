// Phase 2, step 15. Reads the cookie-bound Supabase session and its staff row.

import { getServerSupabase } from './supabase-server';
import { getServiceClient } from './supabase-client';
import type { Session } from './session';

export async function getSupabaseSession(): Promise<Session | null> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // staff has no public/authenticated-read-all policy — is_staff() only lets
  // a caller read their own row indirectly via RLS on other tables, so this
  // lookup goes through the service client rather than relying on a policy
  // that would otherwise have to expose the whole roster.
  const client = getServiceClient();
  const { data: staff, error } = await client
    .from('staff')
    .select('display_name, is_active, role')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!staff) return null;

  return {
    user: { id: user.id, email: user.email ?? '' },
    staff: {
      display_name: staff.display_name,
      is_active: staff.is_active,
      role: staff.role ?? 'viewer',
    },
  };
}
