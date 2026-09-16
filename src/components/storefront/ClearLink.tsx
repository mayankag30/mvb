'use client';

import { usePathname, useRouter } from 'next/navigation';

/** "Clear everything" button — strips all search params and goes to page 1. */
export default function ClearLink() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button
      className="pg"
      type="button"
      onClick={() => router.replace(pathname, { scroll: false })}
    >
      Clear everything
    </button>
  );
}
