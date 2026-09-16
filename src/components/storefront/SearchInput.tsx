'use client';

import { useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Debounced search box for the collection view. Writes ?q= to the URL;
 * the Server Component re-renders with the filtered result. Resets to page 1
 * on every keystroke so you never land on a page that doesn't exist.
 */
export default function SearchInput({
  placeholder,
  defaultValue,
}: {
  placeholder: string;
  defaultValue: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <input
      type="search"
      placeholder={placeholder}
      aria-label={placeholder}
      defaultValue={defaultValue}
      onChange={(e) => {
        const v = e.target.value;
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
          const next = new URLSearchParams(params.toString());
          if (v.trim()) next.set('q', v.trim());
          else next.delete('q');
          next.delete('page'); // reset to page 1
          const qs = next.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }, 200);
      }}
    />
  );
}
