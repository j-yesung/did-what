-- 사람 관리 기능을 제거하면서 RPC의 사람 인자와 관련 테이블을 함께 정리한다.
drop function public.create_owned_record(date, text, text, text, double precision, double precision, text, text, uuid[], uuid[]);
drop function public.create_owned_record(date, date, text, text, text, double precision, double precision, text, text, uuid[], uuid[]);
drop function public.create_owned_record(date, date, text, text, text, double precision, double precision, text, text, uuid[], uuid[], text);

drop function public.update_owned_record(uuid, date, text, text, text, double precision, double precision, text, text, uuid[], uuid[]);
drop function public.update_owned_record(uuid, date, date, text, text, text, double precision, double precision, text, text, uuid[], uuid[]);
drop function public.update_owned_record(uuid, date, date, text, text, text, double precision, double precision, text, text, uuid[], uuid[], text);

drop table public.record_people;
drop table public.people;

create function public.create_owned_record(
  p_recorded_at date,
  p_recorded_until date,
  p_region_code text,
  p_region_name text,
  p_region_label text,
  p_region_latitude double precision,
  p_region_longitude double precision,
  p_activity text,
  p_memo text,
  p_place_ids uuid[],
  p_weather text
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
  if current_owner_id is null
    or (p_recorded_until is not null and p_recorded_until < p_recorded_at)
  then
    return null;
  end if;

  if exists (
    select 1 from unnest(coalesce(p_place_ids, array[]::uuid[])) as selected(place_id)
    where not exists (
      select 1 from public.places
      where id = selected.place_id and owner_id = current_owner_id
    )
  ) then
    return null;
  end if;

  insert into public.records (
    owner_id, recorded_at, recorded_until, region_code, region_name, region_label,
    region_latitude, region_longitude, activity, memo, weather
  ) values (
    current_owner_id, p_recorded_at, p_recorded_until, p_region_code, p_region_name, btrim(p_region_label),
    p_region_latitude, p_region_longitude, p_activity, p_memo, p_weather
  ) returning id into new_record_id;

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
  p_recorded_until date,
  p_region_code text,
  p_region_name text,
  p_region_label text,
  p_region_latitude double precision,
  p_region_longitude double precision,
  p_activity text,
  p_memo text,
  p_place_ids uuid[],
  p_weather text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
begin
  if current_owner_id is null
    or (p_recorded_until is not null and p_recorded_until < p_recorded_at)
  then
    return false;
  end if;

  if not exists (
    select 1 from public.records
    where id = p_record_id and owner_id = current_owner_id
  ) or exists (
    select 1 from unnest(coalesce(p_place_ids, array[]::uuid[])) as selected(place_id)
    where not exists (
      select 1 from public.places
      where id = selected.place_id and owner_id = current_owner_id
    )
  ) then
    return false;
  end if;

  update public.records
  set recorded_at = p_recorded_at,
      recorded_until = p_recorded_until,
      region_code = p_region_code,
      region_name = p_region_name,
      region_label = btrim(p_region_label),
      region_latitude = p_region_latitude,
      region_longitude = p_region_longitude,
      activity = p_activity,
      memo = p_memo,
      weather = p_weather
  where id = p_record_id and owner_id = current_owner_id;

  delete from public.record_places where record_id = p_record_id;

  insert into public.record_places (record_id, place_id)
  select p_record_id, selected.place_id
  from (
    select distinct place_id
    from unnest(coalesce(p_place_ids, array[]::uuid[])) as input(place_id)
  ) as selected;

  return true;
end;
$$;

revoke all on function public.create_owned_record(date, date, text, text, text, double precision, double precision, text, text, uuid[], text) from public, anon;
grant execute on function public.create_owned_record(date, date, text, text, text, double precision, double precision, text, text, uuid[], text) to authenticated;

revoke all on function public.update_owned_record(uuid, date, date, text, text, text, double precision, double precision, text, text, uuid[], text) from public, anon;
grant execute on function public.update_owned_record(uuid, date, date, text, text, text, double precision, double precision, text, text, uuid[], text) to authenticated;
