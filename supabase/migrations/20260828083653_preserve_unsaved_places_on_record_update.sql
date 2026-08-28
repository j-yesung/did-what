-- 기록 수정 때 유지할 장소의 연결을 보존한다.
-- 기존 연결을 전부 삭제하면 record_places 트리거가 저장하지 않은 장소까지 지워서
-- 같은 장소를 다시 연결할 수 없게 된다. 실제로 제거된 연결만 삭제한다.
create or replace function public.update_owned_record(
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

  delete from public.record_places as link
  where link.record_id = p_record_id
    and not exists (
      select 1
      from unnest(coalesce(p_place_ids, array[]::uuid[])) as selected(place_id)
      where selected.place_id = link.place_id
    );

  insert into public.record_places (record_id, place_id)
  select p_record_id, selected.place_id
  from (
    select distinct place_id
    from unnest(coalesce(p_place_ids, array[]::uuid[])) as input(place_id)
  ) as selected
  on conflict (record_id, place_id) do nothing;

  return true;
end;
$$;
