-- Delta 01 — collection pages, filters, stock.
-- 0001_init.sql has already run; do not edit it.

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
