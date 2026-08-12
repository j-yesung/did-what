truncate table public.record_people, public.records, public.places cascade;

drop function if exists public.update_owned_record(uuid, date, uuid, text, text, uuid[]);
drop policy if exists "Users manage their own records" on public.records;
drop index if exists public.records_place_recorded_at_idx;

alter table public.places
  drop column region,
  drop column district,
  add column region_code text not null,
  add column saved_at timestamptz,
  alter column provider set not null,
  alter column provider_place_id set not null,
  add constraint places_region_code_format check (region_code ~ '^[0-9]{10}$');

alter table public.records
  drop column place_id,
  add column region_code text not null,
  add column region_name text not null,
  add column region_latitude double precision not null,
  add column region_longitude double precision not null,
  add constraint records_region_code_format check (region_code ~ '^[0-9]{10}$'),
  add constraint records_region_name_length check (char_length(btrim(region_name)) between 1 and 200),
  add constraint records_region_latitude_range check (region_latitude between -90 and 90),
  add constraint records_region_longitude_range check (region_longitude between -180 and 180);

create table public.record_places (
  record_id uuid not null references public.records (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (record_id, place_id)
);

create index places_owner_saved_name_idx
on public.places (owner_id, name)
where saved_at is not null;

create index records_owner_region_code_idx on public.records (owner_id, region_code);
create index record_places_place_record_idx on public.record_places (place_id, record_id);

alter table public.record_places enable row level security;

revoke all on table public.record_places from anon;
grant select, insert, update, delete on table public.record_places to authenticated;

create policy "Users manage their own records"
on public.records
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Users manage links between their own records and places"
on public.record_places
for all
to authenticated
using (
  exists (
    select 1
    from public.records
    where records.id = record_places.record_id
      and records.owner_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.places
    join public.records on records.id = record_places.record_id
    where places.id = record_places.place_id
      and places.owner_id = (select auth.uid())
      and places.region_code = records.region_code
  )
)
with check (
  exists (
    select 1
    from public.records
    where records.id = record_places.record_id
      and records.owner_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.places
    join public.records on records.id = record_places.record_id
    where places.id = record_places.place_id
      and places.owner_id = (select auth.uid())
      and places.region_code = records.region_code
  )
);

create function public.create_owned_record(
  p_recorded_at date,
  p_region_code text,
  p_region_name text,
  p_region_latitude double precision,
  p_region_longitude double precision,
  p_activity text,
  p_memo text,
  p_person_ids uuid[],
  p_place_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  new_record_id uuid;
begin
  if current_owner_id is null or coalesce(cardinality(p_person_ids), 0) = 0 then
    return null;
  end if;

  if exists (
    select 1
    from unnest(p_person_ids) as selected(person_id)
    where not exists (
      select 1
      from public.people
      where id = selected.person_id
        and owner_id = current_owner_id
    )
  ) or exists (
    select 1
    from unnest(coalesce(p_place_ids, array[]::uuid[])) as selected(place_id)
    where not exists (
      select 1
      from public.places
      where id = selected.place_id
        and owner_id = current_owner_id
        and region_code = p_region_code
    )
  ) then
    return null;
  end if;

  insert into public.records (
    owner_id,
    recorded_at,
    region_code,
    region_name,
    region_latitude,
    region_longitude,
    activity,
    memo
  ) values (
    current_owner_id,
    p_recorded_at,
    p_region_code,
    p_region_name,
    p_region_latitude,
    p_region_longitude,
    p_activity,
    p_memo
  ) returning id into new_record_id;

  insert into public.record_people (record_id, person_id)
  select new_record_id, selected.person_id
  from (
    select distinct person_id
    from unnest(p_person_ids) as input(person_id)
  ) as selected;

  insert into public.record_places (record_id, place_id)
  select new_record_id, selected.place_id
  from (
    select distinct place_id
    from unnest(coalesce(p_place_ids, array[]::uuid[])) as input(place_id)
  ) as selected;

  return new_record_id;
end;
$$;

create function public.update_owned_record(
  p_record_id uuid,
  p_recorded_at date,
  p_region_code text,
  p_region_name text,
  p_region_latitude double precision,
  p_region_longitude double precision,
  p_activity text,
  p_memo text,
  p_person_ids uuid[],
  p_place_ids uuid[]
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
begin
  if current_owner_id is null or coalesce(cardinality(p_person_ids), 0) = 0 then
    return false;
  end if;

  if not exists (
    select 1
    from public.records
    where id = p_record_id
      and owner_id = current_owner_id
  ) or exists (
    select 1
    from unnest(p_person_ids) as selected(person_id)
    where not exists (
      select 1
      from public.people
      where id = selected.person_id
        and owner_id = current_owner_id
    )
  ) or exists (
    select 1
    from unnest(coalesce(p_place_ids, array[]::uuid[])) as selected(place_id)
    where not exists (
      select 1
      from public.places
      where id = selected.place_id
        and owner_id = current_owner_id
        and region_code = p_region_code
    )
  ) then
    return false;
  end if;

  update public.records
  set recorded_at = p_recorded_at,
      region_code = p_region_code,
      region_name = p_region_name,
      region_latitude = p_region_latitude,
      region_longitude = p_region_longitude,
      activity = p_activity,
      memo = p_memo
  where id = p_record_id
    and owner_id = current_owner_id;

  delete from public.record_people where record_id = p_record_id;
  delete from public.record_places where record_id = p_record_id;

  insert into public.record_people (record_id, person_id)
  select p_record_id, selected.person_id
  from (
    select distinct person_id
    from unnest(p_person_ids) as input(person_id)
  ) as selected;

  insert into public.record_places (record_id, place_id)
  select p_record_id, selected.place_id
  from (
    select distinct place_id
    from unnest(coalesce(p_place_ids, array[]::uuid[])) as input(place_id)
  ) as selected;

  return true;
end;
$$;

revoke all on function public.create_owned_record(date, text, text, double precision, double precision, text, text, uuid[], uuid[]) from public, anon;
grant execute on function public.create_owned_record(date, text, text, double precision, double precision, text, text, uuid[], uuid[]) to authenticated;

revoke all on function public.update_owned_record(uuid, date, text, text, double precision, double precision, text, text, uuid[], uuid[]) from public, anon;
grant execute on function public.update_owned_record(uuid, date, text, text, double precision, double precision, text, text, uuid[], uuid[]) to authenticated;
