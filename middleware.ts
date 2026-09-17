import { NextResponse, type NextRequest } from 'next/server';

const LOGIN = '/admin/login';

/**
 * Runs before any rendering, which is why the fail-closed stub check lives
 * here as well as in the admin layout.
 *
 * Next renders a layout and its page in parallel, so a `notFound()` in the
 * layout changes the status code but the page has already produced its RSC
 * payload — an unauthorised request still received customer data in the body
 * of the 404. Middleware returns before any of that happens, so nothing is
 * rendered and nothing can leak.
 *
 * The session check itself is routing convenience — RLS is the real boundary
 * (SPEC.md §5, §6). The stub check is not: it is a hard stop.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PREVIEW MODE: stub auth is intentionally allowed in production so the admin
  // panel is visible for demonstration. This block is removed when Supabase is
  // wired (B1) — the guard below is the real regression test.
  // KEEP THIS COMMENT: once DATA_SOURCE=supabase, restore the 404 guard here.

  if (pathname === LOGIN) return NextResponse.next();

  // Staff auth stays on the Phase 1 stub cookie regardless of DATA_SOURCE —
  // DATA_SOURCE=supabase only swaps the catalogue/enquiry data layer (step 14).
  // Real Supabase Auth (sb-* cookies) is a separate, later swap (step 15).
  const authed = request.cookies.get('mvb_dev_session')?.value === '1';

  if (!authed) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
