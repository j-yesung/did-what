create table public.daily_push_deliveries (
  reminder_date date not null,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  primary key (reminder_date, subscription_id)
);

alter table public.daily_push_deliveries enable row level security;
revoke all on table public.daily_push_deliveries from public, anon, authenticated;
grant select, insert, delete on table public.daily_push_deliveries to service_role;

create index daily_push_deliveries_subscription_idx
  on public.daily_push_deliveries(subscription_id);

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- UTC 00:00 = 한국 시간 09:00. Vault 설정 전에는 HTTP 요청을 보내지 않는다.
select cron.schedule(
  'daily-push-reminder',
  '0 0 * * *',
  $$
    select net.http_post(
      url := rtrim(app_url.decrypted_secret, '/') || '/api/cron/daily-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || cron_secret.decrypted_secret
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    )
    from vault.decrypted_secrets app_url
    cross join vault.decrypted_secrets cron_secret
    where app_url.name = 'daily_reminder_app_url'
      and cron_secret.name = 'daily_reminder_cron_secret';
  $$
);
