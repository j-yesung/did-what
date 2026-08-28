-- 기록에만 사용된 장소와 사용자가 저장한 장소의 생명주기를 분리한다.
-- 기록 연결이 사라질 때 저장하지 않은 장소만 정리하고, saved_at이 있는 장소는 유지한다.

create or replace function public.cleanup_unlinked_record_place()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
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

revoke all on function public.cleanup_unlinked_record_place() from public, anon;
grant execute on function public.cleanup_unlinked_record_place() to authenticated;

drop trigger if exists record_places_cleanup_unlinked_place on public.record_places;

create trigger record_places_cleanup_unlinked_place
after delete on public.record_places
for each row execute function public.cleanup_unlinked_record_place();

create or replace function public.delete_owned_record(p_record_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
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

revoke all on function public.delete_owned_record(uuid) from public, anon;
grant execute on function public.delete_owned_record(uuid) to authenticated;

create or replace function public.remove_saved_place(p_place_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
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

revoke all on function public.remove_saved_place(uuid) from public, anon;
grant execute on function public.remove_saved_place(uuid) to authenticated;
