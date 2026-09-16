'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Pagination bar — mirrors renderPager() from design-reference/index.html.
 * Uses .pager / .pg / .pg-gap from globals.css (ported verbatim).
 *
 * Condensed layout: 1 … (page-1) page (page+1) … last, max 7 slots.
 */
export default function Pager({ page, pages }: { page: number; pages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (pages <= 1) return null;

  function go(p: number) {
    const next = new URLSearchParams(params.toString());
    if (p === 1) next.delete('page');
    else next.set('page', String(p));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: true });
  }

  const nums: (number | '…')[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    const a = Math.max(2, page - 1);
    const b = Math.min(pages - 1, page + 1);
    nums.push(1);
    if (a > 2) nums.push('…');
    for (let i = a; i <= b; i++) nums.push(i);
    if (b < pages - 1) nums.push('…');
    nums.push(pages);
  }

  return (
    <div className="pager">
      <button className="pg" type="button" disabled={page === 1} onClick={() => go(page - 1)}>
        Previous
      </button>
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`gap-${i}`} className="pg-gap">
            …
          </span>
        ) : (
          <button
            key={n}
            className="pg"
            type="button"
            aria-current={n === page ? 'page' : undefined}
            onClick={() => go(n as number)}
          >
            {n}
          </button>
        ),
      )}
      <button
        className="pg"
        type="button"
        disabled={page === pages}
        onClick={() => go(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
