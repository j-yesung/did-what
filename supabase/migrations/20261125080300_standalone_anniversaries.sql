create table public.anniversaries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  date date not null check (date between date '0001-01-01' and date '9999-12-31'),
  created_at timestamptz not null default now()
);

create index anniversaries_owner_date_idx on public.anniversaries (owner_id, date, id);
alter table public.anniversaries enable row level security;

revoke all on public.anniversaries from anon, authenticated;
grant select, insert, delete on public.anniversaries to authenticated;
grant all on public.anniversaries to service_role;

create policy anniversaries_select_owned on public.anniversaries
  for select to authenticated using (owner_id = (select auth.uid()));
create policy anniversaries_insert_owned on public.anniversaries
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy anniversaries_delete_owned on public.anniversaries
  for delete to authenticated using (owner_id = (select auth.uid()));
