-- Row Level Security. See SPEC.md section 5.
-- RLS with no policy means deny-all; everything below is added back deliberately.

alter table staff          enable row level security;
alter table collections    enable row level security;
alter table items          enable row level security;
alter table item_colors    enable row level security;
alter table item_media     enable row level security;
alter table enquiries      enable row level security;
alter table enquiry_notes  enable row level security;
alter table shop_settings  enable row level security;

-- helper: is the caller active staff?
-- security definer so it can read `staff` while `staff` itself stays locked
create or replace function public.is_staff() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from staff where id = auth.uid() and is_active)
$$;
revoke execute on function public.is_staff() from anon;
grant  execute on function public.is_staff() to authenticated;

-- ---------- public catalogue: read only, visible rows only ----------
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

-- ---------- staff: full control ----------
create policy collections_staff on collections   for all to authenticated using (is_staff()) with check (is_staff());
create policy items_staff       on items         for all to authenticated using (is_staff()) with check (is_staff());
create policy colors_staff      on item_colors   for all to authenticated using (is_staff()) with check (is_staff());
create policy media_staff       on item_media    for all to authenticated using (is_staff()) with check (is_staff());
create policy enq_staff         on enquiries     for all to authenticated using (is_staff()) with check (is_staff());
create policy notes_staff       on enquiry_notes for all to authenticated using (is_staff()) with check (is_staff());
create policy shop_staff_write  on shop_settings for update to authenticated using (is_staff()) with check (is_staff());

-- staff can read the roster, nobody can edit it from the client
create policy staff_read on staff for select to authenticated using (is_staff());

-- ---------- enquiries: no public policy at all ----------
-- Submission goes through a Server Action that verifies Turnstile then writes
-- with the service-role key. Belt and braces against a flood:
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
