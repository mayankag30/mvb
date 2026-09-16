import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollectionBySlug, getFilterFacets } from '@/lib/data';
import type { ColourFamily } from '@/lib/data/types';
import ProductTile from '@/components/storefront/ProductTile';
import CollectionReveal from '@/components/storefront/CollectionReveal';
import FilterBar from '@/components/storefront/FilterBar';
import Pager from '@/components/storefront/Pager';
import SearchInput from '@/components/storefront/SearchInput';
import ClearLink from '@/components/storefront/ClearLink';

export const revalidate = 60;

/** Background per collection — COLLECTION_META in design-reference/index.html. */
const BG: Record<string, string> = {
  lehengas: 'radial-gradient(100% 70% at 50% 0%,#4A1430 0%,#2A0F26 48%,#180A1A 100%)',
  sarees: 'linear-gradient(180deg,#0B1030 0%,#17204E 42%,#2C2A5C 72%,#3A2A4E 100%)',
  suits: 'linear-gradient(180deg,#0E3A44 0%,#16565B 40%,#4E8E86 78%,#2A4A44 100%)',
  gowns: '#070509',
  extras: 'linear-gradient(180deg,#160F2E 0%,#1E1440 60%,#241748 100%)',
};

const FAMILIES: readonly ColourFamily[] = [
  'Red', 'Pink', 'Rust', 'Gold', 'Olive', 'Green',
  'Teal', 'Blue', 'Purple', 'Black', 'Grey', 'Ivory',
];

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const facets = await getFilterFacets(slug);
  if (!facets) notFound();

  // parse URL — anything unrecognised is ignored, never trusted
  const rawMax = Number(sp.max);
  const max =
    Number.isFinite(rawMax) && rawMax > 0
      ? Math.min(Math.max(rawMax, facets.priceFloor), facets.priceTop)
      : facets.priceTop;

  const brands = asArray(sp.brand).filter((b) => facets.brands.includes(b));
  const colours = asArray(sp.colour).filter((c): c is ColourFamily =>
    (FAMILIES as readonly string[]).includes(c) && facets.families.includes(c as ColourFamily),
  );

  const q = one(sp.q).trim();
  const rawPage = parseInt(one(sp.page), 10);
  const pageNum = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const result = await getCollectionBySlug(slug, {
    max: max < facets.priceTop ? max : null,
    brands,
    colours,
    q,
    page: pageNum,
  });
  if (!result) notFound();

  const hasFilters = max < facets.priceTop || brands.length > 0 || colours.length > 0;
  const hasSearch = q.length > 0;

  const from = (result.page - 1) * 12;

  return (
    <div className="cview-page">
      <div className="cview-bg" style={{ background: BG[slug] ?? 'var(--ink)' }} />
      <CollectionReveal slug={slug} />

      <div className="wrap cview-in">
        <div className="cv-top">
          <Link className="cv-back" href={`/#${slug}`}>
            Back to the front page
          </Link>
          <div className="cv-titlerow">
            <h1 className="cv-h">{result.collection.name}</h1>
            <div className="cv-tools">
              <div className="search">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="7" cy="7" r="5" />
                  <path d="M10.8 10.8L15 15" />
                </svg>
                <SearchInput
                  placeholder={`Search ${result.collection.name.toLowerCase()}`}
                  defaultValue={q}
                />
              </div>
              <span className="cv-count">
                {result.matched === 0
                  ? 'Nothing to show'
                  : result.matched > 12
                    ? `${from + 1}–${Math.min(from + 12, result.matched)} of ${result.matched} pieces`
                    : `${result.matched} of ${result.total} pieces`}
              </span>
            </div>
          </div>
        </div>

        <FilterBar
          facets={facets}
          max={max}
          brands={brands}
          colours={colours}
        />

        {result.items.length > 0 ? (
          <>
            <div className="rack">
              {result.items.map((item) => (
                <ProductTile key={item.id} item={item} />
              ))}
            </div>
            <Pager page={result.page} pages={result.pages} />
          </>
        ) : (
          <div className="no-match">
            <svg viewBox="0 0 62 78" aria-hidden="true">
              <path d="M5 77V33Q5 7 31 4Q57 7 57 33V77" />
              <path d="M31 4V0" />
              <path d="M22 14Q31 2 40 14" />
            </svg>
            <b>
              {hasSearch
                ? 'We could not find that one'
                : 'Nothing matches those filters'}
            </b>
            <p>
              {hasSearch
                ? `No ${result.collection.name.toLowerCase()} here match "${q}". Try a shorter word, or send us an enquiry — we carry more than we can list.`
                : 'Widen the price or let go of a colour to see more of this collection.'}
            </p>
            {(hasSearch || hasFilters) && <ClearLink />}
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const facets = await getFilterFacets(slug);
  if (!facets) return {};
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `${name} — Mahesh Vastra Bhandar`,
  };
}
