-- 방문 장소가 기록 지역 안에 있어야 한다는 제약을 없앤다.
-- 하루 동선이 행정 경계를 넘는 경우를 담을 수 없었고, 기록 지역이 시·군·구 단위로 바뀌면서
-- 동 단위로 저장된 기존 장소는 같은 도시여도 영영 일치하지 않는다.
-- 소유권 검사(owner_id)는 그대로 둔다.

create or replace function public.create_owned_record(
  p_recorded_at date,
  p_region_code text,
  p_region_name text,
  p_region_label text,
  p_region_latitude double precision,
  p_region_longitude double precision,
  p_activity text,
  p_memo text,
  p_person_ids uuid[],
  p_place_ids uuid[]
)
returns uuid
language plpgsql
set search_path to ''
as $function$
declare
  current_owner_id uuid := auth.uid();
  new_record_id uuid;
begin
  if current_owner_id is null or coalesce(cardinality(p_person_ids), 0) = 0 then
    return null;
  end if;

  if exists (
    select 1 from unnest(p_person_ids) as selected(person_id)
    where not exists (
      select 1 from public.people
      where id = selected.person_id and owner_id = current_owner_id
    )
  ) or exists (
    select 1 from unnest(coalesce(p_place_ids, array[]::uuid[])) as selected(place_id)
    where not exists (
      select 1 from public.places
      where id = selected.place_id
        and owner_id = current_owner_id
    )
  ) then
    return null;
  end if;

  insert into public.records (
    owner_id, recorded_at, region_code, region_name, region_label,
    region_latitude, region_longitude, activity, memo
  ) values (
    current_owner_id, p_recorded_at, p_region_code, p_region_name, btrim(p_region_label),
    p_region_latitude, p_region_longitude, p_activity, p_memo
  ) returning id into new_record_id;

  insert into public.record_people (record_id, person_id)
  select new_record_id, selected.person_id
  from (select distinct person_id from unnest(p_person_ids) as input(person_id)) as selected;

  insert into public.record_places (record_id, place_id)
  select new_record_id, selected.place_id
  from (
    select distinct place_id
    from unnest(coalesce(p_place_ids, array[]::uuid[])) as input(place_id)
  ) as selected;

  return new_record_id;
end;
$function$;

create or replace function public.update_owned_record(
  p_record_id uuid,
  p_recorded_at date,
  p_region_code text,
  p_region_name text,
  p_region_label text,
  p_region_latitude double precision,
  p_region_longitude double precision,
  p_activity text,
  p_memo text,
  p_person_ids uuid[],
  p_place_ids uuid[]
)
returns boolean
language plpgsql
set search_path to ''
as $function$
declare
  current_owner_id uuid := auth.uid();
begin
  if current_owner_id is null or coalesce(cardinality(p_person_ids), 0) = 0 then
    return false;
  end if;

  if not exists (
    select 1 from public.records
    where id = p_record_id and owner_id = current_owner_id
  ) or exists (
    select 1 from unnest(p_person_ids) as selected(person_id)
    where not exists (
      select 1 from public.people
      where id = selected.person_id and owner_id = current_owner_id
    )
  ) or exists (
    select 1 from unnest(coalesce(p_place_ids, array[]::uuid[])) as selected(place_id)
    where not exists (
      select 1 from public.places
      where id = selected.place_id
        and owner_id = current_owner_id
    )
  ) then
    return false;
  end if;

  update public.records
  set recorded_at = p_recorded_at,
      region_code = p_region_code,
      region_name = p_region_name,
      region_label = btrim(p_region_label),
      region_latitude = p_region_latitude,
      region_longitude = p_region_longitude,
      activity = p_activity,
      memo = p_memo
  where id = p_record_id and owner_id = current_owner_id;

  delete from public.record_people where record_id = p_record_id;
  delete from public.record_places where record_id = p_record_id;

  insert into public.record_people (record_id, person_id)
  select p_record_id, selected.person_id
  from (select distinct person_id from unnest(p_person_ids) as input(person_id)) as selected;

  insert into public.record_places (record_id, place_id)
  select p_record_id, selected.place_id
  from (
    select distinct place_id
    from unnest(coalesce(p_place_ids, array[]::uuid[])) as input(place_id)
  ) as selected;

  return true;
end;
$function$;;
