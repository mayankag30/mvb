'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * A sortable column header. Sort state lives in URL search params
 * (`?sort=item&dir=desc`) so it survives a refresh and the back button, and
 * the sort itself happens server-side in the page.
 *
 * Renders inside the reference's <th>, inheriting its type, so the column
 * looks unchanged until you hover.
 */
export default function SortHeader({
  column,
  label,
  active,
  dir,
}: {
  column: string;
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function toggle() {
    const next = new URLSearchParams(params.toString());
    if (!active) {
      next.set('sort', column);
      next.delete('dir'); // asc is the default
    } else if (dir === 'asc') {
      next.set('sort', column);
      next.set('dir', 'desc');
    } else {
      next.delete('sort'); // third click clears back to display_order
      next.delete('dir');
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <button
      className="sortbtn"
      type="button"
      onClick={toggle}
      title={
        !active
          ? `Sort by ${label.toLowerCase()}`
          : dir === 'asc'
            ? `Sort by ${label.toLowerCase()}, descending`
            : 'Clear sort'
      }
    >
      {label}
      <span className="car" aria-hidden="true">
        {active ? (dir === 'asc' ? '▲' : '▼') : '▲▼'}
      </span>
    </button>
  );
}
