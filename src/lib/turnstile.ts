// Cloudflare Turnstile verification. Server only.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Phase 1: no secret configured, so this passes. Phase 2: set TURNSTILE_SECRET_KEY
 * and every submission is verified against Cloudflare.
 */
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // stubbed until keys exist (SPEC.md step 17)
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      cache: 'no-store',
    });
    const data: { success?: boolean } = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
