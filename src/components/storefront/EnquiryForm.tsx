'use client';

import { useActionState, useEffect, useRef } from 'react';
import { submitEnquiry, type EnquiryState } from '@/app/actions/enquiry';

/**
 * Markup and copy verbatim from design-reference/index.html.
 * The reference's demo submit handler is replaced by the real Server Action;
 * .form.sent swaps .form-inner for .form-done exactly as the reference does.
 *
 * Turnstile: when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set the widget script loads
 * and renders a challenge token into a hidden field. Without the key the server-
 * side verifyTurnstile() passes (Phase 1 stub), so the form still works.
 *
 * item_id: ProductTile sets window.__mvb_item_id before scrolling here; the form
 * reads it on mount and stuffs it into the hidden field. This matches the
 * reference's data-name pattern — the server action accepts it as optional.
 */
export default function EnquiryForm() {
  const [state, action, pending] = useActionState<EnquiryState | null, FormData>(
    submitEnquiry,
    null,
  );

  const sent = state?.ok === true;
  const err = (f: string) => state?.fieldErrors?.[f];
  const itemRef = useRef<HTMLInputElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);

  // ProductTile writes window.__mvb_item_id + window.__mvb_item_name before
  // scrolling into view. Read them once on mount; update when the section is
  // scrolled to again via the Intersection Observer in Nav.
  useEffect(() => {
    function sync() {
      const w = window as Record<string, unknown>;
      if (itemRef.current) itemRef.current.value = String(w.__mvb_item_id ?? '');
      if (msgRef.current && w.__mvb_item_name) {
        msgRef.current.value = `I am interested in: ${w.__mvb_item_name}`;
      }
    }
    const el = document.getElementById('enquire');
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) sync(); }, {
      threshold: 0.1,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <form className={`form${sent ? ' sent' : ''}`} id="enqForm" action={action} noValidate>
      <div className="form-inner">
        {/* hidden fields — item_id optional; cf-turnstile-response filled by widget */}
        <input ref={itemRef} type="hidden" name="item_id" />

        <div className="field">
          <label htmlFor="f-name">Your name</label>
          <input
            id="f-name"
            name="name"
            required
            placeholder="Meera Sharma"
            aria-invalid={err('name') ? true : undefined}
          />
          {err('name') && <p className="field-err">{err('name')}</p>}
        </div>

        <div className="two">
          <div className="field">
            <label htmlFor="f-wa">WhatsApp number</label>
            <input
              id="f-wa"
              name="whatsapp"
              type="tel"
              required
              placeholder="+91 98xxx xxxxx"
              aria-invalid={err('whatsapp') ? true : undefined}
            />
            {err('whatsapp') && <p className="field-err">{err('whatsapp')}</p>}
          </div>
          <div className="field">
            <label htmlFor="f-phone">Other number</label>
            <input id="f-phone" name="phone" type="tel" placeholder="Optional" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="f-email">Email</label>
          <input
            id="f-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={err('email') ? true : undefined}
          />
          {err('email') && <p className="field-err">{err('email')}</p>}
        </div>

        <div className="field">
          <label htmlFor="f-int">What are you looking for</label>
          <select id="f-int" name="interest" defaultValue="Lehenga">
            <option>Lehenga</option>
            <option>Saree</option>
            <option>Suit</option>
            <option>Gown</option>
            <option>Dupatta or accessories</option>
            <option>Still deciding</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="f-msg">Anything else we should know</label>
          <textarea
            id="f-msg"
            ref={msgRef}
            name="message"
            maxLength={1000}
            placeholder="Occasion, date, budget, colour you have in mind, or the item code you liked."
          />
          {err('message') && <p className="field-err">{err('message')}</p>}
        </div>

        {/* Cloudflare Turnstile — renders when the site key is configured */}
        {siteKey && (
          <>
            <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          </>
        )}

        {state?.error && !sent && (
          <p className="field-err" role="alert">
            {state.error}
          </p>
        )}

        <button className="submit" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send my enquiry'}
        </button>
      </div>

      <div className="form-done" role="status">
        <h4>Enquiry received</h4>
        <p>
          We have your details. Expect a WhatsApp message from our team shortly —
          save the number so it does not land in spam.
        </p>
      </div>
    </form>
  );
}
