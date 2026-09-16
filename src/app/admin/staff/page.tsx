import { listStaff } from '@/lib/data';

export default async function StaffPage() {
  const staff = await listStaff();

  return (
    <section className="page">
      <div className="ptop">
        <div>
          <h1 className="ph">Staff accounts</h1>
          <p className="psub">
            Two accounts can sign in to this panel. Passwords are stored hashed
            and cannot be read back.
          </p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>USERNAME</th>
              <th>NAME</th>
              <th>ADDED</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td>{s.username}</td>
                <td>
                  <span className="iname">{s.display_name}</span>
                </td>
                <td>
                  {new Date(s.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td>
                  <span className={`pill ${s.is_active ? 'p-ord' : 'p-res'}`}>
                    {s.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="fbox" style={{ maxWidth: 520 }}>
        <h3>How accounts work</h3>
        <p className="note">
          Accounts are created by hand in the Supabase dashboard and mirrored
          into the <code>staff</code> table — public signup is disabled. No
          password is stored by this application; Supabase hashes them with
          bcrypt. To change a password, use the password reset flow. To revoke
          access, set the staff row inactive.
        </p>
      </div>
    </section>
  );
}
