create unique index places_owner_provider_place_id_idx
on public.places (owner_id, provider, provider_place_id)
where provider is not null;
