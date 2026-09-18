import { listStaff } from '@/lib/data';
import { requireSuper } from '@/lib/data/session';
import StaffTable from '@/components/admin/StaffTable';
import CreateStaffForm from '@/components/admin/CreateStaffForm';
import ChangePasswordForm from '@/components/admin/ChangePasswordForm';

export default async function StaffPage() {
  const session = await requireSuper();
  const staff = await listStaff();

  return (
    <section className="page">
      <div className="ptop">
        <div>
          <h1 className="ph">Staff accounts</h1>
          <p className="psub">Manage who can access this panel and what they can do.</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 28 }}>
        <StaffTable staff={staff} currentUserId={session.user.id} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="fbox">
          <h3>Add a staff member</h3>
          <p className="note" style={{ marginBottom: 16 }}>
            New users are emailed a confirmation link automatically. They can log in once confirmed.
          </p>
          <CreateStaffForm />
        </div>

        <div className="fbox">
          <h3>Change your password</h3>
          <p className="note" style={{ marginBottom: 16 }}>
            Enter your current password to set a new one.
          </p>
          <ChangePasswordForm />
        </div>
      </div>
    </section>
  );
}
