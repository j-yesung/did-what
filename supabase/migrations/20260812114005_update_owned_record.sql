create function public.update_owned_record(
  p_record_id uuid,
  p_recorded_at date,
  p_place_id uuid,
  p_activity text,
  p_memo text,
  p_person_ids uuid[]
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := auth.uid();
begin
  if current_owner_id is null or coalesce(cardinality(p_person_ids), 0) = 0 then
    return false;
  end if;

  if not exists (
    select 1
    from public.records
    where id = p_record_id
      and owner_id = current_owner_id
  ) or not exists (
    select 1
    from public.places
    where id = p_place_id
      and owner_id = current_owner_id
  ) or exists (
    select 1
    from unnest(p_person_ids) as selected(person_id)
    where not exists (
      select 1
      from public.people
      where id = selected.person_id
        and owner_id = current_owner_id
    )
  ) then
    return false;
  end if;

  update public.records
  set recorded_at = p_recorded_at,
      place_id = p_place_id,
      activity = p_activity,
      memo = p_memo
  where id = p_record_id
    and owner_id = current_owner_id;

  delete from public.record_people
  where record_id = p_record_id;

  insert into public.record_people (record_id, person_id)
  select p_record_id, selected.person_id
  from (
    select distinct person_id
    from unnest(p_person_ids) as input(person_id)
  ) as selected;

  return true;
end;
$$;

revoke all on function public.update_owned_record(uuid, date, uuid, text, text, uuid[]) from public, anon;
grant execute on function public.update_owned_record(uuid, date, uuid, text, text, uuid[]) to authenticated;
