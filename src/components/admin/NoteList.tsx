'use client';

import { useTransition } from 'react';
import { deleteNoteAction } from '@/app/admin/actions/enquiries';
import { STATUS_LABELS, type EnquiryNote } from '@/lib/data/types';

/**
 * The note column. Each comment can be deleted; the status transition it
 * recorded stays, because the audit trail of who moved what should not be
 * editable from the panel.
 */
export default function NoteList({ notes }: { notes: EnquiryNote[] }) {
  const [pending, start] = useTransition();

  if (!notes.length) return <span className="ibrand">—</span>;

  const withComment = notes.filter((n) => n.note);

  return (
    <div className="ibrand" style={{ display: 'grid', gap: 8 }}>
      {notes.map((n) => {
        const moved =
          n.status_from && n.status_to && n.status_from !== n.status_to;
        return (
          <div key={n.id}>
            {moved && (
              <div>
                {STATUS_LABELS[n.status_from!]} → {STATUS_LABELS[n.status_to!]}
              </div>
            )}
            {n.note && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--txt)' }}>{n.note}</span>
                <button
                  className="lk del"
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm('Delete this note? The status change stays.')) return;
                    start(async () => {
                      const fd = new FormData();
                      fd.set('noteId', n.id);
                      await deleteNoteAction(fd);
                    });
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
      {!withComment.length && <span>no comments</span>}
    </div>
  );
}
