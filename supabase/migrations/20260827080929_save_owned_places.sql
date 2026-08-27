create function public.save_owned_places(p_places jsonb)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
begin
  if current_owner_id is null or p_places is null or jsonb_typeof(p_places) <> 'array' then
    return false;
  end if;

  if jsonb_array_length(p_places) = 0 then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_places) as input(
      address text,
      latitude double precision,
      longitude double precision,
      name text,
      provider_place_id text,
      region_code text,
      region_name text
    )
    where name is null
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
  ) then
    return false;
  end if;

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
    now()
  from (
    select distinct on (provider_place_id)
      address,
      latitude,
      longitude,
      name,
      provider_place_id,
      region_code,
      region_name
    from jsonb_to_recordset(p_places) as place_input(
      address text,
      latitude double precision,
      longitude double precision,
      name text,
      provider_place_id text,
      region_code text,
      region_name text
    )
    order by provider_place_id
  ) as input
  on conflict (owner_id, provider, provider_place_id) where provider is not null
  do update set
    region_code = excluded.region_code,
    region_name = excluded.region_name,
    saved_at = coalesce(places.saved_at, excluded.saved_at);

  return true;
end;
$$;

revoke all on function public.save_owned_places(jsonb) from public, anon;
grant execute on function public.save_owned_places(jsonb) to authenticated;
