-- RETURNS TABLE의 id 출력 변수와 충돌하지 않도록 기본 키 제약 조건을 직접 지정한다.

create or replace function public.create_record_comment(
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
