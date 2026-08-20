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
language sql
security invoker
set search_path = ''
as $$
  select public.create_owned_record(
    p_recorded_at, null::date, p_region_code, p_region_name, p_region_label,
    p_region_latitude, p_region_longitude, p_activity, p_memo, p_person_ids, p_place_ids
  );
$$;

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
language sql
security invoker
set search_path = ''
as $$
  select public.update_owned_record(
    p_record_id, p_recorded_at, null::date, p_region_code, p_region_name, p_region_label,
    p_region_latitude, p_region_longitude, p_activity, p_memo, p_person_ids, p_place_ids
  );
$$;

revoke all on function public.create_owned_record(date, text, text, text, double precision, double precision, text, text, uuid[], uuid[]) from public, anon;
grant execute on function public.create_owned_record(date, text, text, text, double precision, double precision, text, text, uuid[], uuid[]) to authenticated;

revoke all on function public.update_owned_record(uuid, date, text, text, text, double precision, double precision, text, text, uuid[], uuid[]) from public, anon;
grant execute on function public.update_owned_record(uuid, date, text, text, text, double precision, double precision, text, text, uuid[], uuid[]) to authenticated;
