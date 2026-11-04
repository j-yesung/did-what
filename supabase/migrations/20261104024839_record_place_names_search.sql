create function public.place_names(public.records)
returns text
language sql
stable
set search_path = ''
as $$
  select string_agg(p.name, E'\n')
  from public.record_places rp
  join public.places p on p.id = rp.place_id
  where rp.record_id = $1.id
$$;

revoke all on function public.place_names(public.records) from public, anon, authenticated;
grant execute on function public.place_names(public.records) to authenticated;
