-- 공유 계정 안에서 구성원별 기록 작성자와 알림 읽음 상태를 구분한다.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.account_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_members_owner_id_id_key unique (owner_id, id),
  constraint account_members_name_trimmed check (name = btrim(name)),
  constraint account_members_name_length check (char_length(name) between 1 and 100)
);

create unique index account_members_owner_normalized_name_key
on public.account_members (owner_id, lower(name));

create index account_members_owner_active_idx
on public.account_members (owner_id, is_active);

create trigger account_members_set_updated_at
before update on public.account_members
for each row execute function public.set_updated_at();

alter table public.records
add column author_member_id uuid,
add constraint records_owner_author_member_fkey
  foreign key (owner_id, author_member_id)
  references public.account_members (owner_id, id);

create index records_author_member_id_idx
on public.records (author_member_id);

alter table public.push_subscriptions
add column member_id uuid,
add constraint push_subscriptions_owner_member_fkey
  foreign key (owner_id, member_id)
  references public.account_members (owner_id, id);

create index push_subscriptions_member_id_idx
on public.push_subscriptions (member_id);

create table public.notifications (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  recipient_member_id uuid not null,
  sender_member_id uuid not null,
  sender_name text not null,
  record_id uuid references public.records (id) on delete set null,
  record_title text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_owner_recipient_member_fkey
    foreign key (owner_id, recipient_member_id)
    references public.account_members (owner_id, id),
  constraint notifications_owner_sender_member_fkey
    foreign key (owner_id, sender_member_id)
    references public.account_members (owner_id, id),
  constraint notifications_distinct_members check (recipient_member_id <> sender_member_id),
  constraint notifications_sender_name_trimmed check (sender_name = btrim(sender_name)),
  constraint notifications_sender_name_length check (char_length(sender_name) between 1 and 100),
  constraint notifications_record_title_trimmed check (record_title = btrim(record_title)),
  constraint notifications_record_title_length check (char_length(record_title) between 1 and 120),
  constraint notifications_record_recipient_key unique (record_id, recipient_member_id)
);

create index notifications_recipient_cursor_idx
on public.notifications (owner_id, recipient_member_id, created_at desc, id desc);

create index notifications_sender_member_idx
on public.notifications (owner_id, sender_member_id);

create index notifications_unread_recipient_idx
on public.notifications (owner_id, recipient_member_id)
where read_at is null;

alter table public.account_members enable row level security;
alter table public.notifications enable row level security;

revoke all on table public.account_members, public.notifications from anon;
revoke all on table public.account_members, public.notifications from authenticated;

grant select on table public.account_members to authenticated;
grant update (name, is_active) on table public.account_members to authenticated;

grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

create policy "Users read their own account members"
on public.account_members
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Users update their own account members"
on public.account_members
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Users read their own notifications"
on public.notifications
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Users update their own notifications"
on public.notifications
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create function private.setup_account_members(p_names text[])
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
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

revoke all on function private.setup_account_members(text[]) from public, anon;
grant execute on function private.setup_account_members(text[]) to authenticated;

create function public.setup_account_members(p_names text[])
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.setup_account_members(p_names);
$$;

revoke all on function public.setup_account_members(text[]) from public, anon;
grant execute on function public.setup_account_members(text[]) to authenticated;

create function private.create_record_notifications(
  p_record_id uuid,
  p_sender_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
  on conflict (record_id, recipient_member_id) do nothing;
end;
$$;

revoke all on function private.create_record_notifications(uuid, uuid) from public, anon;
grant execute on function private.create_record_notifications(uuid, uuid) to authenticated;

create function public.create_owned_record(
  p_recorded_at date,
  p_recorded_until date,
  p_region_code text,
  p_region_name text,
  p_region_label text,
  p_region_latitude double precision,
  p_region_longitude double precision,
  p_activity text,
  p_memo text,
  p_place_ids uuid[],
  p_weather text,
  p_author_member_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
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

revoke all on function public.create_owned_record(
  date, date, text, text, text, double precision, double precision, text, text, uuid[], text, uuid
) from public, anon;
grant execute on function public.create_owned_record(
  date, date, text, text, text, double precision, double precision, text, text, uuid[], text, uuid
) to authenticated;

create function public.mark_notification_read(
  p_notification_id bigint,
  p_recipient_member_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
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

revoke all on function public.mark_notification_read(bigint, uuid) from public, anon;
grant execute on function public.mark_notification_read(bigint, uuid) to authenticated;

create function public.mark_all_notifications_read(p_recipient_member_id uuid)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
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

revoke all on function public.mark_all_notifications_read(uuid) from public, anon;
grant execute on function public.mark_all_notifications_read(uuid) to authenticated;
