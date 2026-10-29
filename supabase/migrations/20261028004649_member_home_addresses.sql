create table public.member_home_addresses (
  owner_id uuid not null,
  member_id uuid not null,
  address text not null check (char_length(btrim(address)) between 5 and 200 and address = btrim(address)),
  updated_at timestamptz not null default now(),
  primary key (owner_id, member_id),
  foreign key (owner_id, member_id) references public.account_members(owner_id, id) on delete cascade
);

alter table public.member_home_addresses enable row level security;
revoke all on public.member_home_addresses from public, anon;
grant select, insert, update, delete on public.member_home_addresses to authenticated;
create policy "Account owners manage member home addresses"
  on public.member_home_addresses for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
