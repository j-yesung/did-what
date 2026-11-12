begin;
do $$
declare
  test_owner uuid := gen_random_uuid();
  test_subscription uuid := gen_random_uuid();
  claimed integer;
begin
  insert into auth.users (id) values (test_owner);
  insert into public.push_subscriptions (id, owner_id, endpoint, p256dh, auth_key)
  values (test_subscription, test_owner, 'https://push.example/reminder-test', 'test-key', 'test-auth');

  if has_table_privilege('anon', 'public.daily_push_deliveries', 'SELECT')
    or has_table_privilege('authenticated', 'public.daily_push_deliveries', 'INSERT')
    or has_table_privilege('authenticated', 'public.daily_push_deliveries', 'DELETE') then
    raise exception '클라이언트가 예약 발송 이력에 접근할 수 있음';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.daily_push_deliveries'::regclass) then
    raise exception '예약 발송 이력의 RLS가 꺼져 있음';
  end if;

  set local role service_role;
  insert into public.daily_push_deliveries values ('2026-11-12', test_subscription)
  on conflict (reminder_date, subscription_id) do nothing;
  get diagnostics claimed = row_count;
  if claimed <> 1 then raise exception '첫 발송 권한 획득 실패'; end if;

  insert into public.daily_push_deliveries values ('2026-11-12', test_subscription)
  on conflict (reminder_date, subscription_id) do nothing;
  get diagnostics claimed = row_count;
  if claimed <> 0 then raise exception '같은 날 발송 권한 중복 획득'; end if;

  insert into public.daily_push_deliveries values ('2026-11-13', test_subscription);
  delete from public.daily_push_deliveries where reminder_date = '2026-11-12' and subscription_id = test_subscription;
  insert into public.daily_push_deliveries values ('2026-11-12', test_subscription);
  reset role;

  delete from public.push_subscriptions where id = test_subscription;
  if exists (select 1 from public.daily_push_deliveries where subscription_id = test_subscription) then
    raise exception '구독 삭제 후 발송 이력이 남음';
  end if;

  if not exists (select 1 from cron.job where jobname = 'daily-push-reminder' and schedule = '0 0 * * *') then
    raise exception '한국 시간 오전 9시 예약 작업이 없음';
  end if;
end;
$$;
rollback;
