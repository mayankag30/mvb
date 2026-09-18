'use client';

import { useActionState } from 'react';
import { changePasswordAction } from '@/app/admin/actions/staff';

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);

  return (
    <form action={action}>
      {state?.ok && (
        <p className="note" style={{ color: '#2E7D52', marginBottom: 12 }}>
          Password changed successfully.
        </p>
      )}
      {state?.error && (
        <p className="note" style={{ color: '#9B1F45', marginBottom: 12 }}>
          {state.error}
        </p>
      )}

      <div className="f">
        <label htmlFor="cp-current">CURRENT PASSWORD</label>
        <input id="cp-current" name="current_password" type="password" required />
      </div>
      <div className="f">
        <label htmlFor="cp-new">NEW PASSWORD</label>
        <input id="cp-new" name="new_password" type="password" required minLength={8} placeholder="Min 8 characters" />
      </div>
      <div className="f">
        <label htmlFor="cp-confirm">CONFIRM NEW PASSWORD</label>
        <input id="cp-confirm" name="confirm_password" type="password" required minLength={8} />
      </div>

      <div className="savebar">
        <button className="btn btn-p" type="submit" disabled={pending}>
          {pending ? 'Updating…' : 'Change password'}
        </button>
      </div>
    </form>
  );
}
