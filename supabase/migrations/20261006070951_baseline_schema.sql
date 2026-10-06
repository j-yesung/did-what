-- Baseline through 20261006070951 (31 applied migrations).
-- Existing databases mark this version applied; never execute it over populated application tables.
-- Historical region backfills are available in Git history before this baseline.

--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: private; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--




--
-- Name: create_comment_notifications(uuid, uuid); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.create_comment_notifications(p_comment_id uuid, p_sender_member_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  current_sender_name text;
  current_record_id uuid;
  current_record_title text;
begin
  if current_owner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select
    member.name,
    comment.record_id,
    btrim(record.activity)
  into
    current_sender_name,
    current_record_id,
    current_record_title
  from public.record_comments as comment
  join public.records as record
    on record.id = comment.record_id
    and record.owner_id = comment.owner_id
  join public.account_members as member
    on member.id = comment.author_member_id
    and member.owner_id = comment.owner_id
    and member.is_active
  where comment.id = p_comment_id
    and comment.owner_id = current_owner_id
    and comment.author_member_id = p_sender_member_id;

  if current_sender_name is null or current_record_id is null or current_record_title is null then
    raise exception 'Invalid comment author' using errcode = '22023';
  end if;

  insert into public.notifications (
    owner_id,
    recipient_member_id,
    sender_member_id,
    sender_name,
    record_id,
    record_title,
    event_type,
    comment_id
  )
  select
    current_owner_id,
    recipient.id,
    p_sender_member_id,
    current_sender_name,
    current_record_id,
    current_record_title,
    'comment_created',
    p_comment_id
  from public.account_members as recipient
  where recipient.owner_id = current_owner_id
    and recipient.is_active
    and recipient.id <> p_sender_member_id
  on conflict (comment_id, recipient_member_id)
  where event_type = 'comment_created' and comment_id is not null
  do nothing;
end;
$$;


--
-- Name: create_record_notifications(uuid, uuid); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.create_record_notifications(p_record_id uuid, p_sender_member_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  current_sender_name text;
  current_record_title text;
begin
  if current_owner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select member.name
  into current_sender_name
  from public.account_members as member
  where member.id = p_sender_member_id
    and member.owner_id = current_owner_id
    and member.is_active;

  select btrim(record.activity)
  into current_record_title
  from public.records as record
  where record.id = p_record_id
    and record.owner_id = current_owner_id
    and record.author_member_id = p_sender_member_id;

  if current_sender_name is null or current_record_title is null then
    raise exception 'Invalid record author' using errcode = '22023';
  end if;

  insert into public.notifications (
    owner_id,
    recipient_member_id,
    sender_member_id,
    sender_name,
    record_id,
    record_title
  )
  select
    current_owner_id,
    recipient.id,
    p_sender_member_id,
    current_sender_name,
    p_record_id,
    current_record_title
  from public.account_members as recipient
  where recipient.owner_id = current_owner_id
    and recipient.is_active
    and recipient.id <> p_sender_member_id
  on conflict (record_id, recipient_member_id)
  where event_type = 'record_created'
  do nothing;
end;
$$;


--
-- Name: prepare_owned_record_places(jsonb); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.prepare_owned_record_places(p_places jsonb) RETURNS uuid[]
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
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
      category_group_code text,
      category_name text,
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
    category_group_code,
    category_name,
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
    input.category_group_code,
    input.category_name,
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
      category_group_code,
      category_name,
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
      category_group_code text,
      category_name text,
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
    category_group_code = coalesce(excluded.category_group_code, places.category_group_code),
    category_name = coalesce(excluded.category_name, places.category_name),
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
$_$;


--
-- Name: setup_account_members(text[]); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.setup_account_members(p_names text[]) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  normalized_names text[];
begin
  if current_owner_id is null then
    return false;
  end if;

  if p_names is null or exists (
    select 1
    from unnest(p_names) as input(name)
    where input.name is null
      or char_length(btrim(input.name)) not between 1 and 100
  ) then
    return false;
  end if;

  select array_agg(deduplicated.name order by deduplicated.first_position)
  into normalized_names
  from (
    select
      (array_agg(btrim(input.name) order by input.position))[1] as name,
      min(input.position) as first_position
    from unnest(p_names) with ordinality as input(name, position)
    group by lower(btrim(input.name))
  ) as deduplicated;

  if coalesce(cardinality(normalized_names), 0) < 2 then
    return false;
  end if;

  perform 1
  from public.profiles
  where id = current_owner_id
  for update;

  if not found or exists (
    select 1
    from public.account_members
    where owner_id = current_owner_id
  ) then
    return false;
  end if;

  insert into public.account_members (owner_id, name)
  select current_owner_id, input.name
  from unnest(normalized_names) as input(name);

  return true;
end;
$$;


--
-- Name: sync_owned_record_regions(uuid, jsonb); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.sync_owned_record_regions(p_record_id uuid, p_regions jsonb) RETURNS boolean
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
$_$;


--
-- Name: cleanup_unlinked_record_place(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_unlinked_record_place() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
  delete from public.places as place
  where place.id = old.place_id
    and place.owner_id = (select auth.uid())
    and place.saved_at is null
    and not exists (
      select 1
      from public.record_places as link
      where link.place_id = old.place_id
    );

  return old;
end;
$$;


--
-- Name: create_owned_record(date, date, text, text, text, double precision, double precision, text, text, uuid[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_owned_record(p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
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


--
-- Name: create_owned_record(date, date, text, text, text, double precision, double precision, text, text, uuid[], text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_owned_record(p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text, p_author_member_id uuid) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  new_record_id uuid;
begin
  if current_owner_id is null or not exists (
    select 1
    from public.account_members
    where id = p_author_member_id
      and owner_id = current_owner_id
      and is_active
  ) then
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
    p_place_ids,
    p_weather
  );

  if new_record_id is null then
    return null;
  end if;

  update public.records
  set author_member_id = p_author_member_id
  where id = new_record_id
    and owner_id = current_owner_id;

  perform private.create_record_notifications(new_record_id, p_author_member_id);

  return new_record_id;
end;
$$;


--
-- Name: create_owned_record_with_places(date, date, jsonb, text, text, jsonb, text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_owned_record_with_places(p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_author_member_id uuid, p_category text) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
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


--
-- Name: create_record_comment(uuid, uuid, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_record_comment(p_comment_id uuid, p_record_id uuid, p_body text, p_author_member_id uuid) RETURNS TABLE(id uuid, record_id uuid, author_member_id uuid, author_name text, body text, created_at timestamp with time zone, updated_at timestamp with time zone, created boolean)
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  normalized_body text := btrim(p_body);
  current_author_name text;
  saved_comment public.record_comments%rowtype;
begin
  if current_owner_id is null
    or p_comment_id is null
    or p_record_id is null
    or p_author_member_id is null
    or normalized_body is null
    or char_length(normalized_body) not between 1 and 1000
  then
    return;
  end if;

  select member.name
  into current_author_name
  from public.account_members as member
  where member.id = p_author_member_id
    and member.owner_id = current_owner_id
    and member.is_active;

  if current_author_name is null or not exists (
    select 1
    from public.records as record
    where record.id = p_record_id
      and record.owner_id = current_owner_id
  ) then
    return;
  end if;

  insert into public.record_comments (
    id,
    owner_id,
    record_id,
    author_member_id,
    body
  ) values (
    p_comment_id,
    current_owner_id,
    p_record_id,
    p_author_member_id,
    normalized_body
  )
  on conflict on constraint record_comments_pkey do nothing
  returning * into saved_comment;

  if found then
    perform private.create_comment_notifications(p_comment_id, p_author_member_id);

    return query
    select
      saved_comment.id,
      saved_comment.record_id,
      saved_comment.author_member_id,
      current_author_name,
      saved_comment.body,
      saved_comment.created_at,
      saved_comment.updated_at,
      true;
    return;
  end if;

  select comment.*
  into saved_comment
  from public.record_comments as comment
  where comment.id = p_comment_id
    and comment.owner_id = current_owner_id;

  if found then
    if saved_comment.record_id <> p_record_id
      or saved_comment.author_member_id <> p_author_member_id
      or saved_comment.body <> normalized_body
    then
      return;
    end if;

    return query
    select
      saved_comment.id,
      saved_comment.record_id,
      saved_comment.author_member_id,
      current_author_name,
      saved_comment.body,
      saved_comment.created_at,
      saved_comment.updated_at,
      false;
    return;
  end if;
end;
$$;


--
-- Name: delete_owned_record(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_owned_record(p_record_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  deleted_record_id uuid;
begin
  if current_owner_id is null then
    return false;
  end if;

  delete from public.records
  where id = p_record_id
    and owner_id = current_owner_id
  returning id into deleted_record_id;

  if deleted_record_id is null then
    return false;
  end if;

  -- 기존에 남아 있던 기록 전용 고아 장소도 같은 요청에서 정리한다.
  delete from public.places as place
  where place.owner_id = current_owner_id
    and place.saved_at is null
    and not exists (
      select 1
      from public.record_places as link
      where link.place_id = place.id
    );

  return true;
end;
$$;


--
-- Name: mark_all_notifications_read(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_all_notifications_read(p_recipient_member_id uuid) RETURNS bigint
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
  updated_count bigint;
begin
  if current_owner_id is null or not exists (
    select 1
    from public.account_members
    where id = p_recipient_member_id
      and owner_id = current_owner_id
      and is_active
  ) then
    return 0;
  end if;

  update public.notifications
  set read_at = now()
  where owner_id = current_owner_id
    and recipient_member_id = p_recipient_member_id
    and read_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;


--
-- Name: mark_notification_read(bigint, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_notification_read(p_notification_id bigint, p_recipient_member_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
begin
  if current_owner_id is null or not exists (
    select 1
    from public.account_members
    where id = p_recipient_member_id
      and owner_id = current_owner_id
      and is_active
  ) then
    return false;
  end if;

  update public.notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id
    and owner_id = current_owner_id
    and recipient_member_id = p_recipient_member_id;

  return found;
end;
$$;


--
-- Name: remove_saved_place(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_saved_place(p_place_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
declare
  current_owner_id uuid := auth.uid();
begin
  if current_owner_id is null then
    return false;
  end if;

  -- 기록에서 사용 중인 저장 장소는 저장 상태만 해제해 기록의 장소를 보존한다.
  update public.places as place
  set saved_at = null
  where place.id = p_place_id
    and place.owner_id = current_owner_id
    and place.saved_at is not null
    and exists (
      select 1
      from public.record_places as link
      join public.records as record on record.id = link.record_id
      where link.place_id = place.id
        and record.owner_id = current_owner_id
    );

  if found then
    return true;
  end if;

  delete from public.places as place
  where place.id = p_place_id
    and place.owner_id = current_owner_id
    and place.saved_at is not null;

  return found;
end;
$$;


--
-- Name: save_owned_places(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_owned_places(p_places jsonb) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
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
      category_group_code text,
      category_name text,
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
    category_group_code,
    category_name,
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
    input.category_group_code,
    input.category_name,
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
      category_group_code,
      category_name,
      latitude,
      longitude,
      name,
      provider_place_id,
      region_code,
      region_name
    from jsonb_to_recordset(p_places) as place_input(
      address text,
      category_group_code text,
      category_name text,
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
    category_group_code = coalesce(excluded.category_group_code, places.category_group_code),
    category_name = coalesce(excluded.category_name, places.category_name),
    region_code = excluded.region_code,
    region_name = excluded.region_name,
    saved_at = coalesce(places.saved_at, excluded.saved_at);

  return true;
end;
$_$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: setup_account_members(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.setup_account_members(p_names text[]) RETURNS boolean
    LANGUAGE sql
    SET search_path TO ''
    AS $$
  select private.setup_account_members(p_names);
$$;


--
-- Name: update_owned_record(uuid, date, date, text, text, text, double precision, double precision, text, text, uuid[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_owned_record(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
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


--
-- Name: update_owned_record_with_places(uuid, date, date, jsonb, text, text, jsonb, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_owned_record_with_places(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_category text) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT account_members_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT account_members_name_trimmed CHECK ((name = btrim(name)))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    owner_id uuid NOT NULL,
    recipient_member_id uuid NOT NULL,
    sender_member_id uuid NOT NULL,
    sender_name text NOT NULL,
    record_id uuid,
    record_title text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_type text DEFAULT 'record_created'::text NOT NULL,
    comment_id uuid,
    CONSTRAINT notifications_distinct_members CHECK ((recipient_member_id <> sender_member_id)),
    CONSTRAINT notifications_event_reference_check CHECK (((event_type = 'comment_created'::text) OR (comment_id IS NULL))),
    CONSTRAINT notifications_event_type_check CHECK ((event_type = ANY (ARRAY['record_created'::text, 'comment_created'::text]))),
    CONSTRAINT notifications_record_title_length CHECK (((char_length(record_title) >= 1) AND (char_length(record_title) <= 120))),
    CONSTRAINT notifications_record_title_trimmed CHECK ((record_title = btrim(record_title))),
    CONSTRAINT notifications_sender_name_length CHECK (((char_length(sender_name) >= 1) AND (char_length(sender_name) <= 100))),
    CONSTRAINT notifications_sender_name_trimmed CHECK ((sender_name = btrim(sender_name)))
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.notifications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.places (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    provider text NOT NULL,
    provider_place_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    region_code text NOT NULL,
    saved_at timestamp with time zone,
    region_name text,
    category_group_code text,
    category_name text,
    CONSTRAINT places_category_group_code_length CHECK (((category_group_code IS NULL) OR ((char_length(btrim(category_group_code)) >= 1) AND (char_length(btrim(category_group_code)) <= 20)))),
    CONSTRAINT places_category_name_length CHECK (((category_name IS NULL) OR ((char_length(btrim(category_name)) >= 1) AND (char_length(btrim(category_name)) <= 200)))),
    CONSTRAINT places_latitude_range CHECK (((latitude >= ('-90'::integer)::double precision) AND (latitude <= (90)::double precision))),
    CONSTRAINT places_longitude_range CHECK (((longitude >= ('-180'::integer)::double precision) AND (longitude <= (180)::double precision))),
    CONSTRAINT places_name_length CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 200))),
    CONSTRAINT places_provider_pair CHECK (((provider IS NULL) = (provider_place_id IS NULL))),
    CONSTRAINT places_region_code_format CHECK ((region_code ~ '^[0-9]{10}$'::text)),
    CONSTRAINT places_region_name_length CHECK (((region_name IS NULL) OR ((char_length(btrim(region_name)) >= 1) AND (char_length(btrim(region_name)) <= 200))))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_display_name_length CHECK (((display_name IS NULL) OR ((char_length(btrim(display_name)) >= 1) AND (char_length(btrim(display_name)) <= 100))))
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    member_id uuid
);


--
-- Name: record_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.record_comments (
    id uuid NOT NULL,
    owner_id uuid NOT NULL,
    record_id uuid NOT NULL,
    author_member_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT record_comments_body_length CHECK (((char_length(body) >= 1) AND (char_length(body) <= 1000))),
    CONSTRAINT record_comments_body_trimmed CHECK ((body = btrim(body)))
);


--
-- Name: record_places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.record_places (
    record_id uuid NOT NULL,
    place_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: record_regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.record_regions (
    record_id uuid NOT NULL,
    region_code text NOT NULL,
    region_name text NOT NULL,
    region_label text NOT NULL,
    region_latitude double precision NOT NULL,
    region_longitude double precision NOT NULL,
    selected_directly boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT record_regions_region_code_format CHECK ((region_code ~ '^[0-9]{10}$'::text)),
    CONSTRAINT record_regions_region_label_length CHECK (((char_length(btrim(region_label)) >= 1) AND (char_length(btrim(region_label)) <= 100))),
    CONSTRAINT record_regions_region_latitude_range CHECK (((region_latitude >= ('-90'::integer)::double precision) AND (region_latitude <= (90)::double precision))),
    CONSTRAINT record_regions_region_longitude_range CHECK (((region_longitude >= ('-180'::integer)::double precision) AND (region_longitude <= (180)::double precision))),
    CONSTRAINT record_regions_region_name_length CHECK (((char_length(btrim(region_name)) >= 1) AND (char_length(btrim(region_name)) <= 200)))
);


--
-- Name: records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    recorded_at date NOT NULL,
    activity text NOT NULL,
    memo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    region_code text NOT NULL,
    region_name text NOT NULL,
    region_latitude double precision NOT NULL,
    region_longitude double precision NOT NULL,
    region_label text NOT NULL,
    recorded_until date,
    weather text DEFAULT 'sunny'::text NOT NULL,
    author_member_id uuid,
    category text DEFAULT 'uncategorized'::text NOT NULL,
    CONSTRAINT records_activity_length CHECK (((char_length(btrim(activity)) >= 1) AND (char_length(btrim(activity)) <= 120))),
    CONSTRAINT records_category_check CHECK ((category = ANY (ARRAY['daily'::text, 'date'::text, 'travel'::text, 'anniversary'::text, 'gathering'::text, 'uncategorized'::text]))),
    CONSTRAINT records_memo_length CHECK (((memo IS NULL) OR (char_length(memo) <= 500))),
    CONSTRAINT records_recorded_until_check CHECK (((recorded_until IS NULL) OR (recorded_until >= recorded_at))),
    CONSTRAINT records_region_code_format CHECK ((region_code ~ '^[0-9]{10}$'::text)),
    CONSTRAINT records_region_label_length CHECK (((char_length(btrim(region_label)) >= 1) AND (char_length(btrim(region_label)) <= 100))),
    CONSTRAINT records_region_latitude_range CHECK (((region_latitude >= ('-90'::integer)::double precision) AND (region_latitude <= (90)::double precision))),
    CONSTRAINT records_region_longitude_range CHECK (((region_longitude >= ('-180'::integer)::double precision) AND (region_longitude <= (180)::double precision))),
    CONSTRAINT records_region_name_length CHECK (((char_length(btrim(region_name)) >= 1) AND (char_length(btrim(region_name)) <= 200))),
    CONSTRAINT records_weather_check CHECK ((weather = ANY (ARRAY['sunny'::text, 'partly_cloudy'::text, 'cloudy'::text, 'rainy'::text, 'snowy'::text])))
);


--
-- Name: account_members account_members_owner_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_members
    ADD CONSTRAINT account_members_owner_id_id_key UNIQUE (owner_id, id);


--
-- Name: account_members account_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_members
    ADD CONSTRAINT account_members_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: record_comments record_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_comments
    ADD CONSTRAINT record_comments_pkey PRIMARY KEY (id);


--
-- Name: record_places record_places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_places
    ADD CONSTRAINT record_places_pkey PRIMARY KEY (record_id, place_id);


--
-- Name: record_regions record_regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_regions
    ADD CONSTRAINT record_regions_pkey PRIMARY KEY (record_id, region_code);


--
-- Name: records records_owner_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_owner_id_key UNIQUE (owner_id, id);


--
-- Name: records records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_pkey PRIMARY KEY (id);


--
-- Name: account_members_owner_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_members_owner_active_idx ON public.account_members USING btree (owner_id, is_active);


--
-- Name: account_members_owner_normalized_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX account_members_owner_normalized_name_key ON public.account_members USING btree (owner_id, lower(name));


--
-- Name: notifications_comment_recipient_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX notifications_comment_recipient_key ON public.notifications USING btree (comment_id, recipient_member_id) WHERE ((event_type = 'comment_created'::text) AND (comment_id IS NOT NULL));


--
-- Name: notifications_recipient_cursor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_recipient_cursor_idx ON public.notifications USING btree (owner_id, recipient_member_id, created_at DESC, id DESC);


--
-- Name: notifications_record_recipient_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX notifications_record_recipient_key ON public.notifications USING btree (record_id, recipient_member_id) WHERE (event_type = 'record_created'::text);


--
-- Name: notifications_sender_member_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_sender_member_idx ON public.notifications USING btree (owner_id, sender_member_id);


--
-- Name: notifications_unread_recipient_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_unread_recipient_idx ON public.notifications USING btree (owner_id, recipient_member_id) WHERE (read_at IS NULL);


--
-- Name: places_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_owner_id_idx ON public.places USING btree (owner_id);


--
-- Name: places_owner_provider_place_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX places_owner_provider_place_id_idx ON public.places USING btree (owner_id, provider, provider_place_id) WHERE (provider IS NOT NULL);


--
-- Name: places_owner_saved_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_owner_saved_name_idx ON public.places USING btree (owner_id, name) WHERE (saved_at IS NOT NULL);


--
-- Name: push_subscriptions_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX push_subscriptions_owner_id_idx ON public.push_subscriptions USING btree (owner_id);


--
-- Name: push_subscriptions_owner_member_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX push_subscriptions_owner_member_idx ON public.push_subscriptions USING btree (owner_id, member_id);


--
-- Name: record_comments_author_member_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX record_comments_author_member_idx ON public.record_comments USING btree (owner_id, author_member_id);


--
-- Name: record_comments_record_cursor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX record_comments_record_cursor_idx ON public.record_comments USING btree (owner_id, record_id, created_at DESC, id DESC);


--
-- Name: record_places_place_record_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX record_places_place_record_idx ON public.record_places USING btree (place_id, record_id);


--
-- Name: record_regions_region_code_record_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX record_regions_region_code_record_idx ON public.record_regions USING btree (region_code, record_id);


--
-- Name: records_owner_author_member_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX records_owner_author_member_idx ON public.records USING btree (owner_id, author_member_id);


--
-- Name: records_owner_recorded_at_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX records_owner_recorded_at_id_idx ON public.records USING btree (owner_id, recorded_at DESC, created_at DESC, id DESC);


--
-- Name: records_owner_region_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX records_owner_region_code_idx ON public.records USING btree (owner_id, region_code);


--
-- Name: account_members account_members_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER account_members_set_updated_at BEFORE UPDATE ON public.account_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: places places_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER places_set_updated_at BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: profiles profiles_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: push_subscriptions push_subscriptions_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER push_subscriptions_set_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: record_places record_places_cleanup_unlinked_place; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER record_places_cleanup_unlinked_place AFTER DELETE ON public.record_places FOR EACH ROW EXECUTE FUNCTION public.cleanup_unlinked_record_place();


--
-- Name: records records_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER records_set_updated_at BEFORE UPDATE ON public.records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: account_members account_members_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_members
    ADD CONSTRAINT account_members_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.record_comments(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_owner_recipient_member_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_owner_recipient_member_fkey FOREIGN KEY (owner_id, recipient_member_id) REFERENCES public.account_members(owner_id, id);


--
-- Name: notifications notifications_owner_sender_member_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_owner_sender_member_fkey FOREIGN KEY (owner_id, sender_member_id) REFERENCES public.account_members(owner_id, id);


--
-- Name: notifications notifications_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.records(id) ON DELETE SET NULL;


--
-- Name: places places_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_owner_member_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_owner_member_fkey FOREIGN KEY (owner_id, member_id) REFERENCES public.account_members(owner_id, id);


--
-- Name: record_comments record_comments_owner_author_member_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_comments
    ADD CONSTRAINT record_comments_owner_author_member_fkey FOREIGN KEY (owner_id, author_member_id) REFERENCES public.account_members(owner_id, id);


--
-- Name: record_comments record_comments_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_comments
    ADD CONSTRAINT record_comments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: record_comments record_comments_owner_record_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_comments
    ADD CONSTRAINT record_comments_owner_record_fkey FOREIGN KEY (owner_id, record_id) REFERENCES public.records(owner_id, id) ON DELETE CASCADE;


--
-- Name: record_places record_places_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_places
    ADD CONSTRAINT record_places_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: record_places record_places_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_places
    ADD CONSTRAINT record_places_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.records(id) ON DELETE CASCADE;


--
-- Name: record_regions record_regions_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.record_regions
    ADD CONSTRAINT record_regions_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.records(id) ON DELETE CASCADE;


--
-- Name: records records_owner_author_member_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_owner_author_member_fkey FOREIGN KEY (owner_id, author_member_id) REFERENCES public.account_members(owner_id, id);


--
-- Name: records records_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: record_comments Users create comments for their own records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users create comments for their own records" ON public.record_comments FOR INSERT TO authenticated WITH CHECK (((owner_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.records record
  WHERE ((record.id = record_comments.record_id) AND (record.owner_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.account_members member
  WHERE ((member.id = record_comments.author_member_id) AND (member.owner_id = ( SELECT auth.uid() AS uid)) AND member.is_active)))));


--
-- Name: record_comments Users delete their own record comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete their own record comments" ON public.record_comments FOR DELETE TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: record_places Users manage links between their own records and places; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage links between their own records and places" ON public.record_places TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.records
  WHERE ((records.id = record_places.record_id) AND (records.owner_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.places
  WHERE ((places.id = record_places.place_id) AND (places.owner_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM public.records
  WHERE ((records.id = record_places.record_id) AND (records.owner_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.places
  WHERE ((places.id = record_places.place_id) AND (places.owner_id = ( SELECT auth.uid() AS uid)))))));


--
-- Name: record_regions Users manage regions of their own records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage regions of their own records" ON public.record_regions TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.records
  WHERE ((records.id = record_regions.record_id) AND (records.owner_id = ( SELECT auth.uid() AS uid)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.records
  WHERE ((records.id = record_regions.record_id) AND (records.owner_id = ( SELECT auth.uid() AS uid))))));


--
-- Name: places Users manage their own places; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own places" ON public.places TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: profiles Users manage their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own profile" ON public.profiles TO authenticated USING ((id = ( SELECT auth.uid() AS uid))) WITH CHECK ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: push_subscriptions Users manage their own push subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own push subscriptions" ON public.push_subscriptions TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: records Users manage their own records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own records" ON public.records TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: account_members Users read their own account members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read their own account members" ON public.account_members FOR SELECT TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: notifications Users read their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read their own notifications" ON public.notifications FOR SELECT TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: record_comments Users read their own record comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read their own record comments" ON public.record_comments FOR SELECT TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: account_members Users update their own account members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update their own account members" ON public.account_members FOR UPDATE TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: notifications Users update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));


--
-- Name: account_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: places; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: record_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.record_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: record_places; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.record_places ENABLE ROW LEVEL SECURITY;

--
-- Name: record_regions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.record_regions ENABLE ROW LEVEL SECURITY;

--
-- Name: records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

-- Reset platform default grants before restoring the existing application privileges.
REVOKE ALL ON TABLE public.account_members, public.notifications, public.places, public.profiles, public.push_subscriptions, public.record_comments, public.record_places, public.record_regions, public.records FROM PUBLIC, anon, authenticated;

--
-- Name: SCHEMA private; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA private TO authenticated;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO authenticated;


--
-- Name: FUNCTION create_comment_notifications(p_comment_id uuid, p_sender_member_id uuid); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.create_comment_notifications(p_comment_id uuid, p_sender_member_id uuid) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION private.create_comment_notifications(p_comment_id uuid, p_sender_member_id uuid) TO authenticated;


--
-- Name: FUNCTION create_record_notifications(p_record_id uuid, p_sender_member_id uuid); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.create_record_notifications(p_record_id uuid, p_sender_member_id uuid) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION private.create_record_notifications(p_record_id uuid, p_sender_member_id uuid) TO authenticated;


--
-- Name: FUNCTION prepare_owned_record_places(p_places jsonb); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.prepare_owned_record_places(p_places jsonb) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION private.prepare_owned_record_places(p_places jsonb) TO authenticated;


--
-- Name: FUNCTION setup_account_members(p_names text[]); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.setup_account_members(p_names text[]) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION private.setup_account_members(p_names text[]) TO authenticated;


--
-- Name: FUNCTION sync_owned_record_regions(p_record_id uuid, p_regions jsonb); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.sync_owned_record_regions(p_record_id uuid, p_regions jsonb) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION private.sync_owned_record_regions(p_record_id uuid, p_regions jsonb) TO authenticated;


--
-- Name: FUNCTION cleanup_unlinked_record_place(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.cleanup_unlinked_record_place() FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.cleanup_unlinked_record_place() TO authenticated;


--
-- Name: FUNCTION create_owned_record(p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_owned_record(p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.create_owned_record(p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text) TO authenticated;


--
-- Name: FUNCTION create_owned_record(p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text, p_author_member_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_owned_record(p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text, p_author_member_id uuid) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.create_owned_record(p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text, p_author_member_id uuid) TO authenticated;


--
-- Name: FUNCTION create_owned_record_with_places(p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_author_member_id uuid, p_category text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_owned_record_with_places(p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_author_member_id uuid, p_category text) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.create_owned_record_with_places(p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_author_member_id uuid, p_category text) TO authenticated;


--
-- Name: FUNCTION create_record_comment(p_comment_id uuid, p_record_id uuid, p_body text, p_author_member_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_record_comment(p_comment_id uuid, p_record_id uuid, p_body text, p_author_member_id uuid) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.create_record_comment(p_comment_id uuid, p_record_id uuid, p_body text, p_author_member_id uuid) TO authenticated;


--
-- Name: FUNCTION delete_owned_record(p_record_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.delete_owned_record(p_record_id uuid) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.delete_owned_record(p_record_id uuid) TO authenticated;


--
-- Name: FUNCTION mark_all_notifications_read(p_recipient_member_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.mark_all_notifications_read(p_recipient_member_id uuid) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.mark_all_notifications_read(p_recipient_member_id uuid) TO authenticated;


--
-- Name: FUNCTION mark_notification_read(p_notification_id bigint, p_recipient_member_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.mark_notification_read(p_notification_id bigint, p_recipient_member_id uuid) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.mark_notification_read(p_notification_id bigint, p_recipient_member_id uuid) TO authenticated;


--
-- Name: FUNCTION remove_saved_place(p_place_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.remove_saved_place(p_place_id uuid) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.remove_saved_place(p_place_id uuid) TO authenticated;


--
-- Name: FUNCTION save_owned_places(p_places jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_owned_places(p_places jsonb) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.save_owned_places(p_places jsonb) TO authenticated;


--
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;


--
-- Name: FUNCTION setup_account_members(p_names text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.setup_account_members(p_names text[]) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.setup_account_members(p_names text[]) TO authenticated;


--
-- Name: FUNCTION update_owned_record(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_owned_record(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.update_owned_record(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_region_code text, p_region_name text, p_region_label text, p_region_latitude double precision, p_region_longitude double precision, p_activity text, p_memo text, p_place_ids uuid[], p_weather text) TO authenticated;


--
-- Name: FUNCTION update_owned_record_with_places(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_category text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_owned_record_with_places(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_category text) FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.update_owned_record_with_places(p_record_id uuid, p_recorded_at date, p_recorded_until date, p_regions jsonb, p_activity text, p_memo text, p_places jsonb, p_weather text, p_category text) TO authenticated;


--
-- Name: TABLE account_members; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.account_members TO authenticated;


--
-- Name: COLUMN account_members.name; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(name) ON TABLE public.account_members TO authenticated;


--
-- Name: COLUMN account_members.is_active; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(is_active) ON TABLE public.account_members TO authenticated;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.notifications TO authenticated;


--
-- Name: COLUMN notifications.read_at; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(read_at) ON TABLE public.notifications TO authenticated;


--
-- Name: TABLE places; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.places TO authenticated;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.profiles TO authenticated;


--
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.push_subscriptions TO authenticated;


--
-- Name: TABLE record_comments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,DELETE ON TABLE public.record_comments TO authenticated;


--
-- Name: COLUMN record_comments.id; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(id) ON TABLE public.record_comments TO authenticated;


--
-- Name: COLUMN record_comments.owner_id; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(owner_id) ON TABLE public.record_comments TO authenticated;


--
-- Name: COLUMN record_comments.record_id; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(record_id) ON TABLE public.record_comments TO authenticated;


--
-- Name: COLUMN record_comments.author_member_id; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(author_member_id) ON TABLE public.record_comments TO authenticated;


--
-- Name: COLUMN record_comments.body; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(body) ON TABLE public.record_comments TO authenticated;


--
-- Name: TABLE record_places; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.record_places TO authenticated;


--
-- Name: TABLE record_regions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.record_regions TO authenticated;


--
-- Name: TABLE records; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.records TO authenticated;


--
-- PostgreSQL database dump complete
--


GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.places TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.profiles TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.push_subscriptions TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.record_places TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.record_regions TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE ON TABLE public.records TO authenticated;

-- Supabase-managed helper: preserve the historical execute restriction when it exists.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END;
$$;

RESET ALL;
