// Phase 2. Reads the cookie-bound Supabase session and its staff row.

import type { Session } from './session';

export async function getSupabaseSession(): Promise<Session | null> {
  throw new Error('Supabase session not implemented yet (Phase 2, SPEC.md step 15).');
}
