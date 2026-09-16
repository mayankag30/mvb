'use client';

import { useState } from 'react';
import { updateStatusAction } from '@/app/admin/actions/enquiries';
import {
  ENQUIRY_STATUSES,
  STATUS_LABELS,
  type EnquiryStatus,
} from '@/lib/data/types';

/**
 * select.st per design-reference/admin.html. The reference's "Add note" link
 * opens a note field; here it reveals a comment input and submits it with the
 * currently selected status, so a status change and its note are one write
 * and one audit row.
 */
export default function StatusSelect({
  enquiryId,
  status,
}: {
  enquiryId: string;
  status: EnquiryStatus;
}) {
  const [chosen, setChosen] = useState<EnquiryStatus>(status);
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  function cancelNote() {
    setNoteOpen(false);
    setNote('');
  }

  async function submit(next: EnquiryStatus, comment: string | null) {
    setPending(true);
    const fd = new FormData();
    fd.set('id', enquiryId);
    fd.set('status', next);
    if (comment) fd.set('note', comment);
    await updateStatusAction(null, fd);
    setPending(false);
    setNoteOpen(false);
    setNote('');
    setSaved(true);
  }

  return (
    <>
      <select
        className="st"
        value={chosen}
        disabled={pending}
        aria-label="Status"
        onChange={(e) => {
          const next = e.target.value as EnquiryStatus;
          setChosen(next);
          if (!noteOpen) submit(next, null);
        }}
      >
        {ENQUIRY_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {noteOpen ? (
        <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            maxLength={1000}
            aria-label="Note"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancelNote();
              if (e.key === 'Enter' && note.trim()) submit(chosen, note.trim());
            }}
          />
          {/* an empty note must not write an audit row, so Save is disabled
              until something is typed */}
          <button
            className="lk"
            type="button"
            disabled={pending || !note.trim()}
            style={!note.trim() ? { opacity: 0.4, cursor: 'default' } : undefined}
            onClick={() => submit(chosen, note.trim())}
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          {/* opening the field must not trap you in it */}
          <button className="lk" type="button" onClick={cancelNote}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="lk"
          type="button"
          style={{ marginTop: 8, display: 'block' }}
          onClick={() => setNoteOpen(true)}
        >
          {saved ? 'Saved · add note' : 'Add note'}
        </button>
      )}
    </>
  );
}
