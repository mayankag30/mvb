-- Delta 01 — brands become a table.
--
-- items.brand was free text: a typo created a second brand, renaming meant
-- editing every row, and the storefront's filter facets were built from
-- whatever had been typed. Promote it to a real table with a nullable FK.
--
-- Depends on: 0002_rls.sql (is_staff), 0001_init.sql (items.brand).
-- The delta calls this file 0004; migration numbers there mean "next free",
-- and 0004 was taken by the stock seed.

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

-- `on delete set null` above is deliberate: deleting a brand must never delete
-- stock. Its items become unbranded and stay on the website. An item with no
-- brand is a normal state — pieces stitched in-house or bought unbranded — so
-- brand_id is nullable and the admin form defaults to "No brand".
