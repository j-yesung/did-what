/**
 * 기록과 지역을 다대다로 바꾼다.
 *
 * records의 region_* 칼럼은 첫 번째 방문 지역(대표 지역)으로 계속 채운다.
 * 목록 검색·달력 요약처럼 기록 한 줄만 읽는 화면이 조인 없이 지역을 보여줄 수 있어야 해서다.
 * 방문 지역의 기준 데이터는 record_regions이고, 지도와 지역 상세는 이 테이블만 본다.
 */
create table public.record_regions (
  record_id uuid not null references public.records (id) on delete cascade,
  region_code text not null,
  region_name text not null,
  region_label text not null,
  region_latitude double precision not null,
  region_longitude double precision not null,
  -- 사용자가 직접 고른 지역과 장소에서 자동으로 따라온 지역을 구분한다.
  selected_directly boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (record_id, region_code),
  constraint record_regions_region_code_format check (region_code ~ '^[0-9]{10}$'),
  constraint record_regions_region_name_length check (char_length(btrim(region_name)) between 1 and 200),
  constraint record_regions_region_label_length check (char_length(btrim(region_label)) between 1 and 100),
  constraint record_regions_region_latitude_range check (region_latitude between -90 and 90),
  constraint record_regions_region_longitude_range check (region_longitude between -180 and 180)
);

create index record_regions_region_code_record_idx on public.record_regions (region_code, record_id);

alter table public.record_regions enable row level security;

revoke all on table public.record_regions from anon;
grant select, insert, update, delete on table public.record_regions to authenticated;

create policy "Users manage regions of their own records"
on public.record_regions
for all
to authenticated
using (
  exists (
    select 1
    from public.records
    where records.id = record_regions.record_id
      and records.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.records
    where records.id = record_regions.record_id
      and records.owner_id = (select auth.uid())
  )
);

-- 기존 기록의 단일 지역은 사용자가 직접 고른 지역으로 옮긴다.
insert into public.record_regions (
  record_id, region_code, region_name, region_label, region_latitude, region_longitude, selected_directly
)
select id, region_code, region_name, region_label, region_latitude, region_longitude, true
from public.records;

/**
 * 기록의 방문 지역을 통째로 맞춘다.
 * 마지막에 모든 방문 장소의 지역이 방문 지역에 들어 있는지 확인해, 이 조건을 서버 쓰기 경계에서 보장한다.
 */
create function private.sync_owned_record_regions(p_record_id uuid, p_regions jsonb)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null
    or p_regions is null
    or jsonb_typeof(p_regions) <> 'array'
    or jsonb_array_length(p_regions) not between 1 and 10
  then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_regions) as input(
      code text,
      name text,
      label text,
      latitude double precision,
      longitude double precision,
      selected_directly boolean
    )
    where code is null
      or code !~ '^[0-9]{10}$'
      or name is null
      or char_length(btrim(name)) not between 1 and 200
      or label is null
      or char_length(btrim(label)) not between 1 and 100
      or latitude is null
      or latitude not between -90 and 90
      or longitude is null
      or longitude not between -180 and 180
  ) then
    return false;
  end if;

  -- 같은 지역은 한 기록에 한 번만 저장한다.
  if (
    select count(distinct input.code)
    from jsonb_to_recordset(p_regions) as input(code text)
  ) <> jsonb_array_length(p_regions) then
    return false;
  end if;

  delete from public.record_regions as link
  where link.record_id = p_record_id
    and not exists (
      select 1
      from jsonb_to_recordset(p_regions) as input(code text)
      where input.code = link.region_code
    );

  insert into public.record_regions (
    record_id, region_code, region_name, region_label, region_latitude, region_longitude, selected_directly
  )
  select
    p_record_id,
    input.code,
    btrim(input.name),
    btrim(input.label),
    input.latitude,
    input.longitude,
    coalesce(input.selected_directly, false)
  from jsonb_to_recordset(p_regions) as input(
    code text,
    name text,
    label text,
    latitude double precision,
    longitude double precision,
    selected_directly boolean
  )
  on conflict (record_id, region_code) do update set
    region_name = excluded.region_name,
    region_label = excluded.region_label,
    region_latitude = excluded.region_latitude,
    region_longitude = excluded.region_longitude,
    selected_directly = excluded.selected_directly;

  return not exists (
    select 1
    from public.record_places as link
    join public.places as place on place.id = link.place_id
    where link.record_id = p_record_id
      and not exists (
        select 1
        from public.record_regions as region
        where region.record_id = p_record_id
          and region.region_code = place.region_code
      )
  );
end;
$$;

revoke all on function private.sync_owned_record_regions(uuid, jsonb) from public, anon;
grant execute on function private.sync_owned_record_regions(uuid, jsonb) to authenticated;

/**
 * 쓰기 진입점은 지역 목록을 통째로 받는다.
 * 첫 지역이 대표 지역이 되어 안쪽 RPC의 region_* 인자로 그대로 들어간다.
 */
drop function public.create_owned_record_with_places(
  date, date, text, text, text, double precision, double precision, text, text, jsonb, text, uuid, text
);

create function public.create_owned_record_with_places(
  p_recorded_at date,
  p_recorded_until date,
  p_regions jsonb,
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
  primary_region jsonb := p_regions -> 0;
begin
  if primary_region is null then
    return null;
  end if;

  prepared_place_ids := private.prepare_owned_record_places(p_places);
  if prepared_place_ids is null then
    return null;
  end if;

  new_record_id := public.create_owned_record(
    p_recorded_at,
    p_recorded_until,
    primary_region ->> 'code',
    primary_region ->> 'name',
    primary_region ->> 'label',
    (primary_region ->> 'latitude')::double precision,
    (primary_region ->> 'longitude')::double precision,
    p_activity,
    p_memo,
    prepared_place_ids,
    p_weather,
    p_author_member_id
  );

  if new_record_id is null then
    raise exception 'record creation failed';
  end if;

  if not private.sync_owned_record_regions(new_record_id, p_regions) then
    raise exception 'record region sync failed';
  end if;

  update public.records
  set category = coalesce(p_category, 'uncategorized')
  where id = new_record_id;

  return new_record_id;
end;
$$;

drop function public.update_owned_record_with_places(
  uuid, date, date, text, text, text, double precision, double precision, text, text, jsonb, text, text
);

create function public.update_owned_record_with_places(
  p_record_id uuid,
  p_recorded_at date,
  p_recorded_until date,
  p_regions jsonb,
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
  primary_region jsonb := p_regions -> 0;
begin
  if primary_region is null then
    return false;
  end if;

  prepared_place_ids := private.prepare_owned_record_places(p_places);
  if prepared_place_ids is null then
    return false;
  end if;

  updated := public.update_owned_record(
    p_record_id,
    p_recorded_at,
    p_recorded_until,
    primary_region ->> 'code',
    primary_region ->> 'name',
    primary_region ->> 'label',
    (primary_region ->> 'latitude')::double precision,
    (primary_region ->> 'longitude')::double precision,
    p_activity,
    p_memo,
    prepared_place_ids,
    p_weather
  );

  if not updated then
    raise exception 'record update failed';
  end if;

  if not private.sync_owned_record_regions(p_record_id, p_regions) then
    raise exception 'record region sync failed';
  end if;

  update public.records
  set category = coalesce(p_category, 'uncategorized')
  where id = p_record_id;

  return true;
end;
$$;

revoke all on function public.create_owned_record_with_places(
  date, date, jsonb, text, text, jsonb, text, uuid, text
) from public, anon;
grant execute on function public.create_owned_record_with_places(
  date, date, jsonb, text, text, jsonb, text, uuid, text
) to authenticated;

revoke all on function public.update_owned_record_with_places(
  uuid, date, date, jsonb, text, text, jsonb, text, text
) from public, anon;
grant execute on function public.update_owned_record_with_places(
  uuid, date, date, jsonb, text, text, jsonb, text, text
) to authenticated;
