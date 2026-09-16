'use client';

import { useTransition } from 'react';
import { deleteItemAction } from '@/app/admin/actions/items';

/** .lk.del per design-reference/admin.html. */
export default function DeleteItemButton({
  itemId,
  itemName,
}: {
  itemId: string;
  itemName: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      className="lk del"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete “${itemName}”? This cannot be undone.`)) return;
        start(async () => {
          const fd = new FormData();
          fd.set('id', itemId);
          await deleteItemAction(fd);
        });
      }}
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
