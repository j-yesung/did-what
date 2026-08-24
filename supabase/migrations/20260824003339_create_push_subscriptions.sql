create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_label_length check (
    label is null or char_length(btrim(label)) between 1 and 100
  )
);

create index push_subscriptions_owner_id_idx on public.push_subscriptions (owner_id);

create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;

revoke all on table public.push_subscriptions from anon;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;

create policy "Users manage their own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
