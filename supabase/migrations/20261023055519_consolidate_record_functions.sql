-- 기록 저장 함수가 단일 지역 시절의 함수(create_owned_record, update_owned_record)를 감싸고,
-- 저장 뒤 category·author_member_id를 UPDATE로 덧쓰던 구조를 함수 하나로 합친다.
-- 앱이 부르는 함수 이름과 인자는 그대로라 화면 코드는 바뀌지 않는다. 권한은 CREATE OR REPLACE가 유지한다.

CREATE OR REPLACE FUNCTION public.create_owned_record_with_places(p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_author_member_id uuid, p_category text) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  new_record_id uuid;
  prepared_place_ids uuid[];
  primary_region jsonb := p_regions -> 0;
begin
  -- 장소를 만들기 전에 거른다. 실패한 저장이 장소만 남기지 않게 한다.
  if current_owner_id is null
    or primary_region is null
    or (p_recorded_until is not null and p_recorded_until < p_recorded_at)
    or not exists (
      select 1
      from public.account_members
      where id = p_author_member_id
        and owner_id = current_owner_id
        and is_active
    )
  then
    return null;
  end if;

  prepared_place_ids := private.prepare_owned_record_places(p_places);
  if prepared_place_ids is null then
    return null;
  end if;

  insert into public.records (
    owner_id, author_member_id, category, recorded_at, recorded_until, region_code, region_name, region_label,
    region_latitude, region_longitude, activity, memo, weather
  ) values (
    current_owner_id,
    p_author_member_id,
    coalesce(p_category, 'uncategorized'),
    p_recorded_at,
    p_recorded_until,
    primary_region ->> 'code',
    primary_region ->> 'name',
    btrim(primary_region ->> 'label'),
    (primary_region ->> 'latitude')::double precision,
    (primary_region ->> 'longitude')::double precision,
    p_activity,
    p_memo,
    p_weather
  ) returning id into new_record_id;

  -- prepare_owned_record_places가 중복 없이 돌려준다.
  insert into public.record_places (record_id, place_id)
  select new_record_id, selected.place_id
  from unnest(prepared_place_ids) as selected(place_id);

  if not private.sync_owned_record_regions(new_record_id, p_regions) then
    raise exception 'record region sync failed';
  end if;

  perform private.create_record_notifications(new_record_id, p_author_member_id);

  return new_record_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.update_owned_record_with_places(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_category text) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  prepared_place_ids uuid[];
  primary_region jsonb := p_regions -> 0;
begin
  if current_owner_id is null
    or primary_region is null
    or (p_recorded_until is not null and p_recorded_until < p_recorded_at)
    or not exists (
      select 1
      from public.records
      where id = p_record_id
        and owner_id = current_owner_id
    )
  then
    return false;
  end if;

  prepared_place_ids := private.prepare_owned_record_places(p_places);
  if prepared_place_ids is null then
    return false;
  end if;

  update public.records
  set recorded_at = p_recorded_at,
      recorded_until = p_recorded_until,
      region_code = primary_region ->> 'code',
      region_name = primary_region ->> 'name',
      region_label = btrim(primary_region ->> 'label'),
      region_latitude = (primary_region ->> 'latitude')::double precision,
      region_longitude = (primary_region ->> 'longitude')::double precision,
      activity = p_activity,
      memo = p_memo,
      weather = p_weather,
      category = coalesce(p_category, 'uncategorized')
  where id = p_record_id
    and owner_id = current_owner_id;

  -- 빠진 장소의 연결만 지운다. 저장하지 않은 장소는 cleanup_unlinked_record_place 트리거가 정리한다.
  delete from public.record_places as link
  where link.record_id = p_record_id
    and link.place_id <> all (prepared_place_ids);

  insert into public.record_places (record_id, place_id)
  select p_record_id, selected.place_id
  from unnest(prepared_place_ids) as selected(place_id)
  on conflict (record_id, place_id) do nothing;

  if not private.sync_owned_record_regions(p_record_id, p_regions) then
    raise exception 'record region sync failed';
  end if;

  return true;
end;
$$;

-- 위 두 함수가 감싸던 단일 지역 함수와, 앱에서 쓰지 않는 개별 알림 읽음 함수.
DROP FUNCTION public.create_owned_record(date, date, text, text, text, double precision, double precision, text, text, uuid[], text, uuid);
DROP FUNCTION public.create_owned_record(date, date, text, text, text, double precision, double precision, text, text, uuid[], text);
DROP FUNCTION public.update_owned_record(uuid, date, date, text, text, text, double precision, double precision, text, text, uuid[], text);
DROP FUNCTION public.mark_notification_read(bigint, uuid);
