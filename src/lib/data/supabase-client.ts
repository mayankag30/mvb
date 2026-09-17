// Two clients, two trust levels.
//
// Anon client: respects RLS, used for public storefront reads.
// Service client: bypasses RLS, used only from Server Actions/Server
// Components for admin reads/writes. Never import this in a "use client" file
// — SUPABASE_SERVICE_ROLE_KEY must never reach the browser.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let anon: SupabaseClient | null = null;
let service: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

export function getAnonClient(): SupabaseClient {
  if (!anon) {
    anon = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      { auth: { persistSession: false } },
    );
  }
  return anon;
}

export function getServiceClient(): SupabaseClient {
  if (!service) {
    service = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
  }
  return service;
}
