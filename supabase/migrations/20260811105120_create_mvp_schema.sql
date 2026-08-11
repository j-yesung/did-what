create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(btrim(display_name)) between 1 and 100
  )
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_name_length check (char_length(btrim(name)) between 1 and 100)
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  region text,
  district text,
  provider text,
  provider_place_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_name_length check (char_length(btrim(name)) between 1 and 200),
  constraint places_latitude_range check (latitude between -90 and 90),
  constraint places_longitude_range check (longitude between -180 and 180),
  constraint places_provider_pair check ((provider is null) = (provider_place_id is null))
);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  place_id uuid not null references public.places (id)
    on delete no action deferrable initially deferred,
  recorded_at date not null,
  activity text not null,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint records_activity_length check (char_length(btrim(activity)) between 1 and 120),
  constraint records_memo_length check (memo is null or char_length(memo) <= 500)
);

create table public.record_people (
  record_id uuid not null references public.records (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (record_id, person_id)
);

create index people_owner_id_idx on public.people (owner_id);
create index places_owner_id_idx on public.places (owner_id);
create index records_owner_recorded_at_idx on public.records (owner_id, recorded_at desc, created_at desc);
create index records_place_recorded_at_idx on public.records (place_id, recorded_at desc);
create index record_people_person_record_idx on public.record_people (person_id, record_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger people_set_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create trigger places_set_updated_at
before update on public.places
for each row execute function public.set_updated_at();

create trigger records_set_updated_at
before update on public.records
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.people enable row level security;
alter table public.places enable row level security;
alter table public.records enable row level security;
alter table public.record_people enable row level security;

revoke all on table public.profiles, public.people, public.places, public.records, public.record_people from anon;
grant select, insert, update, delete on table
  public.profiles,
  public.people,
  public.places,
  public.records,
  public.record_people
to authenticated;

create policy "Users manage their own profile"
on public.profiles
for all
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Users manage their own people"
on public.people
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Users manage their own places"
on public.places
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Users manage their own records"
on public.records
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.places
    where places.id = records.place_id
      and places.owner_id = (select auth.uid())
  )
);

create policy "Users manage links between their own records and people"
on public.record_people
for all
to authenticated
using (
  exists (
    select 1
    from public.records
    where records.id = record_people.record_id
      and records.owner_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.people
    where people.id = record_people.person_id
      and people.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.records
    where records.id = record_people.record_id
      and records.owner_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.people
    where people.id = record_people.person_id
      and people.owner_id = (select auth.uid())
  )
);
