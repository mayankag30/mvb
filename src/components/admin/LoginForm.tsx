'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/app/admin/actions/auth';

/**
 * .lbox per design-reference/admin.html. The reference's .lhint is a
 * design-preview affordance ("open the dashboard directly") that must not
 * exist in a real build — it would bypass auth — so it is omitted.
 */
export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState | null, FormData>(
    login,
    null,
  );

  // only a same-site admin path is ever passed through
  const safeNext = next && next.startsWith('/admin') ? next : '/admin';

  return (
    <div className="login-screen">
      <form className="lbox" action={action}>
        <div className="lbrand">MVB</div>
        <p className="lsub">Staff panel</p>

        <input type="hidden" name="next" value={safeNext} />

        <div className="lfield">
          <label htmlFor="u">USERNAME</label>
          <input
            id="u"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </div>

        <div className="lfield">
          <label htmlFor="p">PASSWORD</label>
          <input
            id="p"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <button className="lbtn" type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>

        <p className={`lerr${state?.error ? ' show' : ''}`} role="alert">
          {state?.error}
        </p>
      </form>
    </div>
  );
}
