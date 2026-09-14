-- 기록 상세에서 구성원별 댓글을 작성하고 최초 등록 시 다른 구성원에게 알린다.

alter table public.records
add constraint records_owner_id_key unique (owner_id, id);

create table public.record_comments (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  record_id uuid not null,
  author_member_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint record_comments_owner_record_fkey
    foreign key (owner_id, record_id)
    references public.records (owner_id, id)
    on delete cascade,
  constraint record_comments_owner_author_member_fkey
    foreign key (owner_id, author_member_id)
    references public.account_members (owner_id, id),
  constraint record_comments_body_trimmed check (body = btrim(body)),
  constraint record_comments_body_length check (char_length(body) between 1 and 1000)
);

create index record_comments_record_cursor_idx
on public.record_comments (owner_id, record_id, created_at desc, id desc);

create index record_comments_author_member_idx
on public.record_comments (owner_id, author_member_id);

create trigger record_comments_set_updated_at
before update on public.record_comments
for each row execute function public.set_updated_at();

alter table public.record_comments enable row level security;

revoke all on table public.record_comments from anon, authenticated;
grant select on table public.record_comments to authenticated;
grant insert (id, owner_id, record_id, author_member_id, body) on table public.record_comments to authenticated;
grant update (body) on table public.record_comments to authenticated;
grant delete on table public.record_comments to authenticated;

create policy "Users read their own record comments"
on public.record_comments
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "Users create comments for their own records"
on public.record_comments
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.records as record
    where record.id = record_comments.record_id
      and record.owner_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.account_members as member
    where member.id = record_comments.author_member_id
      and member.owner_id = (select auth.uid())
      and member.is_active
  )
);

create policy "Users update their own record comments"
on public.record_comments
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Users delete their own record comments"
on public.record_comments
for delete
to authenticated
using (owner_id = (select auth.uid()));

alter table public.notifications
add column event_type text not null default 'record_created',
add column comment_id uuid references public.record_comments (id) on delete set null,
add constraint notifications_event_type_check
  check (event_type in ('record_created', 'comment_created')),
add constraint notifications_event_reference_check
  check (event_type = 'comment_created' or comment_id is null);

alter table public.notifications
drop constraint notifications_record_recipient_key;

create unique index notifications_record_recipient_key
on public.notifications (record_id, recipient_member_id)
where event_type = 'record_created';

create unique index notifications_comment_recipient_key
on public.notifications (comment_id, recipient_member_id)
where event_type = 'comment_created' and comment_id is not null;

create or replace function private.create_record_notifications(
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
  on conflict (record_id, recipient_member_id)
  where event_type = 'record_created'
  do nothing;
end;
$$;

create function private.create_comment_notifications(
  p_comment_id uuid,
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

revoke all on function private.create_comment_notifications(uuid, uuid) from public, anon;
grant execute on function private.create_comment_notifications(uuid, uuid) to authenticated;

create function public.create_record_comment(
  p_comment_id uuid,
  p_record_id uuid,
  p_body text,
  p_author_member_id uuid
)
returns table (
  id uuid,
  record_id uuid,
  author_member_id uuid,
  author_name text,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  created boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
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
  on conflict (id) do nothing
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

revoke all on function public.create_record_comment(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.create_record_comment(uuid, uuid, text, uuid) to authenticated;
