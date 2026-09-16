'use client';

import { useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Collection } from '@/lib/data/types';

/**
 * Search and filters for the inventory table. The reference's .ptitle already
 * carries "All collections" and "All statuses" selects; this makes them work
 * and adds a name search beside them.
 *
 * State lives in URL search params, like the storefront's collection filters,
 * so a filtered view is shareable and the back button works.
 */
export default function InventoryTools({
  collections,
  total,
  shown,
  q,
  collection,
  visibility,
}: {
  collections: Collection[];
  total: number;
  shown: number;
  q: string;
  collection: string;
  visibility: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="ptitle">
      <span>
        {shown === total ? `${total} ITEMS` : `${shown} OF ${total} ITEMS`}
      </span>

      <span className="itools">
        <label className="sr-only" htmlFor="inv-q">
          Search items by name
        </label>
        <input
          id="inv-q"
          className="isearch"
          type="search"
          placeholder="Search by name or brand"
          defaultValue={q}
          onChange={(e) => {
            const v = e.target.value;
            if (debounce.current) clearTimeout(debounce.current);
            debounce.current = setTimeout(() => set('q', v), 200);
          }}
        />

        <label className="sr-only" htmlFor="inv-collection">
          Filter by collection
        </label>
        <select
          id="inv-collection"
          className="st"
          value={collection}
          onChange={(e) => set('collection', e.target.value)}
        >
          <option value="">All collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="inv-visibility">
          Filter by visibility
        </label>
        <select
          id="inv-visibility"
          className="st"
          value={visibility}
          onChange={(e) => set('visibility', e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>

        {(q || collection || visibility) && (
          <button
            className="lk"
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            Clear
          </button>
        )}
      </span>
    </div>
  );
}
