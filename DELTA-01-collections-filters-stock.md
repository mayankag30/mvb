# Delta 01 — Collection pages, filters, stock

This is an **increment on a completed build**, not a rebuild. `SPEC.md` has been updated; the authoritative detail is in **section 8c**, with two new columns in section 4 and five new items in the section 12 checklist.

Read this file, then section 8c, then start.

---

## Scope

Three additions:

1. Each collection on the front page gets a "See all N …" button that opens a full collection page with its own themed reveal
2. That page has working filters: price, brand, colour family
3. Every item carries a stock count, shown on the storefront and editable in the admin panel

Nothing else changes.

---

## Do not touch

The hero, the four collection worlds, the enquiry form, the map, the footer, the admin shell, auth, middleware, RLS policies, or the Cloudinary pipeline. All of it is already correct.

Front-page racks keep showing **four items each**. The change is the button underneath, not the rack.

If a file is not named in "Files to change" below, do not open it.

---

## Database — new migration, do not edit 0001

`0001_init.sql` has already run. Create the next free migration —
`supabase/migrations/0003_collections_filters_stock.sql`:

> **Migration numbers in this document mean "next free", not literal.** `0002`
> was already taken by `rls.sql`, which defines `is_staff()`. Two files both
> numbered `0002` applied in the right order only by alphabetical luck.
> The applied order is 0001 init · 0002 rls · 0003 this file · 0004 stock seed ·
> 0005 brands. See `supabase/migrations/README.md`.

```sql
-- stock
alter table items
  add column stock_qty    int not null default 0 check (stock_qty >= 0),
  add column low_stock_at int not null default 3 check (low_stock_at >= 0);

-- colour family, mirroring family() in design-reference/index.html
create or replace function public.colour_family(hex text)
returns text language plpgsql immutable strict as $$
declare r numeric; g numeric; b numeric;
        mx numeric; mn numeric; l numeric; d numeric; s numeric; h numeric;
begin
  r := ('x'||substr(hex,2,2))::bit(8)::int / 255.0;
  g := ('x'||substr(hex,4,2))::bit(8)::int / 255.0;
  b := ('x'||substr(hex,6,2))::bit(8)::int / 255.0;
  mx := greatest(r,g,b); mn := least(r,g,b);
  l  := (mx+mn)/2;  d := mx-mn;
  s  := case when d = 0 then 0 else d / (1 - abs(2*l - 1)) end;

  if l > 0.8  and s < 0.3  then return 'Ivory'; end if;
  if l < 0.18              then return 'Black'; end if;
  if s < 0.14              then return 'Grey';  end if;

  if    mx = r then h := 60 * (((g-b)/d) % 6);
  elsif mx = g then h := 60 * ((b-r)/d + 2);
  else              h := 60 * ((r-g)/d + 4);
  end if;
  if h < 0 then h := h + 360; end if;

  if h <  12 or h >= 340 then return 'Red';    end if;
  if h <  26 then return 'Rust';   end if;
  if h <  48 then return 'Gold';   end if;
  if h <  70 then return 'Olive';  end if;
  if h < 160 then return 'Green';  end if;
  if h < 200 then return 'Teal';   end if;
  if h < 255 then return 'Blue';   end if;
  if h < 290 then return 'Purple'; end if;
  return 'Pink';
end $$;

alter table item_colors add column family text
  generated always as (public.colour_family(hex)) stored;
create index on item_colors (family);
create index on items (collection_id, base_price);
```

The generated column backfills existing rows on creation — no separate backfill needed.

**After migrating, set stock on seeded rows.** Everything defaults to 0, so without this every item reads "Sold out":

```sql
update items set stock_qty = 4 + (abs(hashtext(id::text)) % 15);
update items set stock_qty = 0 where name in ('Raw Silk Mehendi Lehenga', 'Afghani Salwar Set');
```

---

## Brands become a table

`items.brand` is currently free text. That means a typo creates a second brand, renaming means editing every row, and the filter facets are built from whatever was typed. Promote it to a real table with a nullable foreign key.

Add `supabase/migrations/0005_brands.sql` (0004 is the stock seed):

```sql
create table brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);
create unique index brands_name_unique on brands (lower(trim(name)));

-- carry the existing free-text values across
insert into brands (name)
select distinct trim(brand) from items
where brand is not null and trim(brand) <> '';

alter table items add column brand_id uuid references brands(id) on delete set null;

update items i set brand_id = b.id
from brands b where lower(trim(i.brand)) = lower(trim(b.name));

alter table items drop column brand;
create index on items (brand_id);

alter table brands enable row level security;
create policy brands_public_read on brands for select to anon, authenticated using (true);
create policy brands_staff on brands for all to authenticated using (is_staff()) with check (is_staff());
```

**`on delete set null` is deliberate.** Deleting a brand must never delete stock — its items become unbranded and stay on the website. Before deleting, the admin panel shows how many items will be affected.

### Brand is optional

An item with no brand is normal, not an error — pieces stitched in-house or bought unbranded. `brand_id` is nullable, the form's default option is "No brand", and such items appear everywhere on the storefront with the brand line reserved but blank, exactly as the tile alignment rules require.

On the storefront, brand facets come from brands that actually occur in that collection. Items with no brand simply fall outside a brand filter — do not add an "Unbranded" chip, it reads oddly in a shop.

### New admin page

A **Brands** entry in the sidebar, between Add an item and Enquiries:

- table of brands with a live item count, each with Rename and Delete
- a final non-editable row showing how many items have no brand
- an Add a brand panel beside it
- renaming updates every item automatically, which is the entire point of the foreign key
- deleting asks for confirmation and states the number of items that will become unbranded

The item form's brand field becomes a **select** populated from `brands`, defaulting to "No brand" — not a free-text input. Free text is what created the problem.

---

## Files to change

### New

```
src/app/collections/[slug]/page.tsx        # Server Component, reads searchParams
src/components/storefront/CollectionReveal.tsx   # client — the themed veil
src/components/storefront/FilterBar.tsx          # client — price, brand, colour
```

### Modified

| File | Change |
|---|---|
| `components/storefront/ProductTile.tsx` | stock line with status dot; sold-out fabric dimming; button label switches to "Ask about restock" |
| `components/storefront/CollectionWorld.tsx` | "See all N …" button below the rack, themed per collection |
| `lib/data/types.ts` | `stock_qty`, `low_stock_at` on Item; `family` on ItemColor |
| `lib/data/supabase.ts` | `getCollectionBySlug(slug, filters)`, `getFilterFacets(slug)` |
| `lib/data/mock.ts` | same two functions, same shapes |
| `app/admin/inventory/page.tsx` | In Stock column; brand shows "No brand" when unset |
| `app/admin/brands/page.tsx` | **new** — list, add, rename, delete brands |
| `lib/data/*` | `getBrands()`, `createBrand()`, `renameBrand()`, `deleteBrand()` |
| `app/admin/inventory/new` + `[id]` | Pieces in stock, Low stock warning at; brand select |
| `app/admin/page.tsx` | Running low card |
| `app/globals.css` | new blocks from `design-reference/index.html`, copied verbatim |
| `app/admin/admin.css` | `.stk` blocks from `design-reference/admin.html`, copied verbatim |

---

## Behaviour that is easy to get wrong

**Filters go in the URL, not in React state.** `?max=40000&brand=Kumaran+Silks&colour=Red&colour=Teal`. The page is a Server Component reading `searchParams`; the filter bar updates the URL and lets the server re-render. A filtered view must be shareable and the back button must work.

**Filter in SQL.** Do not fetch the collection and `.filter()` in the browser. Verify in the network tab: the response contains filtered rows only.

**Slider bounds are derived**, from `min(base_price)` and `max(base_price)` in that collection, rounded out to the nearest 1000. Not hardcoded.

**Facets are derived too.** Only show brands and colour families that occur in that collection. A chip returning zero results is a bug.

**`colour_family()` and `family()` must agree.** Two implementations of one rule. Add a test that runs every hex in `item_colors` through both and asserts equality — this drifts silently otherwise.

**Sold-out items stay visible.** They are dimmed and their button changes, but they are not hidden and they still accept an enquiry. A restock enquiry is a real lead.

**The low-stock dot pulses slowly**, so urgency reads without shouting. Only that dot — not the green or grey ones, and never the text:

```css
.tile-stock.low i{animation:emberPulse 2.6s ease-in-out infinite}
@keyframes emberPulse{
  0%,100%{opacity:.45;box-shadow:0 0 0 0 rgba(224,85,63,0)}
  50%    {opacity:1;  box-shadow:0 0 0 4px rgba(224,85,63,.22)}
}
```

Disabled under `prefers-reduced-motion`. Do not add it to the admin inventory table — a blinking list is unusable to work in.

**Stock never decrements.** There are no orders. It changes only when staff edit it.

---

## The four reveals

Copy the keyframes from `design-reference/index.html` exactly. They are the identity of each page.

| Collection | Class | Effect | Duration |
|---|---|---|---|
| Lehengas | `veil-drape` | mandap curtain closes from both sides, then parts | 1.05s |
| Sarees | `veil-unfurl` | a band of silk sweeps diagonally across | 1.05s |
| Suits | `veil-mist` | hill mist lifts and clears upward | 1.0s |
| Gowns | `veil-iris` | spotlight iris opens from the centre of black | 0.95s |

Content fades in behind the veil at 0.5s over 0.55s. Run the veil on mount. All four disabled under `prefers-reduced-motion`.

---

## Two layout traps

### 1. Class name collisions

The price slider must **not** be called `.range`. In the prototype, `.range` was already the mountain-range SVG in the suits section:

```css
.hills{position:absolute;bottom:0;left:0;width:100%;height:62%;z-index:1}  /* was .range */
```

Because it was defined later in the stylesheet it won, and the price input silently became `position:absolute; bottom:0; width:100%` — it detached from its column and lay across the filter bar. It looked like a grid overflow and was not one.

In the Next.js build this class of bug is avoided with CSS Modules or scoped component styles. If you instead copy the CSS into one global stylesheet, keep the prototype's names: `.price-slider` for the input, `.hills` for the SVG. Grep the whole stylesheet for duplicate class names after porting.

Also keep `min-width: 0` on every filter-bar grid child. Grid items default to `min-width: auto`, which is a genuine hazard for a range input even without the collision.

### 2. Tiles must align across a row

Items have optional brands, so tile bodies have different content heights. Without care, the price row of an item with no brand sits higher than its neighbours and the row looks broken.

```css
.rack      { align-items:stretch }        /* NOT start — see below */
.tile      { display:flex; flex-direction:column }
.tile-body { display:flex; flex-direction:column; flex:1 }
.tile-brand{ min-height:18px }            /* reserved even when empty */
.tile-name { line-height:1.3; min-height:2.6em;
             display:-webkit-box; -webkit-line-clamp:2;
             -webkit-box-orient:vertical; overflow:hidden }
.tile-ask  { margin-top:auto }            /* button pinned to the bottom */
```

Two traps here, both of which produced visibly broken rows in the prototype:

**`align-items: start` on the rack breaks it.** Without stretch, each tile is only as tall as its content, so `margin-top:auto` has nothing to push against and the buttons land at different heights. Use `stretch` — the default. `auto-fill` is what stops short rows growing; `align-items` is a separate concern and must not be set to `start`.

**Item names run to one or two lines.** A one-line name lifts its price, stock line and button above its neighbours'. Reserve two lines with `min-height` and clamp longer names to two with `-webkit-line-clamp`.

Render the brand element **always**, with a non-breaking space when absent. Do not conditionally omit it. With the button pushed to the bottom by `margin-top:auto`, every card in a row ends on the same line whatever its content.

## Divergences already in the build — correct these too

The built `ProductTile` has drifted from the design. Fix it against `design-reference/index.html` while you are in the file:

| Built | Should be |
|---|---|
| "ENQUIRE ABOUT THIS" as underlined uppercase text | a bordered button: 1px gold border at 40%, `border-radius:2px`, 9px padding, sentence case "Enquire about this", filling gold on hover |
| Brand in uppercase (`MAHESH ATELIER`) | sentence case as entered (`MVB Atelier`) — uppercase labels are exactly the templated look section 0 rules out |
| `₹42,500 onwards` | `₹ 84,500` — space after the symbol, `toLocaleString('en-IN')`, no "onwards" |
| No stock line | stock line with status dot, per the table above |

```css
.tile-ask{margin-top:auto;width:100%;border:1px solid rgba(217,169,60,.4);padding:9px;
  border-radius:2px;font-size:12.5px;letter-spacing:.1em;color:var(--gold-lt);
  transition:background .3s,color .3s}
.tile-ask:hover{background:var(--gold);color:var(--ink);border-color:var(--gold)}
```

These are not preference changes. Copy is design content — when wording, casing or number format drifts, the design drifts with it.

---

## Pagination, search and the short-row fix

**Pagination.** 12 items per page. Controls centred below the grid: Previous, numbered pages, Next. Above 7 pages, collapse the middle with an ellipsis (`1 … 4 5 6 … 12`). Current page carries `aria-current="page"`. Changing page scrolls back to the top of the grid. Page resets to 1 whenever a filter or the search term changes — but not when paginating. In the real build, page is a URL param like the filters: `?page=3`.

**Search.** Every collection page has a search field, in the header row to the right of the title. It matches name, brand and badge, case-insensitive. In SQL use `ilike` across those columns; do not fetch and filter client-side.

**Button labels** drop the count: "See all lehengas", not "See all 10 lehengas". A count that changes as stock moves makes the label noisy, and the real count already shows in the header.

**Extras is a real collection after all.** It gets items, a dedicated page, search and the same filters — this reverses the earlier "static strip" decision. The six-card strip stays on the front page as signposting, with a "See all extras" button below it. Extras needs its own reveal: `veil-casket`, a jewel box opening — two panels part vertically, 1s, distinct from the lehenga curtain which parts horizontally.

**Tiles must not grow when a row is short.** `repeat(auto-fit, …)` stretches a lone item across the full width; a two-item row rendering at double size looks broken. Use `auto-fill`:

```css
.rack{display:grid;grid-template-columns:repeat(auto-fill,minmax(224px,1fr));gap:26px;align-items:start}
```

`auto-fill` keeps the empty tracks, so a tile is the same size whether the row holds one item or four.

**Empty state.** Distinguish the two cases. No filter matches: "Nothing matches those filters" with advice to widen. No search match: "We could not find that one", naming the term, suggesting a shorter word and offering an enquiry, because a search miss is a sales lead. Both sit under a drawn mehrab arch outline in gold at 50% opacity, with a Clear everything button.

## Responsive requirements

Both reference files now carry the full breakpoint set. Port them and verify at these widths.

### Storefront — every device

| Width | Device | Behaviour |
|---|---|---|
| 280 | Z-fold / tri-fold, folded | single column, `.wrap` 94vw, hero 54px, reduced padding |
| 344–390 | small phones, iPhone mini | single column tiles, extras strip 2-up |
| 412–599 | large phones | stacked form rows, full-width search |
| 600–899 | unfolded foldables, tablet portrait, iPad | filters in two columns, nav still drawer + rail |
| 900–1279 | tablet landscape, iPad Pro, small laptops | full nav, filters in four columns, sticky panel |
| 1280–1599 | laptops, MacBook | `.wrap` 1180px |
| 1600–1999 | large monitors | `.wrap` 1340px, tiles minmax 250px |
| 2000+ | up to 32 inch, 4K | `.wrap` 1560px, tiles minmax 272px, taller sections, 18px body |

Plus `@media (max-height:520px) and (orientation:landscape)` for phones and foldables turned sideways: the hero drops its `100svh` minimum and the scroll cue is hidden, otherwise nothing but the hero fits on screen.

Foldables change width without a reload, so layout must respond to resize rather than to a load-time measurement. Do not branch on user agent.

### Admin — tablet and up

| Width | Behaviour |
|---|---|
| ≤900 | sidebar becomes a horizontally scrolling top bar, active item underlined |
| 901–1100 | sidebar 188px, form panels stack to one column |
| 1101–1280 | sidebar 212px |
| 1281–1599 | full layout, main capped at 1180px |
| 1600+ | main 1420px |
| 2000+ | main 1680px, larger headings |

Wide tables scroll horizontally inside their panel rather than squashing — the inventory table has ten columns and cannot fit a tablet. `min-width:720px` on the table, `overflow-x:auto` on the wrapper. Never hide columns to make it fit; staff need the stock and visibility columns most on a small screen.

### Checking it

Test at the real widths, not by dragging a window: 280, 360, 390, 412, 768, 820, 1024, 1280, 1440, 1920, 2560. The foldable widths are the ones that break — 280 folded and 717 unfolded are both outside the usual set.

## Filter panel layout

A bordered panel, not a full-bleed band. Content must never sit against the panel edge.

```css
.filters{display:grid;grid-template-columns:260px 1fr 1fr auto;gap:36px;align-items:start;
  position:sticky;top:14px;z-index:30;
  background:rgba(16,10,36,.95);backdrop-filter:blur(16px);
  border:1px solid rgba(217,169,60,.24);border-radius:3px;
  padding:26px 32px 28px;margin-bottom:40px;
  box-shadow:0 20px 44px -30px rgba(0,0,0,.9)}
```

### Price control

Three parts, in this order: the current value as a serif line above the slider, the slider, then the collection's minimum and maximum at the two ends beneath it. The value updates on every `input` event, not on release.

```
PRICE
Up to ₹ 62,000          <- .price-now, Marcellus 20px, gold-light
[--------o---------]    <- .price-slider
₹ 16,000      ₹ 92,000  <- .price-ends, 11.5px, muted
```

Both end values are derived from the collection, rounded out to the nearest 1000.

### Page header

The back link sits on **its own line, top left**, above the title — not inline beside it. Below it, the collection name and the result count share one row, name left, count right.

### Filter bar on mobile

Under 900px the panel is static rather than sticky, single column, `padding: 6px 20px 20px`, each group separated by a hairline rule, 34px colour swatches, 30px slider, and Clear filters as a full-width button at the bottom.

---

## Done when

- [ ] `/collections/sarees` renders every saree; the front page still shows four
- [ ] Each of the four reveals is visually distinct
- [ ] Price, brand and colour filters work, combine, and survive a page refresh
- [ ] Filter bar does not overlap the grid at 1280px
- [ ] Nothing in the filter panel touches its border
- [ ] Price readout updates while dragging; min and max both shown
- [ ] Back link is on its own line above the collection title
- [ ] Enquire is a bordered button, sentence case, not underlined text
- [ ] No duplicate class names in the ported stylesheet
- [ ] Every tile in a row ends on the same line — with and without a brand, and with one-line and two-line names
- [ ] Stock line correct in all three states; sold-out dimmed with the restock label
- [ ] Low-stock dot pulses; green and grey dots do not; admin table does not
- [ ] A row with one or two items renders them at the same size as a full row
- [ ] Pagination at 12 per page; page resets on filter change, not on paging
- [ ] Search matches name, brand and badge, in SQL
- [ ] Search miss and filter miss show different empty states
- [ ] Extras has its own page with the veil-casket reveal
- [ ] Storefront checked at 280, 360, 412, 768, 1024, 1280, 1920, 2560
- [ ] Nothing overflows horizontally at 280px
- [ ] Hero usable on a phone in landscape
- [ ] Admin checked at 768, 1024, 1440, 2560; inventory table scrolls rather than squashing
- [ ] No user-agent branching anywhere
- [ ] Renaming a brand updates every item using it
- [ ] Deleting a brand leaves its items in place, unbranded, and warns first with a count
- [ ] An item can be saved with no brand, and renders correctly on the storefront
- [ ] Brand facets come from `brands`, with no "Unbranded" chip
- [ ] Admin can change stock and the storefront reflects it
- [ ] `colour_family()` matches `family()` for every hex in the catalogue
- [ ] Network tab shows filtered rows, not the whole collection
- [ ] Nothing outside "Files to change" was modified — confirm with `git diff --stat`
