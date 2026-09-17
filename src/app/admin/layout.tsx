import { requireStaff } from '@/lib/data/session';
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
  const session = await requireStaff();

  return (
    <div className="shell">
      <Sidebar displayName={session.staff.display_name} />
      <main>{children}</main>
    </div>
  );
}
