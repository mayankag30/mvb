-- MVB initial schema. See SPEC.md section 4.

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
  brand         text,
  base_price    numeric(10,2) not null check (base_price >= 0),
  base_color    text not null check (base_color ~ '^#[0-9A-Fa-f]{6}$'),
  badge         text,
  description   text,
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
