alter table public.member_home_addresses
  add column latitude double precision,
  add column longitude double precision,
  add constraint member_home_addresses_coordinates_check check (
    (latitude is null and longitude is null)
    or (latitude between 33 and 39 and longitude between 124 and 132)
  );
