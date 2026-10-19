-- 지역 코드는 집계 기준으로 유지하고, 표시명이 다른 방문 항목은 각각 보존한다.
ALTER TABLE public.record_regions DROP CONSTRAINT record_regions_pkey;
ALTER TABLE public.record_regions
  ADD CONSTRAINT record_regions_pkey PRIMARY KEY (record_id, region_code, region_label);

CREATE OR REPLACE FUNCTION private.sync_owned_record_regions(p_record_id uuid, p_regions jsonb) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
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

  -- 같은 지역과 표시명의 조합만 중복으로 처리한다.
  if (
    select count(distinct (input.code, btrim(input.label)))
    from jsonb_to_recordset(p_regions) as input(code text, label text)
  ) <> jsonb_array_length(p_regions) then
    return false;
  end if;

  delete from public.record_regions as link
  where link.record_id = p_record_id
    and not exists (
      select 1
      from jsonb_to_recordset(p_regions) as input(code text, label text)
      where input.code = link.region_code
        and btrim(input.label) = link.region_label
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
  on conflict (record_id, region_code, region_label) do update set
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
$_$;
