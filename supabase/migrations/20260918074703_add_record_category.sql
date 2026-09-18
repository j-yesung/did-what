-- 기록의 대표 카테고리. 고르지 않은 기록과 기존 기록은 미분류로 둔다.
alter table public.records
  add column category text not null default 'uncategorized',
  add constraint records_category_check
    check (category in ('daily', 'date', 'travel', 'anniversary', 'gathering', 'uncategorized'));

/**
 * 카테고리도 장소·기록과 같은 트랜잭션에 있어야 하므로 쓰기 진입점에만 인자를 더한다.
 * 안쪽 RPC는 그대로 두고 author_member_id와 같은 방식으로 이어 쓴다. 허용 값은 CHECK가 막는다.
 */
drop function public.create_owned_record_with_places(
  date, date, text, text, text, double precision, double precision, text, text, jsonb, text, uuid
);

create function public.create_owned_record_with_places(
  p_recorded_at date,
  p_recorded_until date,
  p_region_code text,
  p_region_name text,
  p_region_label text,
  p_region_latitude double precision,
  p_region_longitude double precision,
  p_activity text,
  p_memo text,
  p_places jsonb,
  p_weather text,
  p_author_member_id uuid,
  p_category text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_record_id uuid;
  prepared_place_ids uuid[];
begin
  prepared_place_ids := private.prepare_owned_record_places(p_places);
  if prepared_place_ids is null then
    return null;
  end if;

  new_record_id := public.create_owned_record(
    p_recorded_at,
    p_recorded_until,
    p_region_code,
    p_region_name,
    p_region_label,
    p_region_latitude,
    p_region_longitude,
    p_activity,
    p_memo,
    prepared_place_ids,
    p_weather,
    p_author_member_id
  );

  if new_record_id is null then
    raise exception 'record creation failed';
  end if;

  update public.records
  set category = coalesce(p_category, 'uncategorized')
  where id = new_record_id;

  return new_record_id;
end;
$$;

drop function public.update_owned_record_with_places(
  uuid, date, date, text, text, text, double precision, double precision, text, text, jsonb, text
);

create function public.update_owned_record_with_places(
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
  p_places jsonb,
  p_weather text,
  p_category text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prepared_place_ids uuid[];
  updated boolean;
begin
  prepared_place_ids := private.prepare_owned_record_places(p_places);
  if prepared_place_ids is null then
    return false;
  end if;

  updated := public.update_owned_record(
    p_record_id,
    p_recorded_at,
    p_recorded_until,
    p_region_code,
    p_region_name,
    p_region_label,
    p_region_latitude,
    p_region_longitude,
    p_activity,
    p_memo,
    prepared_place_ids,
    p_weather
  );

  if not updated then
    raise exception 'record update failed';
  end if;

  update public.records
  set category = coalesce(p_category, 'uncategorized')
  where id = p_record_id;

  return true;
end;
$$;

revoke all on function public.create_owned_record_with_places(
  date, date, text, text, text, double precision, double precision, text, text, jsonb, text, uuid, text
) from public, anon;
grant execute on function public.create_owned_record_with_places(
  date, date, text, text, text, double precision, double precision, text, text, jsonb, text, uuid, text
) to authenticated;

revoke all on function public.update_owned_record_with_places(
  uuid, date, date, text, text, text, double precision, double precision, text, text, jsonb, text, text
) from public, anon;
grant execute on function public.update_owned_record_with_places(
  uuid, date, date, text, text, text, double precision, double precision, text, text, jsonb, text, text
) to authenticated;
