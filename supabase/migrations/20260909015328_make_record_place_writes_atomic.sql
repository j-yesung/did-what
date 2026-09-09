-- 외부 API에서 검증한 장소를 기록과 같은 트랜잭션에서 저장한다.
-- 어느 단계든 실패하면 장소 변경과 기록 변경을 모두 되돌린다.

create function private.prepare_owned_record_places(p_places jsonb)
returns uuid[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
  prepared_place_ids uuid[];
begin
  if current_owner_id is null
    or p_places is null
    or jsonb_typeof(p_places) <> 'array'
    or jsonb_array_length(p_places) > 10
  then
    return null;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_places) as input(
      kind text,
      place_id uuid,
      save boolean,
      address text,
      latitude double precision,
      longitude double precision,
      name text,
      provider_place_id text,
      region_code text,
      region_name text
    )
    where kind is null
      or kind not in ('existing', 'kakao')
      or (kind = 'existing' and place_id is null)
      or (kind = 'kakao' and (
        name is null
        or char_length(btrim(name)) not between 1 and 200
        or latitude is null
        or latitude not between -90 and 90
        or longitude is null
        or longitude not between -180 and 180
        or provider_place_id is null
        or provider_place_id !~ '^[0-9]{1,100}$'
        or region_code is null
        or region_code !~ '^[0-9]{10}$'
        or region_name is null
        or char_length(btrim(region_name)) not between 1 and 200
      ))
  ) then
    return null;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_places) as input(kind text, place_id uuid)
    where input.kind = 'existing'
      and not exists (
        select 1
        from public.places as place
        where place.id = input.place_id
          and place.owner_id = current_owner_id
      )
  ) then
    return null;
  end if;

  update public.places as place
  set saved_at = coalesce(place.saved_at, now())
  from jsonb_to_recordset(p_places) as input(kind text, place_id uuid, save boolean)
  where input.kind = 'existing'
    and input.save is true
    and place.id = input.place_id
    and place.owner_id = current_owner_id;

  insert into public.places (
    address,
    latitude,
    longitude,
    name,
    owner_id,
    provider,
    provider_place_id,
    region_code,
    region_name,
    saved_at
  )
  select
    input.address,
    input.latitude,
    input.longitude,
    input.name,
    current_owner_id,
    'kakao',
    input.provider_place_id,
    input.region_code,
    input.region_name,
    case when input.save then now() else null end
  from (
    select distinct on (provider_place_id)
      address,
      latitude,
      longitude,
      name,
      provider_place_id,
      region_code,
      region_name,
      coalesce(save, false) as save
    from jsonb_to_recordset(p_places) as place_input(
      kind text,
      address text,
      latitude double precision,
      longitude double precision,
      name text,
      provider_place_id text,
      region_code text,
      region_name text,
      save boolean
    )
    where kind = 'kakao'
    order by provider_place_id, coalesce(save, false) desc
  ) as input
  on conflict (owner_id, provider, provider_place_id) where provider is not null
  do update set
    region_code = excluded.region_code,
    region_name = excluded.region_name,
    saved_at = coalesce(places.saved_at, excluded.saved_at);

  select coalesce(array_agg(distinct selected.id), array[]::uuid[])
  into prepared_place_ids
  from (
    select place.id
    from jsonb_to_recordset(p_places) as input(kind text, place_id uuid)
    join public.places as place
      on input.kind = 'existing'
      and place.id = input.place_id
      and place.owner_id = current_owner_id

    union all

    select place.id
    from jsonb_to_recordset(p_places) as input(kind text, provider_place_id text)
    join public.places as place
      on input.kind = 'kakao'
      and place.owner_id = current_owner_id
      and place.provider = 'kakao'
      and place.provider_place_id = input.provider_place_id
  ) as selected;

  return prepared_place_ids;
end;
$$;

revoke all on function private.prepare_owned_record_places(jsonb) from public, anon;
grant execute on function private.prepare_owned_record_places(jsonb) to authenticated;

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
  p_author_member_id uuid
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

  return new_record_id;
end;
$$;

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
  p_weather text
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

  return true;
end;
$$;

revoke all on function public.create_owned_record_with_places(
  date, date, text, text, text, double precision, double precision, text, text, jsonb, text, uuid
) from public, anon;
grant execute on function public.create_owned_record_with_places(
  date, date, text, text, text, double precision, double precision, text, text, jsonb, text, uuid
) to authenticated;

revoke all on function public.update_owned_record_with_places(
  uuid, date, date, text, text, text, double precision, double precision, text, text, jsonb, text
) from public, anon;
grant execute on function public.update_owned_record_with_places(
  uuid, date, date, text, text, text, double precision, double precision, text, text, jsonb, text
) to authenticated;
