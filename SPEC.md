# MVB — Build Specification

Storefront and admin panel for **Mahesh Vastra Bhandar**, a women's Indian ethnic wear shop on Chandra Shekhar Azad Road, Manik Chowk, Jhansi, Uttar Pradesh 284002.

Browsing only. No cart, no checkout, no payments. Customers browse collections and submit an enquiry; staff follow up on WhatsApp.

---

## 0. The one rule that overrides everything

**The design is finished and approved. Do not redesign it.**

`design-reference/index.html` and `design-reference/admin.html` are the source of truth for every colour, font, animation, spacing value, shape and piece of copy. Your job is to port them to Next.js and connect them to a database — not to improve them.

Specifically, do not:

- swap fonts, adjust the type scale, or change letter-spacing
- alter any hex value, gradient stop, or gradient angle
- change animation durations, delays or easing curves
- replace the arch-shaped product frames with rectangles or rounded cards
- introduce a component library (shadcn, MUI, DaisyUI, Headless UI) — it will drag in its own styles
- add shadows, borders, hover effects or section reveals that are not already there
- reword headings, button labels, form labels or body copy

If a requirement seems to need a visual change, stop and ask rather than deciding.

**Porting method:** copy the CSS verbatim into `globals.css` (the storefront block) and `admin.css` (the admin block). Keep the existing class names. Tailwind is installed for layout convenience on *new* scaffolding only — do not rewrite existing styles as utility classes. Verify by screenshotting the running app beside the reference file; they should be indistinguishable.

---

## 1. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | Server Components by default |
| Styling | Plain CSS ported from the reference + Tailwind for new layout only | |
| Database | Supabase Postgres | region `ap-south-1` (Mumbai) |
| Auth | Supabase Auth, email + password | public signup disabled |
| Media | Cloudinary | signed uploads only |
| Map | OpenStreetMap iframe embed | no API key |
| Bot protection | Cloudflare Turnstile | free, unlimited |
| Hosting | Vercel | |

Everything above has a free tier that comfortably covers a single shop. The only recurring cost is the domain.

---

## 2. Environment variables

```bash
# .env.local — never commit this file

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only, never import into a client component

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=            # server only

NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=             # server only
```

Add a `.env.example` with the keys and blank values. Confirm `.env.local` is in `.gitignore` before the first commit.

Any variable without the `NEXT_PUBLIC_` prefix must only ever be read inside a Server Component, Server Action or Route Handler. If one appears in a file carrying `"use client"`, that is a leak.

---

## 3. Folder structure

```
src/
  app/
    layout.tsx
    globals.css                    # storefront CSS, ported verbatim
    page.tsx                       # storefront — Server Component
    actions/
      enquiry.ts                   # "use server" — public enquiry submission
    api/
      cloudinary-sign/route.ts     # returns a signed upload payload, staff only
    admin/
      admin.css                    # admin CSS, ported verbatim
      layout.tsx                   # sidebar shell, guards the session
      page.tsx                     # dashboard
      login/page.tsx               # public, outside the guard
      inventory/page.tsx
      inventory/new/page.tsx
      inventory/[id]/page.tsx      # edit
      enquiries/page.tsx
      shop/page.tsx
      staff/page.tsx
      actions/                     # "use server" — all admin mutations
        items.ts
        enquiries.ts
        shop.ts
  components/
    storefront/
      Nav.tsx                      # client — scroll state, drawer, section rail
      Hero.tsx                     # server shell + client loom SVG
      CollectionWorld.tsx          # server, one per collection
      ProductTile.tsx              # client — colour swatch switching
      EnquiryForm.tsx              # client — Turnstile + Server Action
      VisitMap.tsx
      Footer.tsx
    admin/
      Sidebar.tsx
      StatusSelect.tsx             # client
      VisibilityToggle.tsx         # client
      MediaUploader.tsx            # client
  lib/
    supabase/
      server.ts                    # cookie-based server client (anon key)
      admin.ts                     # service-role client, server only
      middleware.ts                # session refresh helper
    cloudinary.ts
    turnstile.ts
    types.ts                       # generated from the DB schema
middleware.ts                      # protects /admin/*
design-reference/
  index.html
  admin.html
supabase/
  migrations/
```

---

## 4. Database schema

The consolidated shape after every migration. It is **not** a single file to run —
`items.brand_id` references `brands`, which migration 0005 creates, and `0001`
created `items.brand` as free text. Apply `supabase/migrations/*` in numeric
order instead; see the README there.

```sql
-- ---------- enums ----------
create type enquiry_status as enum (
  'arrived', 'contacted', 'in_discussion', 'order_placed', 'resolved', 'closed'
);
create type media_kind as enum ('image', 'video');

-- ---------- staff ----------
create table staff (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------- collections ----------
create table collections (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,          -- lehengas, sarees, suits, gowns, extras
  name          text not null,
  tagline       text,                          -- the world-tag line
  heading       text,                          -- the world-h line
  blurb         text,                          -- the world-p paragraph
  display_order int not null default 0,
  is_visible    boolean not null default true
);

-- ---------- items ----------
create table items (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete restrict,
  name          text not null,
  brand_id      uuid references brands(id) on delete set null,   -- optional; added by 0005, see delta 01
  base_price    numeric(10,2) not null check (base_price >= 0),
  base_color    text not null check (base_color ~ '^#[0-9A-Fa-f]{6}$'),
  badge         text,
  description   text,
  stock_qty     int not null default 0 check (stock_qty >= 0),
  low_stock_at  int not null default 3 check (low_stock_at >= 0),
  is_visible    boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on items (collection_id, display_order);
create index on items (is_visible);

-- ---------- item colours ----------
create table item_colors (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references items(id) on delete cascade,
  name          text not null,
  hex           text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  display_order int not null default 0
);
create index on item_colors (item_id, display_order);

-- ---------- item media ----------
create table item_media (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references items(id) on delete cascade,
  public_id     text not null,                 -- Cloudinary public_id
  url           text not null,
  kind          media_kind not null default 'image',
  is_cover      boolean not null default false,
  display_order int not null default 0
);
create index on item_media (item_id, display_order);
create unique index one_cover_per_item on item_media (item_id) where is_cover;

-- ---------- enquiries ----------
create table enquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 2 and 80),
  email      text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone      text,
  whatsapp   text not null check (char_length(whatsapp) between 8 and 20),
  interest   text,
  message    text check (message is null or char_length(message) <= 1000),
  item_id    uuid references items(id) on delete set null,
  status     enquiry_status not null default 'arrived',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on enquiries (status, created_at desc);
create index on enquiries (created_at desc);

-- ---------- enquiry notes / audit trail ----------
create table enquiry_notes (
  id          uuid primary key default gen_random_uuid(),
  enquiry_id  uuid not null references enquiries(id) on delete cascade,
  note        text,
  status_from enquiry_status,
  status_to   enquiry_status,
  staff_id    uuid references staff(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index on enquiry_notes (enquiry_id, created_at desc);

-- ---------- shop settings (single row) ----------
create table shop_settings (
  id         boolean primary key default true check (id),   -- enforces exactly one row
  name       text not null default 'Mahesh Vastra Bhandar',
  address    text not null,
  whatsapp   text not null,
  phone      text,
  email      text,
  hours      text,
  lat        numeric(9,6) not null,
  lng        numeric(9,6) not null,
  updated_at timestamptz not null default now()
);

-- ---------- updated_at trigger ----------
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger t_items    before update on items         for each row execute function touch_updated_at();
create trigger t_enq      before update on enquiries     for each row execute function touch_updated_at();
create trigger t_shop     before update on shop_settings for each row execute function touch_updated_at();
```

---

## 5. Row Level Security

This is the actual security boundary. Middleware and hidden URLs are convenience; RLS is what stops a stranger with the anon key and `curl` from reading your customers' phone numbers.

```sql
alter table staff          enable row level security;
alter table collections    enable row level security;
alter table items          enable row level security;
alter table item_colors    enable row level security;
alter table item_media     enable row level security;
alter table enquiries      enable row level security;
alter table enquiry_notes  enable row level security;
alter table shop_settings  enable row level security;
```

RLS with no policy means deny-all. Everything below is added back deliberately.

```sql
-- helper: is the caller active staff?
-- security definer so it can read `staff` while `staff` itself stays locked
create or replace function public.is_staff() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from staff where id = auth.uid() and is_active)
$$;
revoke execute on function public.is_staff() from anon;
grant  execute on function public.is_staff() to authenticated;
```

### Public catalogue — read only, visible rows only

```sql
create policy collections_public_read on collections
  for select to anon, authenticated
  using (is_visible);

create policy items_public_read on items
  for select to anon, authenticated
  using (
    is_visible
    and exists (select 1 from collections c where c.id = collection_id and c.is_visible)
  );

create policy item_colors_public_read on item_colors
  for select to anon, authenticated
  using (exists (select 1 from items i where i.id = item_id and i.is_visible));

create policy item_media_public_read on item_media
  for select to anon, authenticated
  using (exists (select 1 from items i where i.id = item_id and i.is_visible));

create policy shop_public_read on shop_settings
  for select to anon, authenticated using (true);
```

A hidden item is invisible to the API, not merely filtered out in the UI. `?is_visible=eq.false` returns nothing.

### Staff — full control

```sql
create policy collections_staff on collections   for all to authenticated using (is_staff()) with check (is_staff());
create policy items_staff       on items         for all to authenticated using (is_staff()) with check (is_staff());
create policy colors_staff      on item_colors   for all to authenticated using (is_staff()) with check (is_staff());
create policy media_staff       on item_media    for all to authenticated using (is_staff()) with check (is_staff());
create policy enq_staff         on enquiries     for all to authenticated using (is_staff()) with check (is_staff());
create policy notes_staff       on enquiry_notes for all to authenticated using (is_staff()) with check (is_staff());
create policy shop_staff_write  on shop_settings for update to authenticated using (is_staff()) with check (is_staff());

-- staff can read the roster, nobody can edit it from the client
create policy staff_read on staff for select to authenticated using (is_staff());
```

### Enquiries — no public access at all

Anonymous visitors get **no** policy on `enquiries`, not even insert. Submission goes through a Server Action that verifies Turnstile first and then writes with the service-role key. Consequences worth having:

- a bot cannot POST straight to the REST endpoint, because anon has no insert grant
- `status` cannot be forged, because the action never reads it from the form
- the Turnstile check cannot be skipped

Belt and braces — reject the obvious flood even if the action is somehow bypassed:

```sql
create or replace function check_enquiry_rate() returns trigger
language plpgsql as $$
begin
  if (select count(*) from enquiries
      where whatsapp = new.whatsapp and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'Too many enquiries from this number. Please wait a few minutes.';
  end if;
  return new;
end $$;

create trigger t_enq_rate before insert on enquiries
  for each row execute function check_enquiry_rate();
```

### Verify before shipping

With only the anon key, each of these must return empty or an error:

```bash
curl "$URL/rest/v1/enquiries?select=*"              -H "apikey: $ANON"   # [] — no policy
curl "$URL/rest/v1/staff?select=*"                  -H "apikey: $ANON"   # [] — no policy
curl "$URL/rest/v1/items?is_visible=eq.false"       -H "apikey: $ANON"   # [] — filtered by RLS
curl -X POST "$URL/rest/v1/enquiries" -H "apikey: $ANON" -d '{...}'      # 401/403
curl -X PATCH "$URL/rest/v1/items?id=eq.<id>" -H "apikey: $ANON" -d '{"is_visible":true}'  # 401/403
```

If any of those returns data, stop and fix the policy before going further.

---

## 6. Auth

1. Supabase dashboard → Authentication → Providers → **disable email signup**. Accounts are created by hand only.
2. Create exactly two users in the dashboard. Use real addresses so password reset works.
3. Insert the matching `staff` rows with the same UUIDs.
4. Supabase hashes passwords with bcrypt. **Do not write your own hashing, salting, or password comparison.** Do not store a password column anywhere.
5. Set minimum password length to 12 in Auth settings.
6. Leave email confirmation on.

`middleware.ts` refreshes the session and redirects unauthenticated requests from `/admin/*` to `/admin/login`. Treat it as routing convenience — the RLS policies are what actually protect the data.

The admin layout additionally calls `is_staff()` server-side and renders nothing if it returns false, so a user who exists in `auth.users` but not in `staff` gets no panel.

### The stub authenticator must never reach production

Before step 13 the session is an unsigned cookie (`mvb_dev_session=1`). Anyone who sets it in devtools obtains the entire admin panel — every customer's phone number included. That is acceptable on localhost and nowhere else.

`middleware.ts` therefore **fails closed**: when `NODE_ENV === 'production'` and `DATA_SOURCE !== 'supabase'`, every `/admin/*` request returns a bare 404. Not 500, and not a login page — a 404 does not advertise that an admin panel exists.

```ts
if (process.env.NODE_ENV === 'production' && process.env.DATA_SOURCE !== 'supabase') {
  return new NextResponse(null, { status: 404 });
}
```

**The check belongs in middleware, not in a page or layout.** Two reasons, both found the hard way:

- Next renders a layout and its page in parallel. A `notFound()` in the layout sets the status code, but the page has already produced its RSC payload — an unauthorised request still received customer phone numbers in the body of the 404. Middleware returns before anything renders.
- `process.env.DATA_SOURCE` read inside a page or layout is inlined at **build** time, so it reports whatever the build environment had rather than the deployment's. Middleware reads it at runtime.

The admin layout keeps a secondary check as defence in depth, in case the middleware matcher is ever narrowed.

**Keep this guard after step 13.** Once Supabase Auth is wired it is inert, which makes it a regression test: if anyone reintroduces a stub authenticator, or deploys with `DATA_SOURCE` unset, this is what fails — loudly — instead of quietly serving customer data. `src/lib/data/stub-guard.test.ts` covers all six cases.

### Never expose the dev server beyond localhost

`npm run dev` binds to `127.0.0.1` (`next dev -H 127.0.0.1`). In dev mode Next inlines the RSC payload into redirect and error responses for hot reload, so an unauthenticated `curl` to `/admin/enquiries` can read customer data out of a 307 body that a browser would never display. Production builds do not do this — the same responses are a few dozen bytes — but the dev server must not be reachable from a shared network.

---

## 7. Media pipeline

Cloudinary, signed uploads only. An unsigned preset lets anyone on the internet upload into your account.

1. Client picks files in `MediaUploader.tsx`.
2. Client calls `POST /api/cloudinary-sign`.
3. The route handler verifies the caller is staff, then returns a signature scoped to folder `mvb/items`, `resource_type` matching the file, and a short expiry.
4. Client uploads straight to Cloudinary with that signature.
5. Client sends the returned `public_id` and `secure_url` to a Server Action, which writes the `item_media` row.

Limits enforced in the route handler, not only in the browser:

- images: JPEG, PNG or WebP, max 5 MB
- video: MP4, max 30 seconds, max 40 MB
- reject anything else with a clear message

Serve images through Cloudinary transformations (`f_auto,q_auto,w_800`) so the free bandwidth lasts. Deleting an item should delete its Cloudinary assets in the same Server Action.

---

## 8. Data flow

### Storefront — `app/page.tsx`, a Server Component

One query per page load, cached:

```ts
const { data: collections } = await supabase
  .from('collections')
  .select(`
    id, slug, name, tagline, heading, blurb, display_order,
    items ( id, name, brand, base_price, base_color, badge, display_order,
            item_colors ( name, hex, display_order ),
            item_media ( url, kind, is_cover, display_order ) )
  `)
  .order('display_order')
  .order('display_order', { referencedTable: 'items' });
```

Shop settings load in the same pass and feed the Visit section, the footer and the floating WhatsApp link. Use `export const revalidate = 60` so edits appear within a minute without hammering the database.

Hidden items never reach the browser — RLS filters them at the database, so there is no client-side `.filter()` to forget.

### Enquiry submission — `app/actions/enquiry.ts`

```
"use server"
1. validate the payload with Zod
2. POST the Turnstile token to Cloudflare's siteverify endpoint — abort on failure
3. insert with the service-role client, setting only:
   name, email, phone, whatsapp, interest, message, item_id
   (status is left to its default)
4. return { ok: true } — never echo back the inserted row
```

Never trust `status` or `id` from the form. Never return the enquiry list to a public caller.

### Admin mutations

Every write is a Server Action using the **cookie-bound anon client**, not the service role. That way RLS still applies and a bug in an action cannot escalate into unrestricted database access. Reserve the service role for the enquiry insert alone.

Status changes write an `enquiry_notes` row capturing `status_from`, `status_to`, the optional comment and `staff_id`, so there is a record of who moved what.

---

## 8b. Building before the database exists

The database is connected in Phase 2. Phase 1 runs entirely on mock data. This only works if the data layer is shaped correctly from the first file — otherwise the swap becomes a rewrite.

### The contract

```
src/lib/data/
  types.ts        # mirrors the schema in section 4, exactly
  index.ts        # picks an implementation from DATA_SOURCE
  mock.ts         # Phase 1 — hardcoded, still async
  supabase.ts     # Phase 2 — real queries
  session.ts      # getSession() / requireStaff()
```

```ts
// index.ts
const impl = process.env.DATA_SOURCE === 'supabase'
  ? await import('./supabase')
  : await import('./mock');

export const {
  getCollectionsWithItems,   // storefront page
  getShopSettings,
  getItem, listItems, createItem, updateItem, deleteItem,
  listEnquiries, updateEnquiryStatus,
  createEnquiry,
} = impl;
```

`DATA_SOURCE=mock` in `.env.local` during Phase 1; delete the line in Phase 2.

### Three rules that make the swap a one-file change

1. **Every function is `async`**, even in `mock.ts` where nothing is awaited. Components `await` from the start. Mock data that is synchronous forces a restructure of every caller later.
2. **Server Components stay Server Components.** Mock data is fetched on the server exactly as database rows will be. Do not import mock arrays directly into components — always go through `lib/data`.
3. **Return shapes match the schema exactly** — same field names, same types, `snake_case` as in Postgres, nullable where the column is nullable. `mock.ts` seeds from the `ITEMS` object in `design-reference/index.html`.

### Stubbed auth

`session.ts` in Phase 1:

```ts
export async function getSession() {
  return process.env.DATA_SOURCE === 'supabase'
    ? realSupabaseSession()
    : { user: { id: 'dev-staff-1', email: 'dev@local' }, staff: { display_name: 'Priya', is_active: true } };
}
export async function requireStaff() { /* redirect to /admin/login if absent */ }
```

`middleware.ts` and the admin layout call `requireStaff()` from day one. The guard is real from the first commit; only what it checks against changes.

**The stub is localhost-only, and enforced as such.** The cookie it sets is unsigned, so it is not an authenticator — it is a placeholder shaped like one. `middleware.ts` returns 404 for every `/admin/*` route when `NODE_ENV === 'production'` and `DATA_SOURCE !== 'supabase'`, so the stub cannot reach a deployment even by accident. See §6.

### Write the migration early anyway

Create `supabase/migrations/0001_init.sql` during Phase 1 even though nothing runs it. Writing the DDL is what forces `types.ts` to be correct, and a mismatch found now costs minutes rather than a day of debugging in Phase 2.

### What genuinely waits

Supabase account, Cloudinary account, Turnstile keys, RLS policies and their verification, deployment. None of it blocks Phase 1.

Media in Phase 1: `MediaUploader.tsx` accepts a file, shows a local `URL.createObjectURL` preview, and calls a mock `uploadMedia()` returning a placeholder URL. The component's interface does not change in Phase 2.

---

## 8c. Collection pages, filters and stock

The front page shows the **first four items** of each collection by `display_order`. Below each rack is a "See all <collection>" button opening the full collection — no count in the label. Extras is a collection too: the six-card strip stays on the front page, with the same button below it.

### Route

`/collections/[slug]` — a Server Component. Filters live in URL search params, so a filtered view is shareable and the back button works:

```
/collections/sarees?max=40000&brand=Kumaran+Silks&colour=Red&colour=Teal
```

The prototype implements this as an overlay only because it is a single file. In the real build it is a route. The visual result must match: same background as the parent section, same filter bar, same arch tiles.

### Filter in SQL, not in the browser

Do not ship the whole catalogue to the client and filter with JavaScript.

```ts
let q = supabase.from('items')
  .select('*, item_colors(*), item_media(*)')
  .eq('collection_id', collection.id)
  .order('display_order');

if (max)           q = q.lte('base_price', max);
if (brands.length) q = q.in('brand', brands);
```

Slider bounds come from `min(base_price)` and `max(base_price)` within that collection, rounded out to the nearest 1000. Never hardcode them.

### Colour families

Shoppers filter by colour name, not hex. The prototype derives a family from each hex at runtime — see `family()` in `design-reference/index.html`. Port it to PL/pgSQL and use a generated column so filtering stays in the database:

```sql
alter table item_colors add column family text
  generated always as (public.colour_family(hex)) stored;
create index on item_colors (family);
```

Use the same thresholds as the JS version: Ivory when lightness > 0.8 and saturation < 0.3; Black below 0.18 lightness; Grey below 0.14 saturation; otherwise hue buckets at 12, 26, 48, 70, 160, 200, 255, 290 and 340 degrees. **The two implementations must agree.** If they drift, the swatch a shopper taps will not match the results returned.

Only offer brands and colour families that actually occur in that collection. A chip that returns nothing is a bug.

### Themed reveal per collection

Each collection opens with its own animation. These are the identity of the page, not decoration — keep all four distinct:

| Collection | Animation | Duration |
|---|---|---|
| Lehengas | `veil-drape` — mandap curtain closes from both sides, then parts | 1.05s |
| Sarees | `veil-unfurl` — a band of silk sweeps diagonally across | 1.05s |
| Suits | `veil-mist` — hill mist lifts and clears upward | 1.0s |
| Gowns | `veil-iris` — spotlight iris opens from the centre of black | 0.95s |
| Extras | `veil-casket` — jewel box opens, two panels parting vertically | 1.0s |

Content fades in behind the veil at 0.5s over 0.55s. On a route transition, run the veil on mount. All four are disabled under `prefers-reduced-motion`.

### Filter bar layout

`position: sticky; top: 0` with an opaque blurred background, inside the scroll container. Grid columns `230px 1fr 1fr auto`, collapsing to one column under 900px.

**Every grid child needs `min-width: 0`.** Grid items default to `min-width: auto`, which is a hazard for a range input inside a sized column.

**Do not name the price input `.range`.** That name already belongs to the mountain SVG in the suits section (now renamed `.hills`), and the later rule silently made the slider `position:absolute`. Use `.price-slider`. After porting the CSS, grep for duplicate class names.

### Tiles align across a row

Brands are optional, so tile bodies differ in height. Reserve the brand line and pin the button to the bottom, or rows look broken:

```css
.tile{display:flex;flex-direction:column}
.tile-body{display:flex;flex-direction:column;flex:1}
.tile-brand{min-height:18px}
.tile-ask{margin-top:auto}
```

Render the brand element always, with a non-breaking space when absent.

### Stock display

`stock_qty` is maintained from the admin panel and appears on every tile with a status dot:

| Condition | Text | Dot |
|---|---|---|
| `stock_qty = 0` | Sold out — ask us when it returns | `#5B5378` |
| `stock_qty <= low_stock_at` | Only N left | `#E0553F`, slow pulse (`emberPulse`, 2.6s) |
| otherwise | N in stock | `#4FA87A` |

Sold-out tiles get `filter: saturate(.35) brightness(.6)` on the fabric and their button reads "Ask about restock" — still an enquiry. Sold-out items are **not** hidden; a restock enquiry is a real lead.

Stock is display-only on the storefront. Nothing decrements it, because there are no orders. It changes only when staff edit it.

### Admin additions

- Inventory table gains an **In Stock** column: amber "RUNNING LOW" at or below the threshold, red "SOLD OUT" at zero
- Add and edit forms gain **Pieces in stock** and **Low stock warning at**
- Dashboard gains a **Running low** card counting items at or below their threshold

---

## 9. Design tokens

Ported verbatim. Do not adjust.

### Storefront palette

```css
--ink:      #140F2E    /* page base */
--ink2:     #221944
--ink3:     #2E2356
--gold:     #D9A93C    /* zari */
--gold-lt:  #F2D98B
--rani:     #C21E56
--teal:     #0F6B62
--marigold: #EE8B2A
--ivory:    #F6EFE2
--ivory-dim:#E4D9C4
```

### Admin palette

```css
--paper: #F6F3EC   --line: #DDD5C6   --txt: #2A2140   --mute: #6E6187
```

### Type

- Display: **Marcellus** 400 — brand, headings, product names, stat figures
- Body: **Jost** 300 / 400 / 500 — everything else
- Load via `next/font/google` with `display: swap`
- Body weight is 300; do not bump it to 400

### Collection backgrounds

```css
#lehengas { radial-gradient(100% 70% at 50% 0%, #4A1430, #2A0F26 48%, #180A1A) }
#sarees   { linear-gradient(180deg, #0B1030, #17204E 42%, #2C2A5C 72%, #3A2A4E) }
#suits    { linear-gradient(180deg, #0E3A44, #16565B 40%, #4E8E86 78%, #DCCBA4) }
#gowns    { #070509 + conic spotlight + diagonal bars }
#extras   { linear-gradient(180deg, #160F2E, #1E1440) }
#enquire  { #F6EFE2 }
#visit    { #140F2E }
```

Each world's scenery (mandap garland, city skyline, mountain range, spotlight) is generated in SVG/CSS at runtime. It uses no image files and costs nothing to host — keep it that way.

### Hero sequence — exact timings

| t | Event |
|---|---|
| 0s | warp threads fade to 16% opacity |
| 0.5s | outer arch draws, 2.6s `cubic-bezier(.65,0,.35,1)` |
| 0.9s | inner arch draws |
| 1.0s | shuttle sweeps across, 2.2s |
| 1.3s | finial draws |
| 1.5s | **MVB** wipes in left to right, 1.5s `cubic-bezier(.76,0,.24,1)` |
| 2.7s | kicker fades up |
| 2.85s | full shop name fades up |
| 3.0s | subtitle fades up |
| 3.3s | buttons fade up |
| 3.2s+ | gold sheen loops across the monogram every 7s |
| 3.8s | scroll cue fades up |

The loom SVG needs `"use client"` because the warp lines and petals are generated in JS. Everything else in the hero stays a Server Component.

### Product tile

- `aspect-ratio: 3/4.1`
- `border-radius: 140px 140px 4px 4px` — the mehrab arch, not a rounded card
- 1px gold border at 45% opacity, 5px inset ink shadow
- hover: `translateY(-6px)` plus a deeper shadow
- when a colour dot is tapped, the fabric gradient swaps; if that colour has its own photo, show it instead
- `tile-fab::after` is the zari border stripe at the hem — keep it

### Navigation

- Top bar turns solid past 80px of scroll
- Section rail appears past `innerHeight * 0.72`, mobile only, `translateY(64px)`
- Active pill tracks the section via IntersectionObserver, `rootMargin: -45% 0px -45% 0px`
- Drawer links stagger in at 45ms intervals
- No enquiry button in the top bar — it lives in the drawer and the rail

### Accessibility floor — already built, keep it

- `prefers-reduced-motion: reduce` disables every animation
- Visible focus rings, `2px solid var(--gold-lt)`, 3px offset
- `aria-pressed` on colour dots and visibility toggles
- All form inputs have real `<label>` elements

---

## 10. Seed data

Migrate the demo content from `design-reference/index.html` (the `ITEMS` object) into a seed migration: **5 collections and 54 items** with their colours — lehengas, sarees and suits have 10 each, gowns 8, extras 16. It gives you a populated site from the first run and something to test RLS against. Replace with real inventory later through the admin panel.

Seed `shop_settings` with the real shop details:

- name: Mahesh Vastra Bhandar
- address: Chandra Shekhar Azad Road, Manik Chowk, Jhansi, Uttar Pradesh 284002
- lat `25.461039`, lng `78.579234`

Phone, WhatsApp and email in the reference files are still placeholders — replace them with the shop's real numbers before launch.

---

## 11. Build order

### Phase 1 — everything except the database

No accounts needed. No keys. `DATA_SOURCE=mock`.

1. Scaffold Next.js; port both CSS blocks verbatim; confirm the static pages render identically to the reference files
2. Write `supabase/migrations/0001_init.sql` (section 4) and `lib/data/types.ts` from it — the DDL first, the types second
3. Build `lib/data/mock.ts` seeded from the `ITEMS` object in the reference file, and `lib/data/session.ts` with the stub
4. Storefront reads through `lib/data` — hero, worlds, tiles, map, footer. Screenshot against the reference
5. Collection pages at `/collections/[slug]` — four themed reveals, URL-driven filters, stock lines (section 8c)
5. Enquiry form with a Server Action writing to the mock store (Turnstile stubbed to always pass)
6. Admin: login page, middleware calling `requireStaff()`, sidebar shell
7. Admin: inventory list, add, edit, visibility toggle
8. Admin: enquiries list, status changes, notes
9. Admin: shop details, staff page, stock fields and the low-stock dashboard card
10. `MediaUploader.tsx` with local previews and a mock `uploadMedia()`

At this point the whole application works end to end. Data resets on restart — that is expected.

### Phase 2 — connect the real services

11. Supabase project (`ap-south-1`), run **all** migrations in numeric order — see `supabase/migrations/README.md`; `0002_rls.sql` carries the section 5 policies
12. **Run the RLS verification commands in section 5 — do not skip this step**
13. Two auth users, matching `staff` rows, public signup disabled
14. Write `lib/data/supabase.ts` against the same contract; set `DATA_SOURCE=supabase`; the UI should not change at all
15. Real `getSession()`; verify the admin guard and that a non-staff user sees nothing

16. Cloudinary account, signing route, real `uploadMedia()`
17. Turnstile keys, real verification in the enquiry action, rate-limit trigger
18. Seed real inventory through the admin panel
19. Deploy to Vercel with environment variables set; re-run the verification commands against production
20. Add the keep-alive cron (`/api/keep-alive` hit daily) so the free project never pauses

**Steps 11–15 land together with delta 01, as commit B1.** Migrations 0003–0005 already need a Supabase project, so that prerequisite is on the critical path regardless — there is nothing to be gained by connecting the database and leaving the unsigned stub authenticator in place beside it. Doing auth in the same commit means the stub is *deleted* rather than kept and patched. The fail-closed guard in §6 stays afterwards as the regression test.

**B1 must produce no visible change.** It swaps `mock.ts` for Supabase and nothing else — same 54 items, same brands, same stock lines, same admin tables. That is the point of separating it from the features in B2: if the site looks different afterwards, the data layer swap is wrong rather than a feature being wrong. `scripts/fingerprint.mjs` captures every displayed fact and `scripts/baseline-mock.json` is the pre-swap reading; an empty diff between them is the pass condition. Only two differences are acceptable: enquiry timestamps, and row order where `display_order` ties.

If step 14 requires touching any component, the Phase 1 contract was wrong — fix `mock.ts` and the types rather than the components.

---

## 12. Pre-launch checklist

- [ ] `.env.local` is gitignored; `git log -p` shows no key ever committed
- [ ] `SUPABASE_SERVICE_ROLE_KEY` appears in no file containing `"use client"`
- [ ] Every table has RLS enabled and a deliberate policy
- [ ] Anon key cannot read `enquiries` or `staff`
- [ ] Anon key cannot read items where `is_visible = false`
- [ ] Anon key cannot insert, update or delete anything
- [ ] Public signup disabled; exactly two accounts exist
- [ ] `/admin` while logged out redirects to login
- [ ] A logged-in user missing from `staff` sees no panel
- [ ] `stub-guard.test.ts` passes; the stub authenticator is deleted, not merely unused
- [ ] A production build with `DATA_SOURCE` unset returns a bare 404 for every `/admin/*` route
- [ ] That 404's body is empty — no RSC payload, no customer data
- [ ] `npm run dev` binds to `127.0.0.1`, not `0.0.0.0`
- [ ] Cloudinary uploads are signed; unsigned preset does not exist
- [ ] Turnstile blocks a scripted enquiry submission
- [ ] Rate-limit trigger fires on the fourth rapid enquiry
- [ ] Lighthouse: performance and accessibility both 90+
- [ ] Hero renders correctly on a 360px-wide phone
- [ ] Reduced-motion setting disables all animation
- [ ] Filter bar never overlaps the product grid — check 1280px specifically
- [ ] `colour_family()` in SQL agrees with `family()` in JS for every hex in the catalogue
- [ ] Filtering happens in SQL; the network tab shows filtered rows, not the whole collection
- [ ] All four collection reveals are visually distinct
- [ ] Sold-out items still appear and still accept an enquiry
- [ ] Storefront screenshots match `design-reference/index.html`
- [ ] Admin screenshots match `design-reference/admin.html`

---

## 13. Deliberately out of scope

No cart, checkout, payment gateway, user accounts for customers, wishlist, reviews, stock counts, order tracking, or email notifications. If any of these come up later they are a separate phase — do not build toward them now, and do not add schema columns "for later".
