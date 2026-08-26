alter table public.places
  add column region_name text,
  add constraint places_region_name_length
    check (region_name is null or char_length(btrim(region_name)) between 1 and 200);

update public.places as place
set region_name = region.region_name
from (
  select distinct on (owner_id, region_code)
    owner_id,
    region_code,
    region_name
  from public.records
  order by owner_id, region_code, recorded_at desc
) as region
where place.owner_id = region.owner_id
  and place.region_code = region.region_code;
