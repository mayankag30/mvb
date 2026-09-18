import { NextResponse } from 'next/server';
import { getAnonClient } from '@/lib/data/supabase-client';

// Pinged daily by Vercel cron to prevent the free Supabase project from pausing.
export async function GET() {
  await getAnonClient().from('shop_settings').select('id').limit(1);
  return NextResponse.json({ ok: true });
}
