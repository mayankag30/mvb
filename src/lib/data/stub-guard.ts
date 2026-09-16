/**
 * Fail-closed guard against shipping the stub authenticator.
 *
 * The Phase 1 session is an unsigned cookie (`mvb_dev_session=1`) that anyone
 * can set in devtools to obtain the whole admin panel — every customer's phone
 * number included. That is acceptable on localhost and nowhere else, so this
 * refuses to serve /admin at all when the stub is in use in production.
 *
 * KEEP THIS AFTER PHASE 2 STEP 13. Once Supabase Auth is wired,
 * usingStubAuth() returns false and the guard is inert — which makes it a
 * regression test: if anyone reintroduces a stub authenticator, or ships with
 * DATA_SOURCE unset, this is what fails, loudly, instead of quietly exposing
 * customer data.
 */

/** True when the session comes from the unsigned Phase 1 cookie. */
export function usingStubAuth(): boolean {
  return process.env.DATA_SOURCE !== 'supabase';
}

export class StubAuthInProductionError extends Error {
  constructor() {
    super(
      'Refusing to serve /admin: the Phase 1 stub authenticator is an unsigned ' +
        'cookie and must never run in production. Set DATA_SOURCE=supabase and ' +
        'complete Phase 2 step 13 (real Supabase Auth) before deploying. ' +
        'See SPEC.md §6.',
    );
    this.name = 'StubAuthInProductionError';
  }
}

/**
 * Throws if the stub authenticator would be used in production.
 * Called from the admin layout and the login action, so neither the panel nor
 * the sign-in route can serve a request the stub would have authorised.
 */
export function assertNotStubAuthInProduction(): void {
  if (process.env.NODE_ENV === 'production' && usingStubAuth()) {
    throw new StubAuthInProductionError();
  }
}
