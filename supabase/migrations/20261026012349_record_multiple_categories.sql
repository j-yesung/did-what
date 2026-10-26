ALTER TABLE public.records DROP CONSTRAINT records_category_check;
ALTER TABLE public.records ALTER COLUMN category DROP DEFAULT;
ALTER TABLE public.records ALTER COLUMN category TYPE text[]
  USING CASE WHEN category = 'uncategorized' THEN ARRAY[]::text[] ELSE ARRAY[category] END;
ALTER TABLE public.records ALTER COLUMN category SET DEFAULT ARRAY[]::text[];
ALTER TABLE public.records ADD CONSTRAINT records_category_check CHECK (
  category <@ ARRAY['daily', 'date', 'travel', 'anniversary', 'gathering']::text[]
  AND cardinality(category) <= 5
  AND (cardinality(category) = 0 OR array_ndims(category) = 1)
  AND array_position(category, NULL) IS NULL
);

DROP FUNCTION public.create_owned_record_with_places(date, date, jsonb, text, text, jsonb, text, uuid, text);
DROP FUNCTION public.update_owned_record_with_places(uuid, date, date, jsonb, text, text, jsonb, text, text);

CREATE OR REPLACE FUNCTION public.create_owned_record_with_places(p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_author_member_id uuid, p_category text[]) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  new_record_id uuid;
  prepared_place_ids uuid[];
  primary_region jsonb := p_regions -> 0;
begin
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
    coalesce(p_category, ARRAY[]::text[]),
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

CREATE OR REPLACE FUNCTION public.update_owned_record_with_places(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_category text[]) RETURNS boolean
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
      category = coalesce(p_category, ARRAY[]::text[])
  where id = p_record_id
    and owner_id = current_owner_id;

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

REVOKE ALL ON FUNCTION public.create_owned_record_with_places(date, date, jsonb, text, text, jsonb, text, uuid, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_owned_record_with_places(date, date, jsonb, text, text, jsonb, text, uuid, text[]) TO authenticated;
REVOKE ALL ON FUNCTION public.update_owned_record_with_places(uuid, date, date, jsonb, text, text, jsonb, text, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_owned_record_with_places(uuid, date, date, jsonb, text, text, jsonb, text, text[]) TO authenticated;
