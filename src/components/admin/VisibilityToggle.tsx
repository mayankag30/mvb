'use client';

import { useTransition } from 'react';
import { toggleVisibilityAction } from '@/app/admin/actions/items';

/** .tog per design-reference/admin.html — a switch, not a chip. */
export default function VisibilityToggle({
  itemId,
  isVisible,
}: {
  itemId: string;
  isVisible: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      className="tog"
      aria-pressed={isVisible}
      aria-label="Show on website"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          fd.set('id', itemId);
          fd.set('next', String(!isVisible));
          await toggleVisibilityAction(fd);
        })
      }
    />
  );
}
