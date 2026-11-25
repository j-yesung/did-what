begin;
do $$
declare
  first_owner uuid := gen_random_uuid();
  second_owner uuid := gen_random_uuid();
  item_id uuid := gen_random_uuid();
begin
  insert into auth.users (id) values (first_owner), (second_owner);
  perform set_config('request.jwt.claim.sub', first_owner::text, true);
  set local role authenticated;
  insert into public.anniversaries (id, owner_id, name, date)
    values (item_id, first_owner, '기념일 권한 테스트', '2026-12-25');
  -- 같은 요청을 재시도해도 중복 생성하지 않는다.
  insert into public.anniversaries (id, owner_id, name, date)
    values (item_id, first_owner, '기념일 권한 테스트', '2026-12-25')
    on conflict (id) do nothing;
  if (select count(*) from public.anniversaries where id = item_id) <> 1 then
    raise exception '자기 기념일 조회 또는 중복 방지 실패';
  end if;

  perform set_config('request.jwt.claim.sub', second_owner::text, true);
  if exists (select 1 from public.anniversaries where id = item_id) then
    raise exception '다른 계정의 기념일 노출';
  end if;
  delete from public.anniversaries where id = item_id;
  begin
    insert into public.anniversaries (owner_id, name, date)
      values (first_owner, '소유자 위조', '2026-12-25');
    raise exception '다른 계정으로 기념일 등록 허용';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', first_owner::text, true);
  if not exists (select 1 from public.anniversaries where id = item_id) then
    raise exception '다른 계정에서 기념일 삭제됨';
  end if;
  begin
    insert into public.anniversaries (owner_id, name, date) values (first_owner, ' ', '2026-12-25');
    raise exception '빈 이름 허용';
  exception when check_violation then null;
  end;
  delete from public.anniversaries where id = item_id;
  if exists (select 1 from public.anniversaries where id = item_id) then
    raise exception '본인 기념일 삭제 실패';
  end if;
  reset role;
end;
$$;
rollback;
