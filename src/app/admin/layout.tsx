import { requireStaff } from '@/lib/data/session';
import { usingStubAuth } from '@/lib/data/stub-guard';
import Sidebar from '@/components/admin/Sidebar';
import './admin.css';

export const metadata = {
  title: 'MVB Admin',
  robots: { index: false, follow: false },
};

/**
 * Shell structure per design-reference/admin.html: .shell > aside + main.
 * The reference toggles .page.on to switch views; here each view is a real
 * route, so main just renders the active page.
 *
 * Guards every admin page server-side. A user who exists but is not active
 * staff gets no panel at all (SPEC §6).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard removed for preview deploy — see middleware.ts comment.
  // Restore `if (usingStubAuth() && process.env.NODE_ENV === 'production') notFound();`
  // when DATA_SOURCE=supabase.

  const session = await requireStaff();

  const preview = usingStubAuth();

  return (
    <div className="shell">
      <Sidebar displayName={session.staff.display_name} />
      <main>
        {preview && (
          <div style={{
            background: '#7A3A00',
            color: '#FFD580',
            fontSize: 12.5,
            letterSpacing: '.06em',
            padding: '7px 20px',
            textAlign: 'center',
          }}>
            PREVIEW MODE — data resets on each server restart · no changes are saved · connect Supabase to go live
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
