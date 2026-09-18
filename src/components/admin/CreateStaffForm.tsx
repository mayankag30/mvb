'use client';

import { useActionState } from 'react';
import { createStaffAction } from '@/app/admin/actions/staff';

export default function CreateStaffForm() {
  const [state, action, pending] = useActionState(createStaffAction, null);

  return (
    <form action={action}>
      {state?.ok && (
        <p className="note" style={{ color: '#2E7D52', marginBottom: 12 }}>
          Staff member created successfully.
        </p>
      )}
      {state?.error && (
        <p className="note" style={{ color: '#9B1F45', marginBottom: 12 }}>
          {state.error}
        </p>
      )}

      <div className="f">
        <label htmlFor="sf-username">USERNAME</label>
        <input id="sf-username" name="username" placeholder="e.g. priya" required maxLength={40} />
      </div>
      <div className="f">
        <label htmlFor="sf-display">DISPLAY NAME</label>
        <input id="sf-display" name="display_name" placeholder="e.g. Priya" required maxLength={80} />
      </div>
      <div className="f">
        <label htmlFor="sf-email">EMAIL</label>
        <input id="sf-email" name="email" type="email" placeholder="priya@example.com" required />
      </div>
      <div className="f">
        <label htmlFor="sf-password">TEMPORARY PASSWORD</label>
        <input id="sf-password" name="password" type="password" placeholder="Min 8 characters" required minLength={8} />
      </div>
      <div className="f">
        <label htmlFor="sf-role">ROLE</label>
        <select id="sf-role" name="role" defaultValue="viewer">
          <option value="viewer">Viewer — read only</option>
          <option value="editor">Editor — can edit inventory &amp; brands</option>
        </select>
      </div>

      <div className="savebar">
        <button className="btn btn-p" type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create staff member'}
        </button>
      </div>
    </form>
  );
}
