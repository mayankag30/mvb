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

  if (pathname === LOGIN) return NextResponse.next();

  // Routing convenience only — RLS and requireStaff()'s server-side check are
  // the real boundary. A stale/forged sb-* cookie gets past this but fails
  // getSupabaseSession() immediately after.
  const authed = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

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
