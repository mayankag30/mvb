'use client';

import { useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { fmt } from '@/lib/fabric';
import { FAMILY_HEX } from '@/lib/colour-family';
import type { ColourFamily, FilterFacets } from '@/lib/data/types';

/**
 * Filters live in the URL, not in React state — a filtered view is shareable
 * and the back button works. This component only writes search params; the
 * Server Component re-renders with rows already filtered in the query.
 *
 * Layout and class names are the reference's: .filters, .fgroup, .flabel,
 * .price-now, .price-slider (never .range — see SPEC §8c), .chips2, .chip2,
 * .cswatch, .clearf.
 */
export default function FilterBar(props: {
  facets: FilterFacets;
  max: number;
  brands: string[];
  colours: ColourFamily[];
}) {
  // keyed on the URL's max so the slider's local state resets from the server
  // value without syncing a prop into state inside an effect
  return <FilterBarInner key={props.max} {...props} />;
}

function FilterBarInner({
  facets,
  max,
  brands,
  colours,
}: {
  facets: FilterFacets;
  max: number;
  brands: string[];
  colours: ColourFamily[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  // the readout follows the thumb on every input event; the URL update is
  // debounced so dragging does not push a history entry per pixel
  const [shownMax, setShownMax] = useState(max);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(next: URLSearchParams) {
    next.delete('page'); // any filter change resets to page 1
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function onPrice(value: number) {
    setShownMax(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value >= facets.priceTop) next.delete('max');
      else next.set('max', String(value));
      push(next);
    }, 180);
  }

  function toggle(key: 'brand' | 'colour', value: string) {
    const next = new URLSearchParams(params.toString());
    const current = next.getAll(key);
    next.delete(key);
    const after = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    after.forEach((v) => next.append(key, v));
    push(next);
  }

  const hasFilters =
    max < facets.priceTop || brands.length > 0 || colours.length > 0;

  return (
    <div className="filters">
      <div className="fgroup">
        <span className="flabel" id="f-price-label">
          PRICE
        </span>
        <p className="price-now">Up to {fmt(shownMax)}</p>
        <input
          className="price-slider"
          type="range"
          min={facets.priceFloor}
          max={facets.priceTop}
          step={500}
          value={shownMax}
          aria-labelledby="f-price-label"
          aria-valuetext={`Up to ${fmt(shownMax)}`}
          onChange={(e) => onPrice(Number(e.target.value))}
        />
        <div className="price-ends">
          <span>{fmt(facets.priceFloor)}</span>
          <span>{fmt(facets.priceTop)}</span>
        </div>
      </div>

      <div className="fgroup">
        <span className="flabel">BRAND</span>
        <div className="chips2">
          {facets.brands.length ? (
            facets.brands.map((b) => (
              <button
                key={b}
                className="chip2"
                aria-pressed={brands.includes(b)}
                onClick={() => toggle('brand', b)}
              >
                {b}
              </button>
            ))
          ) : (
            <span className="rangeval">No brands listed</span>
          )}
        </div>
      </div>

      <div className="fgroup">
        <span className="flabel">COLOUR</span>
        <div className="chips2">
          {facets.families.map((f) => (
            <button
              key={f}
              className="cswatch"
              style={{ background: FAMILY_HEX[f] }}
              title={f}
              aria-label={f}
              aria-pressed={colours.includes(f)}
              onClick={() => toggle('colour', f)}
            />
          ))}
        </div>
      </div>

      {hasFilters ? (
        <button
          className="clearf"
          onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
        >
          Clear filters
        </button>
      ) : (
        <span className="clearf" style={{ opacity: 0.4 }}>
          Clear filters
        </span>
      )}
    </div>
  );
}
