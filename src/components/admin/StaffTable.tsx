'use client';

import { useTransition } from 'react';
import { toggleStaffActiveAction, updateStaffRoleAction } from '@/app/admin/actions/staff';
import type { Staff } from '@/lib/data/types';

const ROLE_LABELS: Record<string, string> = {
  super: 'Super',
  editor: 'Editor',
  viewer: 'Viewer',
};

const ROLE_PILL: Record<string, string> = {
  super: 'p-super',
  editor: 'p-ord',
  viewer: 'p-pend',
};

export default function StaffTable({
  staff,
  currentUserId,
}: {
  staff: Staff[];
  currentUserId: string;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>USERNAME</th>
          <th>NAME</th>
          <th>ROLE</th>
          <th>ADDED</th>
          <th>STATUS</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {staff.map((s) => (
          <StaffRow key={s.id} s={s} isSelf={s.id === currentUserId} />
        ))}
      </tbody>
    </table>
  );
}

function StaffRow({ s, isSelf }: { s: Staff; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const isSuper = s.role === 'super';
  const canEdit = !isSuper; // cannot edit super user row

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const fd = new FormData();
    fd.set('id', s.id);
    fd.set('role', e.target.value);
    startTransition(() => { void updateStaffRoleAction(fd); });
  }

  function handleToggle() {
    const fd = new FormData();
    fd.set('id', s.id);
    startTransition(() => { void toggleStaffActiveAction(fd); });
  }

  return (
    <tr style={{ opacity: pending ? 0.5 : 1 }}>
      <td>{s.username}</td>
      <td><span className="iname">{s.display_name}</span>{isSelf && <span style={{ fontSize: 11, color: '#9A8FB8', marginLeft: 6 }}>(you)</span>}</td>
      <td>
        {canEdit ? (
          <select
            value={s.role}
            onChange={handleRoleChange}
            disabled={pending}
            style={{ fontSize: 12, padding: '4px 8px', background: 'var(--ink2)', color: 'var(--ivory)', border: '1px solid rgba(217,169,60,.3)', borderRadius: 2 }}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        ) : (
          <span className={`pill ${ROLE_PILL[s.role]}`}>{ROLE_LABELS[s.role]}</span>
        )}
      </td>
      <td>
        {new Date(s.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </td>
      <td>
        <span className={`pill ${s.is_active ? 'p-ord' : 'p-res'}`}>
          {s.is_active ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td>
        {canEdit && !isSelf && (
          <button className="lk" onClick={handleToggle} disabled={pending}>
            {s.is_active ? 'Disable' : 'Enable'}
          </button>
        )}
        {isSuper && <span style={{ fontSize: 12, color: '#6F6490' }}>—</span>}
      </td>
    </tr>
  );
}
